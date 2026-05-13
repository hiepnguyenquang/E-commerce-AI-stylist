import os
import lancedb
from src.ai.embedding import get_embedding_service

LANCEDB_URI = os.getenv("LANCEDB_URI", "./data/lancedb")

class VectorSearch:
    def __init__(self):
        # Mở connection đến thư mục DB
        self.db = lancedb.connect(LANCEDB_URI)
        self.table_name = "products_vector"
        
    @property
    def embedder(self):
        # Khởi tạo model nhúng để convert text sang vector 512d (Lazy load)
        return get_embedding_service()
        
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

    def search_closet(self, user_id: str, search_keywords: str, limit: int = 10) -> list:
        """Tìm kiếm các món đồ trong tủ đồ cá nhân."""
        table_name = "closet_vector"
        if table_name not in self.db.table_names():
            return []
            
        table = self.db.open_table(table_name)
        
        if search_keywords:
            query_vector = self.embedder.embed_text(search_keywords)
            search = table.search(query_vector).metric("cosine")
        else:
            search = table.search()
            
        where_clause = f"user_id = '{user_id}'"
        search = search.where(where_clause, prefilter=True)
        
        try:
            results = search.limit(limit).to_list()
            # Normalize closet results to look like products for the LLM
            normalized_results = []
            for r in results:
                normalized_results.append({
                    "product_id": r["id"],
                    "name": f"Đồ cá nhân ({r.get('category', 'unknown')})",
                    "category": r.get("category"),
                    "style": r.get("style", []),
                    "price": 0.0,
                    "source": "closet"
                })
            return normalized_results
        except Exception as e:
            print(f"[VectorSearch] Closet search query failed: {e}")
            return []

    def global_search(self, user_id: str, search_keywords: str, filters: dict, limit: int = 20) -> list:
        """Gộp kết quả từ cửa hàng và tủ đồ cá nhân."""
        store_results = self.hybrid_search(search_keywords, filters, limit=limit)
        closet_results = self.search_closet(user_id, search_keywords, limit=limit//2)
        
        # Đánh dấu nguồn gốc cho các món đồ từ cửa hàng
        for r in store_results:
            r["source"] = "store"
            
        # Nối 2 list lại. AI sẽ chọn từ pool chung này
        return store_results + closet_results

    def find_similar_items(self, item_id: str, is_closet: bool = False, limit: int = 5, exclude_ids: list = None) -> list:
        """Tìm kiếm các sản phẩm tương đồng dựa trên vector của một sản phẩm."""
        table_name = "closet_vector" if is_closet else "products_vector"
        if table_name not in self.db.table_names():
            return []
            
        table = self.db.open_table(table_name)
        id_field = "id" if is_closet else "product_id"
        
        # 1. Tìm vector của item gốc
        target_results = table.search().where(f"{id_field} = '{item_id}'", prefilter=True).to_list()
        
        if not target_results or "vector" not in target_results[0]:
            print(f"[VectorSearch] Target item {item_id} not found or has no vector.")
            return []
            
        target_vector = target_results[0]["vector"]
        target_category = target_results[0].get("category")
        
        # 2. Tìm các item tương đồng
        search = table.search(target_vector).metric("cosine")
        
        # Build where clause
        where_conditions = [f"{id_field} != '{item_id}'"]
        if target_category:
            cat = target_category.replace("'", "''")
            where_conditions.append(f"category = '{cat}'")
            
        if not is_closet:
            where_conditions.append("in_stock = true")
            
        if exclude_ids:
            ids_str = ", ".join([f"'{eid}'" for eid in exclude_ids])
            where_conditions.append(f"{id_field} NOT IN ({ids_str})")
            
        where_clause = " AND ".join(where_conditions)
        search = search.where(where_clause, prefilter=True)
        
        try:
            results = search.limit(limit).to_list()
            normalized = []
            for r in results:
                if is_closet:
                    normalized.append({
                        "product_id": r["id"],
                        "name": f"Đồ cá nhân ({r.get('category', 'unknown')})",
                        "category": r.get("category"),
                        "style": r.get("style", []),
                        "price": 0.0,
                        "source": "closet"
                    })
                else:
                    r["source"] = "store"
                    normalized.append(r)
            return normalized
        except Exception as e:
            print(f"[VectorSearch] find_similar_items query failed: {e}")
            return []

