# Kế hoạch Triển khai: Phân đoạn 5.3 - Virtual Try-On (Thử đồ ảo)

## 1. Bối cảnh & Mục tiêu (Background & Motivation)
Phân đoạn này sẽ hiện thực hóa tính năng "thử đồ ảo" (Virtual Try-On - VTON) cho phép khách hàng ướm thử các sản phẩm thời trang lên ảnh gốc của mình. Quá trình xử lý VTON sẽ tốn khá nhiều thời gian trên máy chủ và tiêu thụ nhiều VRAM (tối thiểu là cho mô hình CatVTON). Vì vậy, hệ thống cần ứng dụng kiến trúc bất đồng bộ bằng Message Queue (RabbitMQ) và truyền thông thời gian thực đến Client bằng Server-Sent Events (SSE).

## 2. Phạm vi & Tác động (Scope & Impact)
- **Backend/AI (`apps/ai-service`):** Xây dựng consumer nhận tác vụ từ hàng đợi, thực thi việc ghép ảnh thông qua Interface `IVirtualTryOnService` bằng `LocalCatVTONAdapter`.
- **Backend/Core (`apps/api-medusa`):** Cung cấp API gửi job vào Queue và Endpoint SSE chuyên biệt để Client lắng nghe kết quả trả về từ AI.
- **Frontend (`apps/web`):** Bổ sung nút "Thử đồ" ở giao diện Product Details Page (PDP) hoặc AI Stylist, tích hợp UI trạng thái xử lý tiến trình và cập nhật ảnh ngay khi nhận tín hiệu qua SSE.

## 3. Các giai đoạn triển khai (Phases)
- [x] [Giai đoạn 1: Cấu hình Message Queue & SSE ở Backend](./stage_5.3_plan_phase_1.md)
- [x] [Giai đoạn 2: Hiện thực Model CatVTON (AI Service)](./stage_5.3_plan_phase_2.md)
- [x] [Giai đoạn 3: Cập nhật Giao diện (Frontend)](./stage_5.3_plan_phase_3.md)

## 4. Xác minh (Verification)
- [ ] **Kiểm tra luồng SSE:** Khi Frontend bấm nút, giao diện chuyển sang trạng thái loading, và ngay sau khi AI render xong, ảnh lập tức đổi mà không cần tải lại trang.
- [ ] **Kiểm tra giới hạn VRAM:** Mở trình quản lý task (Task Manager / nvtop) để đảm bảo Python Process không vượt quá 8GB trong khi render ảnh CatVTON.
- [ ] **Kiểm tra song song:** Thử kích hoạt nhiều yêu cầu thử đồ đồng thời (Stress test) để chứng thực RabbitMQ không gửi quá 1 job cho Worker trong 1 lúc (`prefetch_count=1`).