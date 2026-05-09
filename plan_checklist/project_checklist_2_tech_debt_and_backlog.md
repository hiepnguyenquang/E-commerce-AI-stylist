# Tech Debt & Backlog (Kế hoạch Mở rộng & Tối ưu)

Tài liệu này (Project Checklist 2) lưu trữ các khoản "nợ kỹ thuật" (Technical Debt) sinh ra trong quá trình phát triển nhanh bản MVP, cùng với các ý tưởng/yêu cầu tính năng mở rộng (Feature Backlog) để phát triển trong các giai đoạn tiếp theo của dự án AI Fashion E-commerce.

---

## 1. Nợ Kỹ thuật (Technical Debt)
*Ưu tiên giải quyết để hệ thống ổn định và chuẩn kiến trúc hơn.*

- [x] **Tách biệt Domain Models khỏi Medusa (Refactoring):** Đã loại bỏ các import phụ thuộc vào `@medusajs/medusa` từ các models thuộc tầng Domain để tuân thủ kiến trúc.
- [x] **Sử dụng model CatVTON thật thay vì mock test:** Đảm bảo có interface và adapter (Đã tích hợp source code gốc từ Github, cấu hình tải weights và tối ưu VRAM).
- [x] **Đồng bộ hóa dữ liệu Hồ sơ AI (AI Profile Hydration) và Chỉnh sửa Hồ sơ:**
  - **Vấn đề:** Hiện tại UI phụ thuộc vào trạng thái `humanImageUrl` lưu trong LocalStorage của Zustand. Nếu xóa cache, dữ liệu sẽ mất dù dưới DB vẫn còn. Thêm vào đó, trang `/ai-profile` luôn hiển thị form trống để tạo mới chứ không hiển thị thông tin cũ, và không có ảnh preview sau khi đã tạo xong.
  - **Kế hoạch triển khai (Checklist):**
    - [x] **Backend (`apps/api-medusa/src/api/v1/ai-profile/route.ts`):** Tạo thêm method `GET` để fetch hồ sơ dựa trên `customer_id` (trả về height, weight, base_body_image_url). API cần bắt lỗi nếu user chưa có profile thì trả về null hoặc 404 có format chuẩn.
    - [x] **Frontend (`apps/web/src/app/ai-profile/page.tsx`):**
      - Thêm logic `useEffect` để gọi API `GET /v1/ai-profile` ngay khi load trang.
      - Đổ (Hydrate) dữ liệu thu được vào các state (height, weight, gender, humanImage). Ghi đè cập nhật vào Zustand Store.
      - Thay đổi giao diện: Nếu đã có `humanImage`, hiển thị ảnh preview hiện tại và nút "Thay đổi ảnh" để mở lại uploader. Cho phép chỉnh sửa thông số height/weight và nhấn "Cập nhật Hồ sơ" (vẫn gọi lại `POST` vì logic `POST` hiện tại dùng `createAiProfiles` nhưng có thể nâng cấp thành update).
    - [x] **Backend Service Update:** Kiểm tra hàm `POST /v1/ai-profile`, nếu profile của user đã tồn tại thì phải dùng hàm update (hoặc upsert) thay vì tạo mới liên tục sinh rác trong database.
- [x] **Tự động dọn rác dữ liệu trang phục mồ côi (Orphaned Data Correction):**
  - **Vấn đề:** Việc xóa file thủ công (hard delete) trong thư mục uploads sinh ra dữ liệu mồ côi (orphaned data) dưới DB gây ra lỗi 404/301 ở Frontend.
  - **Giải pháp:** Đã implement logic tự động dọn rác ở API `GET /v1/user/assets`: tự động phát hiện file vật lý bị mất và xóa record DB tương ứng.
- [x] **Xây dựng API Xóa trang phục (Closet Deletion):**
  - **Vấn đề:** Khách hàng có thể upload ảnh vào Tủ đồ cá nhân (`/wardrobe`) nhưng chưa có chức năng xóa chủ động từ giao diện.
  - **Giải pháp:** Đã xây dựng API `DELETE /api/v1/user/garments/:id` trên MedusaJS. Hàm xử lý thực hiện đồng bộ 2 việc: Xóa bản ghi trong database `user_closet_items` VÀ gọi hàm `fs.unlink` để xóa file ảnh vật lý. Đồng thời cập nhật Frontend giao diện nút thùng rác gọi API này và xóa khỏi UI.
- [x] **Xử lý Không tương thích Kiến trúc GPU mới (RTX 5060 / SM120):**
  - **Vấn đề:** PyTorch phiên bản ổn định (2.6) thiếu file thư viện biên dịch sẵn (wheel) cho các kiến trúc cực kỳ mới như `sm_120`, gây lỗi `CUDA error: no kernel image is available`.
  - **Giải pháp:** Cập nhật file `.env` kích hoạt cơ chế biên dịch thời gian thực (PTX JIT) thông qua biến `TORCH_CUDA_ARCH_LIST="12.0"` và `CUDA_MODULE_LOADING=LAZY`. Sau đó, thiết lập lại kho thư viện `pyproject.toml` để ép `uv` cài đặt phiên bản PyTorch Nightly (`>=2.7.0.dev`) tích hợp CUDA 12.8 trên môi trường WSL2/Ubuntu.
