import pyarrow as pa

# Cấu trúc Bảng products_vector (Collection Schema) theo định nghĩa của hệ thống
products_schema = pa.schema([
    # --- 1. Khóa Chính ---
    pa.field("product_id", pa.string()),     # Map 1-1 với ID bảng 'product' trong MedusaJS (PostgreSQL)
    
    # --- 2. Vector Cốt lõi ---
    pa.field("vector", pa.list_(pa.float32(), 512)), # Vector nhúng (512 dimensions)
    
    # --- 3. Metadata Cơ bản (Phục vụ Pre-filtering) ---
    pa.field("category", pa.string()),       # VD: "dresses", "tops", "pants"
    pa.field("gender", pa.string()),         # VD: "men", "women", "unisex"
    pa.field("color", pa.string()),          # VD: "red", "navy_blue", "black"
    pa.field("price", pa.float64()),         # Phục vụ lọc theo khoảng giá
    pa.field("in_stock", pa.bool_()),        # Bắt buộc: True/False (Tránh AI gợi ý đồ hết hàng)
    
    # --- 4. [QUAN TRỌNG] Các trường Fashion chuyên sâu ---
    # Phục vụ định hình phong cách, giúp AI phối đồ thông minh
    pa.field("style", pa.list_(pa.string())),    # VD: ["vintage", "streetwear", "office", "minimalist"]
    pa.field("occasion", pa.list_(pa.string())), # VD: ["party", "casual", "work", "sport"]
    pa.field("material", pa.string()),           # VD: "denim", "silk", "cotton"
    
    # --- 5. Dữ liệu Hiển thị Nhanh (Caching) ---
    # Trả về ngay cho Frontend mà không cần query lại DB chính
    pa.field("name", pa.string()),           
    pa.field("image_url", pa.string())       
])
