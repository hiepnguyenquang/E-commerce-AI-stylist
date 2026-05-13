import os
import threading
from contextlib import asynccontextmanager
import time

print("[Startup] Loading FastAPI...")
from fastapi import FastAPI, Header, HTTPException, Security, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

print("[Startup] Loading dotenv...")
from dotenv import load_dotenv

# Nạp biến môi trường từ .env TRƯỚC KHI import bất kỳ module cục bộ nào
load_dotenv()

print("[Startup] Loading LanceDB...")
import lancedb

print("[Startup] Loading Pika...")
import pika

print("[Startup] Loading Stylist routes (and LLM/Search)...")
from src.api.routes import stylist

INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your_super_secret_internal_key_here")
LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@127.0.0.1:5672")

print("[Startup] Connecting to LanceDB...")
# Khởi tạo LanceDB connection cục bộ
db = lancedb.connect(LANCEDB_URI)

import json
print("[Startup] Loading LocalCatVTONAdapter (this imports PyTorch and Diffusers, may take a while on WSL2)...")
from src.ai.vton import LocalCatVTONAdapter

print("[Startup] Loading LLM and Embedding services...")
from src.ai.llm_client import get_intent_analyzer
from src.ai.embedding import get_embedding_service
from src.database.schema import products_schema, closet_schema
import requests

print("[Startup] All global imports completed.")

def get_host_ip() -> str:
    import platform
    import subprocess
    try:
        if "microsoft" in platform.uname().release.lower():
            output = subprocess.check_output(["ip", "route", "show", "default"], text=True)
            parts = output.split()
            if "via" in parts:
                return parts[parts.index("via") + 1]
    except Exception:
        pass
    return "127.0.0.1"

def start_closet_consumer():
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='closet_metadata_sync', durable=True)
        
        intent_analyzer = get_intent_analyzer()
        embedder = get_embedding_service()
        
        def callback(ch, method, properties, body):
            print(f"\n[Closet Consumer] Received closet metadata sync event:\n{body.decode()}\n")
            try:
                payload = json.loads(body.decode())
                event_type = payload.get("event_type", "")
                data = payload.get("data", {})
                
                item_id = data.get("id")
                user_id = data.get("user_id")
                
                if not item_id or not user_id:
                    raise ValueError("Missing item_id or user_id in payload")

                if event_type == "closet_item_deleted":
                    print(f"[Closet Consumer] Deleting closet item {item_id} from LanceDB...")
                    table_name = "closet_vector"
                    if table_name in db.table_names():
                        table = db.open_table(table_name)
                        table.delete(f"id = '{item_id}'")
                        print(f"[Closet Consumer] Deleted closet item {item_id} successfully.")
                    else:
                        print(f"[Closet Consumer] Table '{table_name}' does not exist. Skipped deletion.")
                else:
                    image_url = data.get("image_url", "")
                    base_category = data.get("category", "unknown")
                    description = data.get("description", "")
                    
                    print(f"[Closet Consumer] Downloading and analyzing closet item {item_id}...")
                    
                    # Download image bytes (assuming image_url is accessible from AI service)
                    host_ip = get_host_ip()
                    medusa_url = os.getenv("MEDUSA_BACKEND_URL", f"http://{host_ip}:9000")
                    full_image_url = f"{medusa_url}{image_url}" if image_url.startswith("/") else image_url
                    img_response = requests.get(full_image_url)
                    img_response.raise_for_status()
                    image_bytes = img_response.content
                    
                    # Analyze image with Vision LLM
                    extracted_meta = intent_analyzer.analyze_closet_image(image_bytes)
                    
                    category = extracted_meta.get("category", base_category)
                    color = extracted_meta.get("color", "unknown")
                    style = extracted_meta.get("style", [])
                    pattern = extracted_meta.get("pattern", "unknown")
                    material = extracted_meta.get("material", "unknown")
                    
                    # Embed metadata
                    text_to_embed = (
                        f"Danh mục: {category}. "
                        f"Màu sắc: {color}. "
                        f"Phong cách: {', '.join(style)}. "
                        f"Họa tiết: {pattern}. "
                        f"Chất liệu: {material}."
                    )
                    if description:
                        text_to_embed += f" Mô tả: {description}."
                        
                    print(f"[Closet Consumer] Embedding text: {text_to_embed}")
                    vector = embedder.embed_text(text_to_embed)
                    
                    # Save to LanceDB
                    table_name = "closet_vector"
                    if table_name not in db.table_names():
                        print(f"[Closet Consumer] Creating LanceDB table '{table_name}'...")
                        table = db.create_table(table_name, schema=closet_schema)
                    else:
                        table = db.open_table(table_name)
                        
                    record = [{
                        "id": item_id,
                        "user_id": user_id,
                        "vector": vector,
                        "category": category,
                        "color": color,
                        "pattern": pattern,
                        "style": style,
                        "material": material,
                        "image_url": image_url
                    }]
                    
                    table.delete(f"id = '{item_id}'")
                    table.add(record)
                    
                    print(f"[Closet Consumer] Closet item {item_id} synced to LanceDB successfully.")
                
            except Exception as ex:
                print(f"[Closet Consumer] Lỗi xử lý đồng bộ tủ đồ: {ex}")
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='closet_metadata_sync', on_message_callback=callback)
        
        print("[Closet Consumer] Started listening on 'closet_metadata_sync'...")
        channel.start_consuming()
    except Exception as e:
        print(f"[Closet Consumer] Failed to connect: {e}")