- [ ] **Chống ảo giác API Stylist (Intent Guardrail):**
  - **Vấn đề:** Nếu khách hàng chat những nội dung không liên quan đến mua sắm/thời trang (VD: "Thời tiết hôm nay"), hệ thống vẫn chạy luồng RAG và gọi DB LanceDB một cách vô ích.
  - **Giải pháp:** Cập nhật Prompt B hoặc thêm một bước gọi LLM nhỏ ở đầu luồng `POST /api/v1/stylist/search` để phân loại ý định. Nếu không phải là "Fashion Search", trả về JSON yêu cầu Client hiển thị câu trả lời từ chối khéo léo ("Tôi là Stylist thời trang, tôi chỉ giúp bạn phối đồ thôi nhé...").
- [ ] **Hydrate chi tiết sản phẩm từ Backend (AI Stylist):**
  - **Vấn đề:** API `/stylist/search` trả về mảng ID sản phẩm `["prod_1", ...]`. Frontend hiện tại phải tự gọi thêm Store API của Medusa để lấy ảnh và giá.
  - **Giải pháp:** Medusa Proxy (tại `api-medusa`) sau khi nhận mảng ID từ `ai-service`, hãy tự động query database PostgreSQL để lấy ra Object chi tiết (kèm ảnh, giá) và "đắp" (hydrate) vào JSON trước khi trả về cho Client. Giảm tải số lượng request HTTP từ Browser.
- [ ] **Hệ thống xử lý lỗi UI tập trung (Global Error Boundary):**
  - **Vấn đề:** Các lỗi API hoặc đứt kết nối SSE hiện tại xử lý khá rải rác, có thể gây trắng trang (White screen of death) trên React.
  - **Giải pháp:** Tạo các file `error.tsx` chuẩn của Next.js App Router và tích hợp Toast Notification tập trung.
---

## 2. Tính năng Mở rộng (Feature Backlog)
*Các tính năng giúp nâng cao trải nghiệm người dùng và nghiệp vụ thương mại.*

- [ ] **"Đổi món đồ" trong Set đồ (Replace Item - API-03):**
  - **Mô tả:** Trong giao diện AI Stylist (Outfit Card), thêm nút "Tìm áo khác". Khi bấm, hệ thống gọi API-03 để tìm kiếm trong LanceDB các sản phẩm tương đồng về Style/Occasion để thay thế vào Set đồ hiện tại mà không làm hỏng tổng cục.
- [x] **Phối đồ chủ động (Mix & Match - UC-VTON-02):**
  - **Mô tả:** Xây dựng giao diện Kéo-Thả (Drag & Drop) hoặc Canvas trên trang Tủ đồ cá nhân (`/wardrobe`). Cho phép khách hàng tự do chọn nhiều món đồ đã được tách nền (Ví dụ: 1 Áo + 1 Quần) từ tủ đồ, ghép chúng lại với nhau thành một Set hoàn chỉnh và nhấn "Thử đồ ảo" (gọi VTON với multi-step jobs).
- [ ] **Lịch sử Chat Stylist (Chat History):**
  - **Mô tả:** Lưu lại lịch sử chat của người dùng (từ bảng `stylist_sessions`) và hiển thị lại ở một Sidebar bên Frontend. Cho phép khách hàng xem lại các gợi ý phối đồ từ ngày hôm qua.
- [ ] **Đồng bộ hóa Tồn kho & Vector DB (Cronjob/Fallback):**
  - **Mô tả:** Luồng Product Sync hiện tại (RabbitMQ) có thể bị fail nếu LLM API lỗi hoặc LanceDB bị khóa. Cần viết một Cronjob chạy ngầm (hoặc Medusa Scheduled Job) quét bảng `products` mỗi đêm để tìm những sản phẩm chưa có Vector, sau đó đẩy lại vào queue để đảm bảo tính nhất quán dữ liệu 100%.
- [x] **Đồng bộ Tủ đồ cá nhân sang AI (User Closet Sync):**
  - **Mô tả:** Gửi metadata của ảnh người dùng tải lên sang AI Service để nhúng Vector, giúp AI Stylist có thể phối đồ bằng trang phục cá nhân của người dùng.
- [ ] **Giao diện Đăng nhập (Authentication):**
  - **Mô tả:** Chuyển đổi cơ chế "Mock/Hardcode user_id" hiện tại sang hệ thống Login/Register thực tế sử dụng cơ chế Auth của Medusa (khách hàng) và quản trị viên (Admin).
- [ ] **Mở rộng API Admin nội bộ:**
  - **Mô tả:** Chuyển đổi endpoint `/api/v1/internal/products` (Form thêm sản phẩm) sang sử dụng JWT Token của luồng đăng nhập Admin thay vì dùng Secret Key tĩnh.
- [x] **Thử đồ Ảo Đa Lớp (Multi-step VTON / Mix & Match):**
  - **Mô tả:** Hiện tại VTON chỉ xử lý 1 món đồ. Cần triển khai Use Case UC-VTON-02 để khách hàng có thể chọn cả Áo và Quần.
  - **Giải pháp:** Cập nhật API `/vton/jobs` để nhận mảng `[garment_1, garment_2]`. Hệ thống sẽ tạo Job 1 (ghép Áo) đẩy vào RabbitMQ. Khi AI làm xong Job 1, Backend dùng URL kết quả đó làm ảnh gốc (`human_image_url`) tạo tiếp Job 2 (ghép Quần) có liên kết `parent_job_id` với Job 1, rồi mới trả kết quả cuối cùng qua SSE.
- [ ] **(Dành cho bạn bổ sung thêm...)**
