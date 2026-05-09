# Giai đoạn 3: Hoàn thiện Giỏ hàng và Thanh toán trên Frontend

**Mục tiêu:** Xây dựng UI cho người dùng tương tác với luồng mua hàng và kết nối với Backend Workflows.

### 1. Quản lý Giỏ hàng (Cart Drawer)
- [x] **Sử dụng Zustand Store (`useCartStore`):**
  - [x] Hiển thị danh sách sản phẩm trong giỏ (tên, giá, số lượng).
  - [x] Lưu ý hiển thị thêm nhãn/badge nếu sản phẩm được thêm từ "Gợi ý AI Stylist".
- [x] **Tích hợp API Thêm vào Giỏ (`POST /api/v1/cart/items`):**
  - [x] Thêm nút "Add to Cart" tại các trang (PDP, AI Stylist Outfit Card).
  - [x] Khi thêm từ AI Stylist, gửi kèm `stylist_session_id` trong metadata.

### 2. Trang Thanh toán (Checkout Page)
- [x] **Giao diện Checkout đơn giản:**
  - [x] Form nhập thông tin giao hàng (Mock).
  - [x] Nút "Thanh toán" (Mock payment).
- [x] **Kích hoạt Luồng Saga:**
  - [x] Khi bấm Thanh toán, gọi API `POST /api/v1/checkout`.
  - [x] Hiển thị trạng thái loading chờ Backend thực thi Workflow.
  - [x] Xử lý phản hồi (Thành công -> Chuyển sang trang Cảm ơn; Thất bại -> Hiển thị lỗi do tồn kho/thanh toán).
