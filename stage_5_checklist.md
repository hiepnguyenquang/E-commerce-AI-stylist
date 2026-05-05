# Checklist Giai đoạn 5: Phát triển Tính năng Cốt lõi (MVP)

Tài liệu này dùng để điều phối và theo dõi tiến độ giữa các Instance (Frontend & Backend).
Trạng thái: `[ ]` - Chưa làm, `[working]` - Đang thực hiện, `[x]` - Đã hoàn thành & Validate.

---

## 🏗️ PHÂN ĐOẠN 5.1: HỒ SƠ AI & TÀI SẢN NGƯỜI DÙNG (AI PROFILE & ASSETS)
*Mục tiêu: Người dùng có thể thiết lập thông số cơ thể và tải lên trang phục cá nhân.*

> **Lưu ý kỹ thuật:** 
> 1. Thư mục upload đã được chuyển từ `public/uploads` sang `.medusa/uploads` để tránh việc File Watcher khởi động lại server khi có file mới. Ảnh vẫn được truy cập qua URL `/uploads/*` nhờ static middleware trong `middlewares.ts`.
> 2. Thư viện `@imgly/background-removal-node` trên môi trường Windows sẽ báo lỗi `Unsupported protocol: d:` nếu truyền đường dẫn vật lý (absolute path). Cần sử dụng `pathToFileURL` để chuyển đổi path thành định dạng URI (`file:///D:/...`) trước khi xử lý.

### [Frontend - Instance 1]
- [x] Xây dựng trang `AI Profile Setup` (`/ai-profile`):
    - [x] Component `ImageUploader` với tiền xử lý Canvas (Crop 3:4, nén <2MB).
    - [x] Form nhập số đo (Chiều cao, Cân nặng, Giới tính).
    - [x] Quản lý trạng thái Profile qua `useVTONStore`.
- [x] Xây dựng giao diện `User Closet` (`/wardrobe`):
    - [x] Hiển thị danh sách trang phục đã tải lên (Grid View).
    - [x] Nút "Thêm trang phục mới" kèm logic tách nền (kết nối API).

### [Backend/AI - Instance 2]
- [x] Hiện thực hóa API-01 (`POST /api/v1/ai-profile`):
    - [x] Controller lưu trữ ảnh vào Cloud/Local Storage.
    - [x] Cập nhật thông tin vào bảng `ai_profiles` (PostgreSQL).
- [x] Hiện thực hóa API-06 (`POST /api/v1/user/garments`):
    - [x] AI Service: Tích hợp logic Remove Background (ví dụ dùng Rembg). (Đã chuyển sang Node.js MVP)
    - [x] Lưu metadata vào bảng `user_closet_items`.

---

## 🧠 PHÂN ĐOẠN 5.2: AI STYLIST (TRÍ TUỆ PHỐI ĐỒ)
*Mục tiêu: Trò chuyện và nhận gợi ý phối đồ từ AI dựa trên kho hàng thực tế.*

### [Frontend - Instance 1]
- [ ] Phát triển giao diện `AI Stylist Chat` (Floating Widget hoặc Page):
    - [ ] Khung chat real-time.
    - [ ] Hiển thị kết quả gợi ý dạng `Outfit Card` (Click để xem chi tiết sản phẩm).
    - [ ] Logic "Đổi món đồ" (Replace Item) ngay trong khung chat.

### [Backend/AI - Instance 2]
- [ ] Thiết lập LanceDB & Vector Search:
    - [ ] Script nhúng toàn bộ kho hàng PostgreSQL sang LanceDB (`clip-ViT-B-32`).
    - [ ] Implement Hybrid Search (Metadata + Vector).
- [ ] Hiện thực hóa API-02 (`POST /api/v1/stylist/search`):
    - [ ] Luồng RAG: Query Parser -> LanceDB Retrieve -> LLM Outfit Generator.
    - [ ] Lưu session vào `stylist_sessions`.

---

## 👕 PHÂN ĐOẠN 5.3: VIRTUAL TRY-ON (THỬ ĐỒ ẢO)
*Mục tiêu: Ghép thử sản phẩm lên ảnh người dùng qua hàng đợi RabbitMQ.*

### [Frontend - Instance 1]
- [ ] Tích hợp nút `Try-On` tại trang chi tiết sản phẩm (PDP):
    - [ ] Gửi request vào hàng đợi qua Medusa.
    - [ ] Thiết lập kết nối SSE (`/api/v1/stream/vision-results`) để nhận ảnh kết quả.
    - [ ] UI trạng thái: "Đang xử lý (Pending)" -> "Đang vẽ (Rendering)" -> "Hoàn tất".

### [Backend/AI - Instance 2]
- [ ] Cấu hình Worker AI (`apps/ai-service`):
    - [ ] Load model `CatVTON` (bf16, prefetch=1).
    - [ ] Consumer lắng nghe `QUEUE-01` (ai_vision_jobs).
- [ ] Xây dựng SSE Endpoint tại Medusa:
    - [ ] Nhận kết quả từ AI (via internal callback).
    - [ ] Đẩy Event đến đúng User đang kết nối.

---

## 🛒 PHÂN ĐOẠN 5.4: GIAO DỊCH & WORKFLOWS (CHECKOUT SAGA)
*Mục tiêu: Đảm bảo luồng mua hàng ổn định, trừ kho và thanh toán giả lập.*

### [Frontend - Instance 1]
- [ ] Hoàn thiện `Cart Drawer` & `Checkout Page`:
    - [ ] Hiển thị thông tin sản phẩm kèm metadata AI (nếu món đồ được chọn từ Stylist).
    - [ ] Luồng thanh toán Mockup thành công.

### [Backend/AI - Instance 2]
- [ ] Viết Medusa Workflows cho Checkout:
    - [ ] Step: `reserveInventory` (Lock tồn kho).
    - [ ] Step: `createOrder` (Tạo đơn hàng).
    - [ ] Step: `processPayment` (Mock logic).
- [ ] Đồng bộ hóa: Khi đơn hàng thành công, cập nhật `vton_jobs` hoặc `stylist_sessions` để ghi nhận chuyển đổi (Conversion tracking).

---

## ✅ GIAI ĐOẠN CUỐI: INTEGRATION TESTING & POLISHING
- [ ] Kiểm thử luồng E2E: Chat Stylist -> Chọn đồ -> Thử đồ -> Mua hàng.
- [ ] Tối ưu hóa hiệu suất (Caching ảnh kết quả).
- [ ] Xử lý lỗi tập trung (Global Error Handler).
