# Kế hoạch Triển khai: Phân đoạn 5.1 (Hồ sơ AI & Tài sản Người dùng) - Tuân thủ Tuyệt đối (Strict MVP)

## 1. Mục tiêu
Cho phép người dùng thiết lập "Hồ sơ AI" (số đo cơ thể, ảnh cơ sở) và quản lý tủ đồ cá nhân (tải lên trang phục với tính năng tự động xóa nền), tuân thủ tuyệt đối các API contracts hiện tại.

## 2. Ngữ cảnh & Quyết định Kỹ thuật
- **API Gateway:** MedusaJS đóng vai trò là cửa ngõ duy nhất, xử lý các request từ Frontend (`API-01`, `API-06`), xác thực JWT và tương tác với PostgreSQL.
- **Lưu trữ Ảnh:** Sử dụng hệ thống tệp tin nội bộ (Local Storage) ở giai đoạn MVP (lưu vào thư mục `public/uploads` của Medusa).
- **Tuân thủ Hợp đồng (MVP Scope):** Không tạo thêm API nội bộ bằng Python. Tác vụ xóa nền trang phục (phục vụ `API-06`) sẽ được thực thi trực tiếp tại môi trường Node.js (MedusaJS) bằng thư viện JavaScript như `@imgly/background-removal-node`. Quyết định này giúp thỏa mãn yêu cầu MVP lập tức mà không phá vỡ Knowledge Base. Chúng ta có thể cấu trúc lại (refactor) sang Python ở giai đoạn Tối ưu hóa sau MVP.

## 3. Các Bước Triển khai

### Bước 1: Lõi Backend (MedusaJS)
- **Mô hình Dữ liệu (Models):** Tạo cấu trúc dữ liệu cho `AiProfile` và `UserClosetItem` ánh xạ với PostgreSQL theo chuẩn Medusa.
- **Tiện ích Lưu trữ:** Cài đặt hàm tiện ích lưu ảnh vào thư mục tĩnh `public/uploads` và trả về URL công khai.
- **Tích hợp Xóa Nền (Node.js):** Cài đặt và cấu hình thư viện `@imgly/background-removal-node` để xử lý ảnh đồng bộ bên trong Medusa.
- **Khởi tạo API (Bám sát API-01 & API-06):**
  - `POST /api/v1/ai-profile`: Nhận form-data, xác thực người dùng, lưu ảnh gốc, cập nhật/tạo mới bản ghi `AiProfile`.
  - `POST /api/v1/user/garments`: Nhận form-data, xác thực người dùng, đưa ảnh qua hàm xóa nền của Node.js, lưu ảnh kết quả dạng PNG, và tạo mới bản ghi `UserClosetItem`.
  - `GET /api/v1/user/assets`: Trả về danh sách trang phục thuộc sở hữu của người dùng.

### Bước 2: Giao diện (Frontend - Next.js)
- **Component Tiền xử lý Ảnh (`ImageUploader`):** Xây dựng Client Component kết hợp HTML5 Canvas và `browser-image-compression` để:
  - Tự động crop ảnh về chuẩn 3:4.
  - Nén dung lượng file xuống dưới 2MB.
- **Quản lý Trạng thái:** Mở rộng `useVTONStore.ts` để lưu trữ UI state cho quá trình tải lên.
- **Trang Thiết lập Hồ sơ (`/ai-profile`):** Giao diện nhập số đo cơ thể và upload ảnh đại diện.
- **Trang Tủ đồ Cá nhân (`/wardrobe`):** Giao diện lưới (Grid) hiển thị trang phục đã tải lên, kèm nút "Thêm trang phục mới" gọi API-06.

## 4. Kiểm thử (Verification)
- Đảm bảo Frontend nén ảnh và crop chuẩn 3:4 (<2MB) trước khi gửi.
- Đảm bảo Medusa xác thực JWT chính xác.
- Kiểm tra module xóa nền bằng Node.js hoạt động ổn định, trả về ảnh PNG không nền.
- Thực hiện kiểm thử đầu cuối (E2E): Tải trang phục lên và hiển thị thành công trong trang Tủ đồ.