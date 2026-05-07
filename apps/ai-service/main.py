import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, Security, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

# Nạp biến môi trường từ .env TRƯỚC KHI import bất kỳ module cục bộ nào
load_dotenv()

import lancedb
import pika

from src.api.routes import stylist

INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your_super_secret_internal_key_here")
LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")

# Khởi tạo LanceDB connection cục bộ
db = lancedb.connect(LANCEDB_URI)

import time
import json
from src.ai.vton import LocalCatVTONAdapter

def start_rabbitmq_consumer():
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='product_metadata_sync', durable=True)
        
        def callback(ch, method, properties, body):
            print(f"\n[RabbitMQ Consumer] Received product metadata sync event:\n{body.decode()}\n")
            # Ở Giai đoạn 5: Ta sẽ dùng LLM trích xuất tag (Prompt A) và lưu vào LanceDB tại đây.
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        # Rất quan trọng: Giới hạn xử lý 1 message/lần để bảo vệ VRAM (đã định nghĩa trong architecture_rules)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='product_metadata_sync', on_message_callback=callback)
        
        print("[RabbitMQ Consumer] Started listening on 'product_metadata_sync'...")
        channel.start_consuming()
    except Exception as e:
        print(f"[RabbitMQ Consumer] Failed to connect: {e}")

def start_vton_consumer():
    vton_service = LocalCatVTONAdapter()
    
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='ai_vision_jobs', durable=True)
        channel.queue_declare(queue='ai_vision_results', durable=True)
        
        def callback(ch, method, properties, body):
            payload = json.loads(body.decode())
            job_id = payload.get("job_id")
            user_id = payload.get("user_id")
            print(f"\n[VTON Consumer] Received job: {job_id}")
            
            try:
                human_url = payload.get("human_image_url")
                garment_url = payload.get("garment_image_url")
                
                # Đảm bảo thư mục lưu trữ tồn tại
                output_dir = "./data/outputs/vton"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, f"result_{job_id}.png")
                
                # Chạy inference
                result_path = vton_service.try_on(human_url, garment_url, output_path)
                
                # Ở môi trường thực tế, ta cần upload result_path lên S3 hoặc Cloud Storage.
                # MVP: ta trả về một static URL trỏ vào thư mục outputs hoặc truyền base64,
                # nhưng để dễ tiếp cận từ Frontend, ta giả sử Medusa có một CDN hoặc ta chỉ cần path
                # Tạm thời trả về tên file và Medusa có thể host tĩnh hoặc Frontend load trực tiếp
                public_url = f"http://localhost:8000/static/vton/result_{job_id}.png"
                
                result_payload = {
                    "job_id": job_id,
                    "user_id": user_id,
                    "status": "completed",
                    "result_image_url": public_url,
                    "error_message": None
                }
            except Exception as ex:
                print(f"[VTON Consumer] Lỗi khi xử lý job {job_id}: {ex}")
                result_payload = {
                    "job_id": job_id,
                    "user_id": user_id,
                    "status": "failed",
                    "result_image_url": None,
                    "error_message": str(ex)
                }
            
            # Gửi kết quả về queue ai_vision_results
            channel.basic_publish(
                exchange='',
                routing_key='ai_vision_results',
                body=json.dumps(result_payload),
                properties=pika.BasicProperties(
                    delivery_mode=2, # persistent
                )
            )
            print(f"[VTON Consumer] Sent result for job: {job_id}")
            
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='ai_vision_jobs', on_message_callback=callback)
        
        print("[VTON Consumer] Started listening on 'ai_vision_jobs'...")
        channel.start_consuming()
    except Exception as e:
        print(f"[VTON Consumer] Failed to connect: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("AI Service is starting up...")
    
    # Khởi tạo một luồng chạy ngầm (daemon thread) cho Consumer để không chặn event loop của FastAPI
    consumer_thread = threading.Thread(target=start_rabbitmq_consumer, daemon=True)
    consumer_thread.start()
    
    vton_consumer_thread = threading.Thread(target=start_vton_consumer, daemon=True)
    vton_consumer_thread.start()
    
    yield
    
    print("AI Service is shutting down...")

app = FastAPI(
    title="AI Fashion Service",
    description="Microservice for VTON and AI Stylist using FastAPI & LanceDB",
    version="1.0.0",
    lifespan=lifespan,
)

# Đảm bảo thư mục static tồn tại trước khi mount
os.makedirs("./data/outputs", exist_ok=True)
app.mount("/static", StaticFiles(directory="./data/outputs"), name="static")

app.include_router(stylist.router, prefix="/api/v1/stylist", tags=["stylist"])

async def verify_internal_token(x_internal_token: str = Header(None)):
    if x_internal_token != INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal token"
        )
    return x_internal_token

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", message="AI Service is running")

@app.get("/ping-db", dependencies=[Security(verify_internal_token)])
async def ping_db():
    # Kiểm tra LanceDB
    tables = db.table_names()
    return {"status": "ok", "tables": tables}
