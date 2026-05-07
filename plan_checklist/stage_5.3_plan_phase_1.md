# Giai đoạn 1: Cấu hình Message Queue & SSE ở Backend

**Mục tiêu:** Xây dựng cơ sở hạ tầng giao tiếp bất đồng bộ giữa Core E-commerce và AI Service, cùng với kênh Server-Sent Events (SSE) để đẩy kết quả về Frontend.

### 1. Core API (MedusaJS - `apps/api-medusa`)
- [x] **Khởi tạo RabbitMQ Broker:**
  - [x] Cấu hình kết nối RabbitMQ.
  - [x] Định nghĩa Producer để đẩy tin nhắn vào queue `ai_vision_jobs`.
  - [x] Định nghĩa Consumer để lắng nghe kết quả từ queue `ai_vision_results`.
- [x] **Tạo API Gửi Job Thử Đồ:**
  - [x] Định nghĩa Custom Route `POST /api/v1/vton/jobs`.
  - [x] Nhận payload (human_image_url, garment_image_url, user_id), tạo bản ghi `vton_jobs` trong DB trạng thái "pending".
  - [x] Gọi Producer đẩy job vào queue `ai_vision_jobs`.
- [x] **Thiết lập Luồng SSE:**
  - [x] Định nghĩa Custom Route `GET /api/v1/stream/vision-results`.
  - [x] Cấu hình HTTP headers cho SSE (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
  - [x] Quản lý danh sách các kết nối (clients) đang active theo `user_id`.
  - [x] Kết nối Consumer `ai_vision_results` với danh sách clients: Khi nhận kết quả từ AI, đẩy event tương ứng về client của `user_id` đó.

### 2. Thử nghiệm kết nối (Stub AI Worker - `apps/ai-service`)
- [x] **Tạo Consumer giả lập (Stub):**
  - [x] Cấu hình kết nối RabbitMQ trong FastAPI.
  - [x] Viết hàm lắng nghe queue `ai_vision_jobs`.
  - [x] Xử lý giả lập (Mock): Sleep 5s để mô phỏng thời gian render AI.
  - [x] Gửi trả message chứa URL ảnh mock về queue `ai_vision_results` với `user_id` và `job_id` tương ứng.
- [x] **Kiểm thử Luồng Backend:**
  - [x] Dùng Postman tạo request gọi API `/vton/jobs`.
  - [x] Dùng Postman hoặc trình duyệt kết nối vào API SSE `/stream/vision-results`.
  - [x] Xác nhận nhận được event trả về sau 5s chờ giả lập.