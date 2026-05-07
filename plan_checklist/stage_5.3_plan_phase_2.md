# Giai đoạn 2: Hiện thực Model CatVTON (AI Service)

**Mục tiêu:** Xây dựng logic AI xử lý Virtual Try-On thực tế thông qua các Interface và kết nối vào hệ thống Worker.

### 1. Cài đặt Interface & Adapter (`apps/ai-service`)
- [x] **Định nghĩa Interface:**
  - [x] Xây dựng class `IVirtualTryOnService` quy định đầu vào (ảnh người, ảnh quần áo) và đầu ra (URL ảnh kết quả).
- [x] **Tạo LocalCatVTONAdapter:**
  - [x] Cài đặt các thư viện cần thiết (nếu thiếu): `diffusers`, `xformers` (tối ưu memory), v.v.
  - [x] Viết logic load model CatVTON (tuân thủ giới hạn VRAM: sử dụng `bfloat16`, load/unload linh hoạt để giải phóng bộ nhớ cho CLIP nếu cần).
  - [x] Viết logic tiền xử lý ảnh đầu vào để khớp với kích thước yêu cầu của model (1024x768).
  - [x] Viết logic inference (chạy model sinh ảnh).
  - [x] Lưu ảnh kết quả (tạm thời vào local storage, cấu hình phục vụ file tĩnh nếu cần) và trả về URL.

### 2. Gắn kết Worker
- [x] **Thay thế Stub bằng Adapter thật:**
  - [x] Tích hợp `LocalCatVTONAdapter` vào Consumer RabbitMQ lắng nghe queue `ai_vision_jobs`.
  - [x] Nhận URL ảnh người và trang phục từ message, tải file ảnh về xử lý.
  - [x] Đẩy URL kết quả thực tế vào queue `ai_vision_results`.
- [x] **Xử lý Lỗi & Tối ưu:**
  - [x] Bắt các exception như Out Of Memory (OOM) hoặc ảnh đầu vào hỏng, gửi message lỗi về queue để Core Medusa biết.
  - [x] Đảm bảo `prefetch_count=1` trong RabbitMQ channel để AI Worker không bị quá tải.

### 3. Cập nhật Cơ sở dữ liệu (MedusaJS)
- [x] Cập nhật trạng thái Job trong bảng `vton_jobs` (pending -> processing -> completed/failed) và lưu `result_image_url` thông qua sự kiện nhận từ Consumer `ai_vision_results`.