def start_rabbitmq_consumer():
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='product_metadata_sync', durable=True)
        
        # Khởi tạo các services
        intent_analyzer = get_intent_analyzer()
        embedder = get_embedding_service()
        
        def callback(ch, method, properties, body):
            print(f"\n[RabbitMQ Consumer] Received product metadata sync event:\n{body.decode()}\n")
            try:
                payload = json.loads(body.decode())
                data = payload.get("data", {})
                metadata = payload.get("metadata", {})
                
                product_id = data.get("product_id")
                name = data.get("name", "")
                text_description = data.get("text_description", "")
                image_url = data.get("image_url", "")
                
                base_category = metadata.get("category", "")
                gender = metadata.get("gender", "unisex")
                
                if not product_id:
                    raise ValueError("Missing product_id in payload")

                print(f"[RabbitMQ Consumer] Analyzing product {product_id} with LLM...")
                # Bước 1: Trích xuất metadata (Prompt A)
                extracted_meta = intent_analyzer.extract_metadata(name, text_description, base_category)
                
                category = extracted_meta.get("category", base_category)
                color = extracted_meta.get("color", "unknown")
                style = extracted_meta.get("style", [])
                occasion = extracted_meta.get("occasion", [])
                material = extracted_meta.get("material", "unknown")
                
                # Bước 2: Tạo câu mô tả và nhúng vector
                text_to_embed = (
                    f"Tên: {name}. "
                    f"Danh mục: {category}. "
                    f"Phong cách: {', '.join(style)}. "
                    f"Phù hợp cho: {', '.join(occasion)}. "
                    f"Chất liệu: {material}. "
                    f"Màu sắc: {color}."
                )
                print(f"[RabbitMQ Consumer] Embedding text: {text_to_embed}")
                vector = embedder.embed_text(text_to_embed)
                
                # Bước 3: Lưu vào LanceDB
                table_name = "products_vector"
                if table_name not in db.table_names():
                    print(f"[RabbitMQ Consumer] Creating LanceDB table '{table_name}'...")
                    table = db.create_table(table_name, schema=products_schema)
                else:
                    table = db.open_table(table_name)
                    
                record = [{
                    "product_id": product_id,
                    "vector": vector,
                    "category": category,
                    "gender": gender,
                    "color": color,
                    "price": 0.0, # Mặc định hoặc lấy từ payload
                    "in_stock": True, # Giả định ban đầu
                    "style": style,
                    "occasion": occasion,
                    "material": material,
                    "name": name,
                    "image_url": image_url or ""
                }]
                
                # Trong LanceDB, dùng merge/update nếu đã tồn tại, MVP ta xóa rồi add lại hoặc append
                # Simple logic for MVP (delete if exists then add)
                table.delete(f"product_id = '{product_id}'")
                table.add(record)
                
                print(f"[RabbitMQ Consumer] Product {product_id} synced to LanceDB successfully.")
                
            except Exception as ex:
                print(f"[RabbitMQ Consumer] Lỗi xử lý đồng bộ: {ex}")
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        # Rất quan trọng: Giới hạn xử lý 1 message/lần để bảo vệ VRAM (đã định nghĩa trong architecture_rules)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue='product_metadata_sync', on_message_callback=callback)
        
        print("[RabbitMQ Consumer] Started listening on 'product_metadata_sync'...")
        channel.start_consuming()
    except Exception as e:
        print(f"[RabbitMQ Consumer] Failed to connect: {e}")

