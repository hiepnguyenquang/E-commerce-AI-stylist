# Quy chuẩn MedusaJS Workflows (Saga Pattern)

Tài liệu này định nghĩa cách dự án sử dụng **MedusaJS 2.0 Workflows** (dựa trên kiến trúc Saga Pattern) để đảm bảo tính toàn vẹn dữ liệu (Data Integrity) trong các giao dịch phân tán, đặc biệt là luồng Thanh toán (Checkout) và Đồng bộ dữ liệu sang AI (Product Sync).

## 1. Nguyên lý Hoạt động (Saga Pattern)

Khác với các hàm chạy tuần tự thông thường, mỗi `Workflow` trong Medusa được cấu thành từ nhiều `Step` (Bước) độc lập. Mỗi `Step` bắt buộc phải định nghĩa hai khối logic:
- **Invoke (Thực thi):** Đoạn mã thực hiện tác vụ chính (Ví dụ: Trừ tồn kho, Gọi API VNPay).
- **Compensate (Bồi thường / Hoàn tác):** Đoạn mã chạy ngược lại tác vụ của `Invoke` nếu có bất kỳ một `Step` nào phía sau bị lỗi (Ví dụ: Cộng lại tồn kho đã trừ, Gọi API Refund để hoàn tiền).

Cơ chế này giúp loại bỏ hoàn toàn các khối `try...catch` lộn xộn chứa logic rollback thủ công, đảm bảo cơ sở dữ liệu luôn ở trạng thái nhất quán (Consistent State).

---

## 2. Luồng 1: Thanh toán Đơn hàng (Checkout Workflow)

Đây là luồng quan trọng nhất của hệ thống E-commerce, đảm bảo xử lý triệt để các rủi ro: Khách hủy thanh toán giữa chừng, lỗi OTP, mạng chập chờn, hoặc Server sập đột ngột ngay sau khi đã trừ tiền.

### Các Bước (Steps) và Cơ chế Hoàn tác:

#### Step 1: `reserveInventoryStep` (Giữ Tồn kho)
- **Invoke:** Khóa (Lock) và trừ tạm thời `inventory_quantity` của các mặt hàng trong giỏ để tránh khách khác mua trùng.
- **Compensate:** Nhả khóa, cộng trả lại chính xác số lượng đã trừ vào kho hệ thống.

#### Step 2: `createPendingOrderStep` (Tạo Đơn hàng Tạm)
- **Invoke:** Khởi tạo bản ghi `Order` trong PostgreSQL với trạng thái `pending_payment`.
- **Compensate:** Hủy bỏ (Chuyển trạng thái mã đơn hàng thành `canceled`), không xóa vật lý để giữ lại dấu vết (Audit Log).

#### Step 3: `processPaymentStep` (Xử lý Thanh toán - VNPay/Stripe)
- **Invoke:** Gửi request trừ tiền và chờ xác nhận từ Cổng thanh toán.
- **Compensate (Cực kỳ quan trọng):** Nếu khách đã bị trừ tiền thành công ở bước này, nhưng hệ thống bị sập (Crash/Đứt mạng) ở Step 4 khiến đơn hàng không được ghi nhận -> Hàm này tự động gọi API `Refund` (Hoàn tiền) của VNPay/Stripe để trả lại 100% tiền cho khách hàng, tránh khiếu nại.

#### Step 4: `completeOrderStep` (Hoàn tất Đơn hàng)
- **Invoke:** Cập nhật trạng thái `Order` thành `paid`, chuyển hóa Giỏ hàng (`Cart`) thành Đơn hàng chính thức và gửi Email xác nhận.
- **Compensate:** *(Thường không áp dụng vì đây là bước cuối, nếu lỗi ở đây sẽ kích hoạt Compensate của Step 3, 2, 1)*.

> **Tình huống thực tế:**
> Khách quẹt thẻ thành công (Step 3 xong). Ngay lập tức Server sập (Lỗi Step 4). MedusaJS Engine tự động kích hoạt tiến trình chạy lùi:
> Bồi thường Step 3 (Hoàn 1 triệu VNĐ) -> Bồi thường Step 2 (Hủy mã đơn) -> Bồi thường Step 1 (Trả lại tồn kho). Dữ liệu sạch sẽ hoàn toàn.

---

## 3. Luồng 2: Đồng bộ Sản phẩm sang AI (Product Sync Workflow)

Luồng này đảm bảo Dữ liệu gốc (PostgreSQL) và Dữ liệu Vector (LanceDB của AI) luôn đồng bộ mà không làm chậm trải nghiệm của Admin khi đăng sản phẩm.

### Các Bước (Steps) và Cơ chế Hoàn tác:

#### Step 1: `createProductInDbStep` (Tạo Sản phẩm nội bộ)
- **Invoke:** Lưu thông tin sản phẩm (Tên, Giá, Ảnh, Tồn kho) vào PostgreSQL.
- **Compensate:** Xóa bản ghi sản phẩm vừa tạo (Soft delete).

#### Step 2: `emitSyncToRabbitMQStep` (Đẩy Event Đồng bộ)
- **Invoke:** Đóng gói thông tin sản phẩm thành Payload JSON và đẩy vào hàng đợi `QUEUE-02` (product_metadata_sync) của RabbitMQ. (AI Service sẽ tự nhận và xử lý sau).
- **Compensate:** Nếu RabbitMQ bị sập (Không kết nối được), hàm này sẽ KHÔNG rollback Step 1 (vì không đáng để bắt Admin nhập lại sản phẩm chỉ vì lỗi hàng đợi). Thay vào đó, nó ghi ID sản phẩm vào bảng `ai_sync_failures` để một Cronjob định kỳ quét và gửi lại sau.
