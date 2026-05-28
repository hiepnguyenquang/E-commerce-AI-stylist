# Kế hoạch Tích hợp API FLUX.2 [pro] (Replicate)

Tài liệu này phác thảo quy trình thiết kế, các khó khăn tiềm ẩn và các phương án tích hợp API tạo ảnh **FLUX.2 [pro]** từ Replicate vào hệ thống AI Fashion E-commerce hiện tại.

## 1. Phân tích Yêu cầu & Bối cảnh
API FLUX.2 [pro] trên Replicate hỗ trợ:
- Text-to-Image (Tạo ảnh từ văn bản).
- Image-to-Image (Chỉnh sửa ảnh với tối đa 8 ảnh tham chiếu đầu vào).
- Các tham số: `prompt`, `aspect_ratio`, `resolution`, `input_images`, v.v.

**Ứng dụng trong dự án:**
- Thay thế hoặc bổ sung cho CatVTON hiện tại để thực hiện Virtual Try-On với chất lượng photorealistic.

---

## 2. Khó khăn & Thách thức với Codebase hiện tại

Dựa trên cấu trúc kiến trúc được định nghĩa trong `.ai-knowledge/00_architecture_rules.md`, việc tích hợp API này cần giải quyết các bài toán sau:

1. **Sự khác biệt về Số giai đoạn thực thi (1-stage vs 2-stage):**
   - **Hiện tại (CatVTON):** Luồng sinh ảnh đang chạy trải qua 2 giai đoạn riêng biệt (ví dụ: tạo mask/phân tích người dùng -> sinh ảnh Try-On cuối cùng). Điều này đi kèm với các cập nhật trạng thái UI tương ứng qua SSE.
   - **Với Replicate (FLUX):** Quy trình là 1 giai đoạn (One-shot). Hệ thống gom toàn bộ ảnh tham chiếu và text prompt bắn lên API, và chỉ đợi ảnh kết quả duy nhất trả về.
   - **Khó khăn:** Phải thiết kế lại logic ánh xạ trạng thái. Khi dùng API FLUX, UI cần một cách "gom" trạng thái hoặc báo trạng thái "Đang xử lý toàn trình" để không làm hỏng State Machine (Zustand) của Frontend.

2. **Vấn đề Bất đồng bộ & Webhook (Webhook vs Polling):**
   - API của Replicate xử lý bất đồng bộ. Môi trường local (máy dev) không có IP Public để Replicate gọi webhook. Bắt buộc phải dùng công cụ như ngrok/localtunnel, hoặc sử dụng cơ chế Polling (gây tốn tài nguyên worker của `ai-service`).

3. **Quản lý Vòng đời File (File Lifecycle):**
   - Replicate trả về kết quả là một URL ảnh tạm thời (CDN), hệ thống phải có bước trung gian tải ảnh về `.medusa/uploads` để lưu trữ vĩnh viễn trước khi hết hạn.

---

## 3. Tính khả thi của việc Chạy Song song (Local CatVTON vs Cloud FLUX)

Ý tưởng giữ lại cả hai cách chạy (Local và Cloud API) và cho phép chuyển đổi thông qua cấu hình (Config) là **hoàn toàn khả thi, rất chuyên nghiệp và đặc biệt được khuyến nghị**. 

Thiết kế này mang lại lợi thế lớn:
- **Môi trường Dev/Test:** Chạy CatVTON local để không tốn phí API.
- **Môi trường Production:** Chạy FLUX.2 API để đảm bảo chất lượng hình ảnh và giảm tải GPU của server.

### Thiết kế Kiến trúc Multi-Engine (Áp dụng Strategy Pattern)
Để luồng này hoạt động trơn tru mà không làm rối code, ta sẽ thiết kế như sau:

1. **Cấu hình Config (Environment Variables):**
   Bổ sung cấu hình vào `.env` của `ai-service`:
   ```env
   VTON_ENGINE=local # Giá trị: 'local' (CatVTON) hoặc 'cloud' (Replicate FLUX)
   REPLICATE_API_TOKEN=your_token_here
   ```

2. **Dữ liệu giao tiếp RabbitMQ (`shared-types`):**
   Bổ sung tham số tùy chọn vào Payload RabbitMQ để Medusa/Frontend cũng có thể "ép" (override) engine nếu cần (ví dụ: gói VIP dùng API, user thường dùng Local):
   ```typescript
   export type VTONJobEvent = {
     userId: string;
     garmentImage: string;
     personImage: string;
     engine?: 'local' | 'cloud' | 'auto'; // Auto sẽ dựa theo biến môi trường
   }
   ```

3. **Tái cấu trúc Worker (`ai-service`):**
   Trong logic xử lý của Python, áp dụng **Strategy Pattern**:
   - Khởi tạo interface chung: `BaseVTONGenerator`.
   - Lớp `CatVTONGenerator` kế thừa interface, thực thi logic 2 giai đoạn, bắn 2 lần event SSE về Medusa.
   - Lớp `FluxVTONGenerator` kế thừa interface, thực thi logic 1 giai đoạn qua API Replicate, bắn 1 lần event SSE về Medusa (bỏ qua stage 1).
   - Factory pattern sẽ dựa vào config `VTON_ENGINE` để quyết định gọi class nào.

---

## 4. Phương án Tích hợp Tối ưu nhất

**`ai-service` làm Trung gian & Factory Multi-Engine**

*   **Quy trình:**
    1. Frontend -> Medusa API -> Gửi message vào RabbitMQ.
    2. `ai-service` (Python Worker) lấy message từ Queue. Nó đọc biến `VTON_ENGINE`.
    3. **Nếu là `local`:** Khởi chạy `CatVTONGenerator` -> thực hiện 2 giai đoạn như cũ.
    4. **Nếu là `cloud`:** Khởi chạy `FluxVTONGenerator`. 
        - Bắn SSE "Đang kết nối API (Rendering)".
        - Truyền input images lên Replicate, đợi kết quả (polling hoặc async_run).
        - Khi Replicate trả URL ảnh về, `FluxVTONGenerator` tải ảnh dưới dạng Byte Buffer.
    5. Cả 2 engine sau khi có ảnh đều gọi API nội bộ của Medusa (`/api/v1/internal/vision-callback`) để truyền ảnh cuối cùng.
    6. Medusa lưu file vật lý vào `uploads/` và phát sự kiện SSE "Hoàn tất" về cho Client.

Bằng cách thiết kế này, Medusa Core và Frontend gần như không phải sửa đổi logic cốt lõi. Sự phức tạp (1-stage vs 2-stage, API vs Local) được đóng gói hoàn toàn bên trong lớp Worker của `ai-service`.
