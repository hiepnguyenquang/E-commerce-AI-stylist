# Giai đoạn 1 (Phase 1): Thiết lập LanceDB & Script Đồng bộ Vector (AI Service)

**Mục tiêu:** Xây dựng cơ sở dữ liệu Vector và nạp dữ liệu mồi (Seed Data).

- [x] **1.1 Định nghĩa Schema LanceDB:**
  - [x] Khai báo cấu trúc bảng `products_vector` (product_id, vector 512 chiều, category, price, style, occasion, v.v.).
- [x] **1.2 Tích hợp Embedding Model:**
  - [x] Cài đặt và cấu hình mô hình `sentence-transformers/clip-ViT-B-32-multilingual-v1` vào `ai-service` để nhúng (embed) text/hình ảnh.
  - [x] Đã refactor tạo `IEmbeddingService` và `LocalCLIPEmbeddingAdapter`.
- [x] **1.3 Script Đồng bộ Dữ liệu (Vector Sync):**
  - [x] Viết script `sync_to_lancedb.py` lấy dữ liệu giả lập (hoặc dữ liệu từ DB Medusa), nhúng thành Vector và lưu vào LanceDB.
  - [x] Chạy và kiểm tra dữ liệu trong LanceDB.