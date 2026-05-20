# Checklist Giai đoạn 5: Phát triển Tính năng Cốt lõi (MVP)

Tài liệu này dùng để điều phối và theo dõi tiến độ giữa các Instance (Frontend & Backend).
Trạng thái: `[ ]` - Chưa làm, `[working]` - Đang thực hiện, `[x]` - Đã hoàn thành & Validate.

---

## 🏗️ PHÂN ĐOẠN 5.1: HỒ SƠ AI & TÀI SẢN NGƯỜI DÙNG (AI PROFILE & ASSETS)
*Mục tiêu: Người dùng có thể thiết lập thông số cơ thể và tải lên trang phục cá nhân.*

> **Lưu ý kỹ thuật:** 
> 1. Thư mục upload đã được chuyển từ `public/uploads` sang `.medusa/uploads` để tránh việc File Watcher khởi động lại server khi có file mới. Ảnh vẫn được truy cập qua URL `/uploads/*` nhờ static middleware trong `middlewares.ts`.
> 2. Thư viện `@imgly/background-removal-node` trên môi trường Windows sẽ báo lỗi `Unsupported protocol: d:` nếu truyền đường dẫn vật lý (absolute path). Cần sử dụng `pathToFileURL` để chuyển đổi path thành định dạng URI (`file:///D:/...`) trước khi xử lý.
> 3. Cơ chế Routing của MedusaJS v2 sẽ cắt bớt `req.path`. Tuyệt đối không dùng `express.static` để phục vụ file mà phải tự parse `req.originalUrl` và dùng `res.sendFile()` để tránh lỗi 404 hoặc 301 tự động thêm trailing slash.
> 4. **Tính năng Xóa ảnh (Đã hoàn thành):** Đã bổ sung API `DELETE /api/v1/user/garments/:id` và giao diện nút thùng rác cho phép người dùng xóa trang phục trong tủ đồ. Cơ chế xóa thực hiện đồng bộ 3 việc: xóa bản ghi trong DB (`user_closet_items`), xóa file vật lý trong `.medusa/uploads` và đẩy message qua RabbitMQ để dọn dẹp vector trong LanceDB.
> 5. **Nợ kỹ thuật (Tech Debt) - API lấy hồ sơ AI (Đã hoàn thành):** Đã xây dựng API `GET /api/v1/ai-profile` và cập nhật logic frontend tự động đồng bộ hồ sơ từ Database ngay khi load trang.
> 6. **Quản lý Sản phẩm (Admin API via Next.js - Đã hoàn thành):** Đã phát triển Custom API `POST /api/v1/internal/products` trên Medusa (bảo mật bằng `x-internal-token`) và trang `/admin-tools/add-product` trên Frontend để tạo nhanh sản phẩm.

### [Frontend - Instance 1]
- [x] Xây dựng trang `AI Profile Setup` (`/ai-profile`):
    - [x] Component `ImageUploader` với tiền xử lý Canvas (Crop 3:4, nén <2MB).
    - [x] Form nhập số đo (Chiều cao, Cân nặng, Giới tính).
    - [x] Quản lý trạng thái Profile qua `useVTONStore`.
- [x] Xây dựng giao diện `User Closet` (`/wardrobe`):
    - [x] Hiển thị danh sách trang phục đã tải lên (Grid View).
    - [x] Nút "Thêm trang phục mới" kèm logic tách nền (kết nối API).
- [x] Hoàn thiện Cửa hàng (`/products`):
    - [x] Thêm giao diện lọc (Filters) và sắp xếp (Sort).
    - [x] Giao diện Thêm sản phẩm nhanh (`/admin-tools/add-product`).

### [Backend/AI - Instance 2]
- [x] Hiện thực hóa API-01 (`POST /api/v1/ai-profile`):
    - [x] Controller lưu trữ ảnh vào Cloud/Local Storage.
    - [x] Cập nhật thông tin vào bảng `ai_profiles` (PostgreSQL).
- [x] Hiện thực hóa API-06 (`POST /api/v1/user/garments`):
    - [x] AI Service: Tích hợp logic Remove Background (ví dụ dùng Rembg). (Đã chuyển sang Node.js MVP)
    - [x] Lưu metadata vào bảng `user_closet_items`.
- [x] Hiện thực hóa API thêm sản phẩm nội bộ:
    - [x] `POST /api/v1/internal/products` để tạo Product.

---

