# Kế hoạch Triển khai: Phân đoạn 5.4 - Giao dịch & Workflows (Checkout Saga)

## 1. Bối cảnh & Mục tiêu (Background & Motivation)
Phân đoạn này tập trung vào việc xử lý các nghiệp vụ cốt lõi của E-commerce thông qua cơ chế Workflows (Saga Pattern) của MedusaJS 2.0. Mục tiêu là đảm bảo tính toàn vẹn dữ liệu (Data Integrity) trong quá trình Thanh toán (Checkout) và Đồng bộ dữ liệu Sản phẩm tự động từ Medusa sang hệ thống Vector AI (LanceDB) để phục vụ AI Stylist (Kịch bản 1).

## 2. Phạm vi & Tác động (Scope & Impact)
- **Backend/Core (`apps/api-medusa`):** Xây dựng các luồng Workflow (Steps & Compensations) cho Checkout và Product Sync. Cung cấp API tương tác với Giỏ hàng (Cart) và Thanh toán.
- **Backend/AI (`apps/ai-service`):** Xây dựng Consumer nhận event `product_metadata_sync` (QUEUE-02), dùng LLM trích xuất thuộc tính thời trang và lưu vào LanceDB.
- **Frontend (`apps/web`):** Hoàn thiện Cart Drawer (Thêm sản phẩm vào giỏ) và giao diện trang Thanh toán (Checkout) giả lập.

## 3. Các giai đoạn triển khai (Phases)
- [x] [Giai đoạn 1: Xây dựng luồng Thanh toán (Checkout Workflow)](./stage_5.4_plan_phase_1.md)
- [x] [Giai đoạn 2: Xây dựng luồng Đồng bộ Sản phẩm sang AI (Product Sync Workflow)](./stage_5.4_plan_phase_2.md)
- [x] [Giai đoạn 3: Hoàn thiện Giỏ hàng và Thanh toán trên Frontend](./stage_5.4_plan_phase_3.md)

## 4. Xác minh (Verification)
- [ ] **Kiểm thử Checkout Saga:** Cố ý tạo lỗi ở step thanh toán để xem Medusa có tự động nhả (rollback) tồn kho đã khóa hay không.
- [ ] **Kiểm thử AI Sync:** Thêm một sản phẩm mới qua Admin/API của Medusa và kiểm tra xem LanceDB có tự động được cập nhật Vector cùng các metadata (style, occasion) từ LLM sinh ra hay không.
