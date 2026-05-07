# Giai đoạn 3: Cập nhật Giao diện (Frontend)

**Mục tiêu:** Tích hợp tính năng thử đồ vào giao diện, hiển thị trạng thái realtime cho người dùng qua kết nối SSE.

### 1. Zustand State (`apps/web/src/store/useVTONStore.ts`)
- [x] **Mở rộng Store:**
  - [x] Định nghĩa các trạng thái xử lý VTON: `idle`, `pending`, `rendering`, `completed`, `error`.
  - [x] Lưu trữ kết quả ảnh render thành công.
  - [x] Cập nhật các action để thay đổi trạng thái (ví dụ: `startVTON`, `setVTONResult`, `setVTONError`).

### 2. Cải tiến Component & Luồng SSE (`apps/web`)
- [x] **Hook quản lý SSE (`useSSE` hoặc tương đương):**
  - [x] Viết hook khởi tạo đối tượng `EventSource` kết nối đến `GET /api/v1/stream/vision-results`.
  - [x] Lắng nghe các event trả về và dispatch action vào `useVTONStore` tương ứng (ảnh trả về hoặc lỗi).
  - [x] Tự động đóng kết nối (close) khi component unmount hoặc khi nhận được event `completed`/`error`.
- [x] **Nút "Thử đồ" (Try-On Button):**
  - [x] Thêm nút vào các vị trí thích hợp (ví dụ: trong OutfitCard của AI Stylist, trang Tủ đồ cá nhân, hoặc trang Chi tiết sản phẩm - PDP).
  - [x] Khi click, mở popup/modal chọn ảnh gốc của người dùng (từ AI Profile) và lấy ảnh món đồ đang xem.
  - [x] Gọi API `POST /api/v1/vton/jobs` để kích hoạt luồng.
- [x] **Giao diện hiển thị Tiến trình (Progress UI):**
  - [x] Hiển thị thông báo trạng thái ("Đang gửi yêu cầu...", "AI đang vẽ...", "Hoàn tất") hoặc overlay loading khi state VTON thay đổi.
  - [x] Render ảnh kết quả khi state là `completed`.
  - [x] Bắt lỗi và hiển thị thông báo nếu có lỗi từ AI service.