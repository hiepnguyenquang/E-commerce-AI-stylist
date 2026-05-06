import os
import sys
import json
from dotenv import load_dotenv

# Thêm src vào sys path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

from src.ai.llm_client import get_intent_analyzer
from src.database.search import VectorSearch

def test_rag_pipeline():
    print("=== BẮT ĐẦU TEST LUỒNG RAG ===")
    
    # Khởi tạo Vector Search
    print("\n[1] Khởi tạo VectorSearch (Tải model CLIP)...")
    vector_search = VectorSearch()
    
    llm_client = get_intent_analyzer()
    
    # Giả lập câu hỏi người dùng
    user_query = "Tôi muốn tìm một cái váy hoa nữ phong cách cổ điển để đi biển"
    print(f"\n[2] User Query: '{user_query}'")
    
    # Bước 1: Query Parsing
    print("\n[3] LLM (Prompt B) - Phân tích truy vấn...")
    filters = llm_client.parse_query(user_query)
    print(f" -> Filters (JSON): {json.dumps(filters, indent=2, ensure_ascii=False)}")
    
    search_keywords = filters.get("search_keywords", user_query)
    
    # Bước 2: Hybrid Search
    print("\n[4] LanceDB - Tìm kiếm lai (Lọc cứng + Vector)...")
    pool = vector_search.hybrid_search(
        search_keywords=search_keywords,
        filters=filters,
        limit=5
    )
    
    print(f" -> Found {len(pool)} products:")
    for p in pool:
        print(f"    - [{p['product_id']}] {p['name']} | Price: {p['price']} | Style: {p.get('style')}")
        
    if not pool:
        print("\n❌ Không tìm thấy sản phẩm nào trong pool.")
        return
        
    # Bước 3: Generate Outfit
    print("\n[5] LLM (Prompt C) - Đóng vai Stylist tạo Set đồ...")
    outfits = llm_client.generate_outfit_options(
        user_query=user_query,
        limit_options=1,
        available_products=pool
    )
    
    print("\n=== KẾT QUẢ ĐẦU RA TỪ AI STYLIST ===")
    print(json.dumps(outfits, indent=2, ensure_ascii=False))
    print("====================================")

if __name__ == "__main__":
    test_rag_pipeline()
