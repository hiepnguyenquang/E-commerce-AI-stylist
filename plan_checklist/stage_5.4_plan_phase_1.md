# Giai đoạn 1: Xây dựng luồng Thanh toán (Checkout Workflow)

**Mục tiêu:** Áp dụng Saga Pattern trong MedusaJS để đảm bảo an toàn cho các giao dịch mua hàng (Khóa tồn kho, Tạo đơn, Thanh toán, Hoàn tác khi lỗi).

### 1. Định nghĩa các Bước (Steps) trong Backend (`apps/api-medusa`)
- [x] **Step 1: `reserveInventoryStep`**
  - [x] Invoke: Trừ tạm thời (lock) `inventory_quantity` của các variant trong giỏ.
  - [x] Compensate: Trả lại số lượng tồn kho đã trừ.
- [x] **Step 2: `createPendingOrderStep`**
  - [x] Invoke: Tạo bản ghi `Order` (PostgreSQL) với trạng thái `pending_payment`.
  - [x] Compensate: Đổi trạng thái đơn hàng thành `canceled`.
- [x] **Step 3: `processPaymentStep` (Mock)**
  - [x] Invoke: Gọi hàm giả lập cổng thanh toán (luôn trả về thành công trong MVP).
  - [x] Compensate: Gọi hàm giả lập Refund (Hoàn tiền).
- [x] **Step 4: `completeOrderStep`**
  - [x] Invoke: Đổi trạng thái Order thành `paid`. (Không cần compensate vì là bước cuối).

### 2. Định nghĩa Workflow & API
- [x] **Tạo Checkout Workflow:** Lắp ghép 4 bước trên thành một workflow hoàn chỉnh.
- [x] **API Endpoint (`POST /api/v1/checkout`):**
  - [x] Nhận payload (cart_id, payment_method).
  - [x] Kích hoạt Checkout Workflow.
  - [x] Tracking chuyển đổi (Conversion): Nếu item trong giỏ có `stylist_session_id` hoặc `vton_job_id`, cập nhật dữ liệu để đánh giá hiệu quả AI.
