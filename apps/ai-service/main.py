import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, Security, status
from pydantic import BaseModel
from dotenv import load_dotenv

import lancedb
import pika

load_dotenv()

INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your_super_secret_internal_key_here")
LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")

# Khởi tạo LanceDB connection cục bộ
db = lancedb.connect(LANCEDB_URI)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Kết nối RabbitMQ, Model Load...
    print("AI Service is starting up...")
    
    # Optional: Test RabbitMQ Connection
    # connection = pika.BlockingConnection(pika.URLParameters(os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")))
    # channel = connection.channel()
    # channel.queue_declare(queue='ai_vision_jobs', durable=True)
    # print("RabbitMQ connected")
    
    yield
    
    # Shutdown: Clean up resources
    print("AI Service is shutting down...")
    # connection.close()

app = FastAPI(
    title="AI Fashion Service",
    description="Microservice for VTON and AI Stylist using FastAPI & LanceDB",
    version="1.0.0",
    lifespan=lifespan,
)

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
