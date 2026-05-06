import os
import sys
import uuid
import lancedb

# Thêm đường dẫn gốc của app (ai-service) vào sys.path để import từ src/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.schema import products_schema
from src.ai.embedding import get_embedding_service

LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")

def sync_seed_data():
    print(f"Connecting to LanceDB at {LANCEDB_URI}...")
    # Cần đảm bảo thư mục tồn tại
    os.makedirs(os.path.dirname(LANCEDB_URI), exist_ok=True)
    db = lancedb.connect(LANCEDB_URI)
    
    table_name = "products_vector"
    if table_name in db.table_names():
        print(f"Table '{table_name}' already exists. Dropping it for fresh sync...")
        db.drop_table(table_name)
    
    print(f"Creating table '{table_name}' with defined PyArrow schema...")
    table = db.create_table(table_name, schema=products_schema)
    
    # Khởi tạo model nhúng CLIP
    embedder = get_embedding_service()
    
    # Mock data - Dữ liệu mồi cho LanceDB (Phục vụ Phase 1)
    seed_products = [
        {
            "product_id": str(uuid.uuid4()),
            "name": "Váy hoa nhí đi biển mùa hè",
            "category": "dresses",
            "gender": "women",
            "color": "yellow",
            "price": 450000.0,
            "in_stock": True,
            "style": ["vintage", "floral"],
            "occasion": ["beach", "party", "casual"],
            "material": "silk",
            "image_url": "/uploads/vay-hoa-nhi.png"
        },
        {
            "product_id": str(uuid.uuid4()),
            "name": "Áo thun nam cơ bản màu đen",
            "category": "tops",
            "gender": "men",
            "color": "black",
            "price": 200000.0,
            "in_stock": True,
            "style": ["minimalist", "streetwear"],
            "occasion": ["casual", "sport"],
            "material": "cotton",
            "image_url": "/uploads/ao-thun-den.png"
        },
        {
            "product_id": str(uuid.uuid4()),
            "name": "Quần âu nữ công sở",
            "category": "pants",
            "gender": "women",
            "color": "navy_blue",
            "price": 550000.0,
            "in_stock": True,
            "style": ["office", "formal"],
            "occasion": ["work"],
            "material": "cotton",
            "image_url": "/uploads/quan-au-nu.png"
        }
    ]
    
    print("Embedding product descriptions and preparing data for LanceDB...")
    data_to_insert = []
    
    for product in seed_products:
        # Xây dựng câu mô tả phong phú (rich text description) để mô hình nhúng hiểu ngữ nghĩa
        text_to_embed = (
            f"Tên: {product['name']}. "
            f"Danh mục: {product['category']}. "
            f"Phong cách: {', '.join(product['style'])}. "
            f"Phù hợp cho: {', '.join(product['occasion'])}. "
            f"Chất liệu: {product['material']}. "
            f"Màu sắc: {product['color']}."
        )
        print(f" -> Embedding: {text_to_embed}")
        
        # Nhúng text thành Vector 512 chiều
        vector = embedder.embed_text(text_to_embed)
        
        # Đưa vector vào record
        product["vector"] = vector
        data_to_insert.append(product)
        
    print(f"Inserting {len(data_to_insert)} records into LanceDB collection '{table_name}'...")
    table.add(data_to_insert)
    print("Insertion completed successfully!")
    
    # Kiểm tra (Verify) dữ liệu sau khi sync
    print("\n[Verification] Fetching top 1 record from DB:")
    result = table.search().limit(1).to_list()
    if result:
        product_verify = result[0]
        print(f"✅ Product matched: {product_verify['name']}")
        print(f"✅ Vector dimensions: {len(product_verify['vector'])}")
        print(f"✅ Metadata matched: Category '{product_verify['category']}', Style: {product_verify['style']}")
    else:
        print("❌ Verification failed. Table is empty.")

if __name__ == "__main__":
    sync_seed_data()