def start_vton_consumer():
    print("[VTON Consumer] Importing PyTorch and CatVTON (this may take a while on WSL2...)")
    from src.ai.vton import LocalCatVTONAdapter
    vton_service = LocalCatVTONAdapter()
    
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='ai_vision_jobs', durable=True)
        channel.queue_declare(queue='ai_vision_results', durable=True)
        
        def callback(ch, method, properties, body):
            payload_data = json.loads(body.decode())
            job_id = payload_data.get("job_id")
            user_id = payload_data.get("user_id")
            print(f"\n[VTON Consumer] Received job: {job_id}")
            
            try:
                # Mới: Payload lồng nhau từ MedusaJS theo cấu trúc CatVTON
                inner_payload = payload_data.get("payload", {})
                images = inner_payload.get("images", {})
                params = inner_payload.get("processing_params", {})
                
                human_url = images.get("person_image_url")
                garment_url = images.get("cloth_image_url")
                mask_url = images.get("mask_image_url")
                
                # Tham số CatVTON
                cloth_type = params.get("cloth_type", "upper")
                num_inference_steps = params.get("num_inference_steps", 50)
                guidance_scale = params.get("guidance_scale", 2.5)
                seed = params.get("seed", -1)
                width = params.get("width", 768)
                height = params.get("height", 1024)
                repaint = params.get("repaint", False)
                
                if not human_url or not garment_url:
                    raise ValueError("Missing person_image_url or cloth_image_url in payload")
                
                # Đảm bảo thư mục lưu trữ tồn tại
                output_dir = "./data/outputs/vton"
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, f"result_{job_id}.png")
                
                # Chạy inference
                result_path = vton_service.try_on(
                    human_image_url=human_url, 
                    garment_image_url=garment_url, 
                    output_path=output_path,
                    mask_image_url=mask_url,
                    cloth_type=cloth_type,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    seed=seed,
                    width=width,
                    height=height,
                    repaint=repaint
                )
                
                # Ở môi trường thực tế, ta cần upload result_path lên S3 hoặc Cloud Storage.
                # MVP: ta trả về một static URL trỏ vào thư mục outputs hoặc truyền base64,
                # nhưng để dễ tiếp cận từ Frontend, ta giả sử Medusa có một CDN hoặc ta chỉ cần path
                # Tạm thời trả về tên file và Medusa có thể host tĩnh hoặc Frontend load trực tiếp
                public_url = f"http://127.0.0.1:8000/static/vton/result_{job_id}.png"
                
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

def initialize_and_start_consumers():
    import time
    # Chờ 2 giây để Uvicorn hoàn tất khởi tạo event loop chính, tránh conflict với C-extensions
    time.sleep(2)
    
    print("[Startup] Sequential Background Initialization started...")
    
    # 1. Load CLIP Model
    print("[Startup] 1/2 Loading Embedding Service (CLIP)...")
    try:
        from src.ai.embedding import get_embedding_service
        get_embedding_service()
    except Exception as e:
        print(f"Error loading Embedding Service: {e}")

    # 2. Import VTON Model (thỏa mãn Global Import Lock trước khi thread con chạy)
    print("[Startup] 2/2 Pre-importing VTON dependencies (PyTorch)...")
    try:
        from src.ai.vton import LocalCatVTONAdapter
    except Exception as e:
        print(f"Error importing VTON Adapter: {e}")
        
    print("[Startup] Starting all consumer threads...")
    # Sau khi nạp xong vào RAM, các thread con lúc này khởi chạy sẽ cực kỳ an toàn
    threading.Thread(target=start_rabbitmq_consumer, daemon=True).start()
    threading.Thread(target=start_vton_consumer, daemon=True).start()
    threading.Thread(target=start_closet_consumer, daemon=True).start()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("AI Service is starting up...")
    
    # Chỉ khởi tạo 1 luồng duy nhất để phân bổ các model nặng tuần tự, chống Deadlock!
    init_thread = threading.Thread(target=initialize_and_start_consumers, daemon=True)
    init_thread.start()
    
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
