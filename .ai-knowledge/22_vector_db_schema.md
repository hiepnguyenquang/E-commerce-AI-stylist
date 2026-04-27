# Schema Vector Database (LanceDB) cho AI Fashion

Tài liệu này định nghĩa cấu trúc dữ liệu lưu trữ trong LanceDB (được quản lý bởi `ai-service` FastAPI) phục vụ cho tính năng Tìm kiếm ngữ nghĩa (Semantic Search) và Trợ lý AI phối đồ.

## 1. Lựa chọn Embedding Model (Mô hình nhúng)
Để chuyển đổi văn bản mô tả và hình ảnh sản phẩm thành Vector, hệ thống sử dụng một mô hình tiêu chuẩn để đảm bảo độ dài vector là cố định:
- **Khuyến nghị Model:** `clip-ViT-B-32` (hoặc các biến thể của SigLIP tối ưu cho ảnh E-commerce).
- **Số chiều (Dimensions):** `512` (Bắt buộc khai báo tĩnh trong schema LanceDB).
- **Metric tính toán khoảng cách:** `cosine` (Cosine Similarity).

## 2. Cấu trúc Bảng `products_vector` (Collection Schema)

Bảng này lưu trữ Vector và các siêu dữ liệu (Metadata) đi kèm để phục vụ kỹ thuật **Hybrid Search** (Lọc cứng theo Metadata kết hợp Tìm kiếm mềm bằng Vector).

### Lược đồ PyArrow / Pydantic (Định nghĩa trong FastAPI):
```python
import pyarrow as pa

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
```

## 3. Cơ chế Tìm kiếm Lai (Hybrid Search Flow)

Việc bổ sung các trường `style` và `occasion` giúp giải quyết bài toán phối đồ chuẩn xác.
**Ví dụ Use-case:** Khách hàng yêu cầu *"Tìm váy hoa nhí phong cách vintage đi tiệc màu đỏ, giá dưới 1 triệu"*.

**Luồng truy vấn (Query) trong LanceDB:**
1. **Lọc cứng (Metadata Pre-filtering):** LanceDB loại bỏ ngay lập tức hàng ngàn sản phẩm không khớp bằng truy vấn SQL-like:
   - `in_stock == True` AND `price < 1000000` AND `color == "red"` AND `category == "dresses"` AND `"vintage" in style` AND `"party" in occasion`.
2. **Lọc mềm (Vector Search):** 
   - Trên tập kết quả (còn rất nhỏ) sau khi lọc cứng, AI tính khoảng cách Cosine giữa Vector của câu lệnh *"váy hoa nhí"* với trường `vector` của các sản phẩm để lấy ra Top 5 kết quả sát nghĩa nhất.
   
> **Lợi ích:** Đảm bảo kết quả trả ra không bị "ảo giác" (sai giá, sai tồn kho, sai style) đồng thời tiết kiệm tối đa tài nguyên xử lý của Card RTX 5060, giúp API phản hồi trong tích tắc.

## 4. Cơ chế Đồng bộ Dữ liệu (PostgreSQL -> LanceDB)
Dữ liệu gốc (Source of Truth) luôn là MedusaJS (PostgreSQL). LanceDB đóng vai trò là "Read-Replica" cho AI.
- Khi Admin tạo/sửa/xóa sản phẩm, MedusaJS đẩy sự kiện (`product_updated`) vào **RabbitMQ (`QUEUE-02: product_metadata_sync`)**.
- AI Service nhận message, chạy model (như Llama 3) để tự động phân tích ảnh/text và trích xuất ra các tag `style`, `occasion`, `color`. Sau đó, tiến hành `upsert` hoặc `delete` tương ứng vào collection `products_vector`.