## 🧠 PHÂN ĐOẠN 5.2: AI STYLIST (TRÍ TUỆ PHỐI ĐỒ)
*Mục tiêu: Trò chuyện và nhận gợi ý phối đồ từ AI dựa trên kho hàng thực tế.*

> **Lưu ý cải tiến sau MVP (Intent Guardrail):**
> Cần bổ sung thêm một lớp AI lọc câu hỏi (Intent Guardrail) ở đầu luồng. Nếu câu hỏi của người dùng không liên quan đến phối đồ hoặc thời trang, hệ thống sẽ không thực hiện tìm kiếm mà khéo léo từ chối và điều hướng người dùng về việc phối đồ. Tính năng này sẽ giúp tiết kiệm chi phí API và bảo vệ hệ thống khỏi những prompt không mong muốn, sẽ được bổ sung sau khi hoàn thành bản MVP.

### [Frontend - Instance 1]
- [x] Phát triển giao diện `AI Stylist Chat` (Floating Widget hoặc Page):
    - [x] Khung chat real-time.
    - [x] Hiển thị kết quả gợi ý dạng `Outfit Card` (Click để xem chi tiết sản phẩm).
    - [x] Logic "Đổi món đồ" (Replace Item) ngay trong khung chat (API-03).

### [Backend/AI - Instance 2]
- [x] Thiết lập LanceDB & Vector Search:
    - [x] Script nhúng toàn bộ kho hàng PostgreSQL sang LanceDB (`clip-ViT-B-32`).
    - [x] Implement Hybrid Search (Metadata + Vector).
- [x] Hiện thực hóa API-02 (`POST /api/v1/stylist/search`):
    - [x] Luồng RAG: Query Parser -> LanceDB Retrieve -> LLM Outfit Generator.
    - [x] Lưu session vào `stylist_sessions`.

---

## 👕 PHÂN ĐOẠN 5.3: VIRTUAL TRY-ON (THỬ ĐỒ ẢO)
*Mục tiêu: Ghép thử sản phẩm lên ảnh người dùng qua hàng đợi RabbitMQ.*

### [Frontend - Instance 1]
- [x] Tích hợp nút `Try-On` tại trang chi tiết sản phẩm (PDP):
    - [x] Gửi request vào hàng đợi qua Medusa.
    - [x] Thiết lập kết nối SSE (`/api/v1/stream/vision-results`) để nhận ảnh kết quả.
    - [x] UI trạng thái: "Đang xử lý (Pending)" -> "Đang vẽ (Rendering)" -> "Hoàn tất".

### [Backend/AI - Instance 2]
- [x] Cấu hình Worker AI (`apps/ai-service`):
    - [x] Load model `CatVTON` (bf16, prefetch=1).
    - [x] Consumer lắng nghe `QUEUE-01` (ai_vision_jobs).
- [x] Xây dựng SSE Endpoint tại Medusa:
    - [x] Nhận kết quả từ AI (via internal callback).
    - [x] Đẩy Event đến đúng User đang kết nối.

---

## 🛒 PHÂN ĐOẠN 5.4: GIAO DỊCH & WORKFLOWS (CHECKOUT SAGA)
*Mục tiêu: Đảm bảo luồng mua hàng ổn định, trừ kho và thanh toán giả lập.*

### [Frontend - Instance 1]
- [x] Hoàn thiện `Cart Drawer` & `Checkout Page`:
    - [x] Hiển thị thông tin sản phẩm kèm metadata AI (nếu món đồ được chọn từ Stylist).
    - [x] Luồng thanh toán Mockup thành công.

### [Backend/AI - Instance 2]
- [x] Viết Medusa Workflows cho Checkout:
    - [x] Step: `reserveInventory` (Lock tồn kho).
    - [x] Step: `createOrder` (Tạo đơn hàng).
    - [x] Step: `processPayment` (Mock logic).
- [x] Đồng bộ hóa: Khi đơn hàng thành công, cập nhật `vton_jobs` hoặc `stylist_sessions` để ghi nhận chuyển đổi (Conversion tracking).

---

## ✅ GIAI ĐOẠN CUỐI: INTEGRATION TESTING & POLISHING
- [x] Kiểm thử luồng E2E: Chat Stylist -> Chọn đồ -> Thử đồ -> Mua hàng.
- [x] Tối ưu hóa hiệu suất (Caching ảnh kết quả & Persistent VRAM Model loading).
- [x] Xử lý lỗi tập trung (Global Error Handler với error.tsx/global-error.tsx).
