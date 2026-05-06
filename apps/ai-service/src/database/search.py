import os
import lancedb
from src.ai.embedding import get_embedding_service

LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")

class VectorSearch:
    def __init__(self):
        # Mở connection đến thư mục DB
        self.db = lancedb.connect(LANCEDB_URI)
        self.table_name = "products_vector"
        
        # Chỉ load model khi gọi query (Lazy load) hoặc load sẵn 1 instance.
        # Khởi tạo model nhúng để convert text sang vector 512d
        self.embedder = get_embedding_service()
        
    def hybrid_search(self, search_keywords: str, filters: dict, limit: int = 20) -> list:
        """
        Thực hiện tìm kiếm lai (Hybrid Search) trên LanceDB.
        Lọc cứng (metadata) + Lọc mềm (Cosine similarity trên vector).
        """
        if self.table_name not in self.db.table_names():
            print(f"[VectorSearch] Table {self.table_name} not found.")
            return []
            
        table = self.db.open_table(self.table_name)
        
        # 1. Nhúng từ khóa tìm kiếm (Lọc mềm)
        if search_keywords:
            query_vector = self.embedder.embed_text(search_keywords)
            # LanceDB mặc định distance là L2, dùng L2 cho clip embedding.
            search = table.search(query_vector).metric("cosine")
        else:
            search = table.search()
            
        # 2. Xây dựng chuỗi lọc cứng (Metadata Pre-filtering)
        filter_conditions = ["in_stock = true"] # Luôn yêu cầu còn hàng
        
        if filters.get("target_category"):
            # LanceDB hỗ trợ sql-like syntax
            cat = filters["target_category"].replace("'", "''")
            filter_conditions.append(f"category = '{cat}'")
            
        if filters.get("price_preference"):
            pref = filters["price_preference"]
            if pref == "cheap":
                filter_conditions.append("price < 500000")
            elif pref == "premium":
                filter_conditions.append("price >= 500000 AND price < 2000000")
            elif pref == "luxury":
                filter_conditions.append("price >= 2000000")
                
        where_clause = " AND ".join(filter_conditions)
        print(f"[VectorSearch] Executing search with where: {where_clause}")
        
        # Dùng prefilter=True để lọc cứng trước, sau đó mới tính khoảng cách vector
        search = search.where(where_clause, prefilter=True)
        
        try:
            results = search.limit(limit).to_list()
        except Exception as e:
            print(f"[VectorSearch] Search query failed: {e}")
            return []
            
        # 3. Client-side filtering cho các array field nếu cần
        # Vì LanceDB DataFusion filter trên array (style, occasion) đôi khi phức tạp,
        # chúng ta có thể pass kết quả trực tiếp cho LLM tự quyết định dựa trên pool kết quả gần nghĩa nhất.
        
        return results
