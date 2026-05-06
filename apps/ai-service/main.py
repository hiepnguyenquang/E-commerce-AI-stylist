import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, Security, status
from pydantic import BaseModel
from dotenv import load_dotenv

import lancedb
import pika

from src.api.routes import stylist

load_dotenv()

INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your_super_secret_internal_key_here")
LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")

# Khởi tạo LanceDB connection cục bộ
db = lancedb.connect(LANCEDB_URI)

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("AI Service is starting up...")
    
    # Khởi tạo một luồng chạy ngầm (daemon thread) cho Consumer để không chặn event loop của FastAPI
    consumer_thread = threading.Thread(target=start_rabbitmq_consumer, daemon=True)
    consumer_thread.start()
    
    yield
    
    print("AI Service is shutting down...")

app = FastAPI(
    title="AI Fashion Service",
    description="Microservice for VTON and AI Stylist using FastAPI & LanceDB",
    version="1.0.0",
    lifespan=lifespan,
)

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
