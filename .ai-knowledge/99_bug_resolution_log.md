# Bug Resolution Log & Error Memory

Tệp tin này lưu trữ lịch sử các lỗi đã được giải quyết để hệ thống AI tham khảo, tránh lặp lại sai lầm và rút ngắn thời gian gỡ lỗi trong tương lai.

## [2026-05-05] - [MedusaJS File Watcher Restarting on Uploads]
- **Triệu chứng (Symptoms):**
  Tiến trình API bị ngắt ngang (treo Frontend, lỗi 500 hoặc rớt kết nối) khi xử lý tác vụ mất thời gian ngay sau khi lưu file vào ổ đĩa. Log báo `[Watcher] created public/uploads/... created: restarting dev server`.
- **Nguyên nhân gốc rễ (Root Cause):**
  File Watcher của MedusaJS quét toàn bộ thư mục `public/` và lập tức khởi động lại server khi có file mới. Không thể bỏ qua bằng `.gitignore` cục bộ trong mọi trường hợp của monorepo.
- **Giải pháp (Resolution):**
  Chuyển thư mục lưu trữ từ `public/uploads` sang `.medusa/uploads`. Thư mục `.medusa/` là "vùng mù" (blind spot) được Watcher cấu hình cứng bỏ qua. Cấu hình middleware `express.static` để map URL `/uploads/*` đến `.medusa/uploads`.
- **Bài học (Lessons Learned):**
  Mọi tệp tin sinh ra ở runtime (ảnh tải lên, logs) phải được lưu vào các thư mục mà File Watcher đã loại trừ (như `.medusa/`) để đảm bảo không đứt gãy luồng xử lý.

## [2026-05-05] - [Unsupported protocol: d: in @imgly on Windows]
- **Triệu chứng (Symptoms):**
  Hàm `removeBackground` của `@imgly/background-removal-node` văng lỗi `Error: Unsupported protocol: d:` khi chạy trên hệ điều hành Windows.
- **Nguyên nhân gốc rễ (Root Cause):**
  Thư viện sử dụng cơ chế parse URI nội bộ. Khi nhận đầu vào là một đường dẫn tuyệt đối của Windows (Ví dụ: `D:\project\file.png`), nó nhầm ký tự `D:` là tên giao thức mạng (giống như `http:`).
- **Giải pháp (Resolution):**
  Sử dụng hàm `pathToFileURL` từ module `url` của Node.js để bọc file path lại thành URI chuẩn `file:///D:/project/file.png` trước khi truyền vào hàm AI. (Bổ sung thêm tham số `publicPath` trỏ đến CDN để phòng ngừa lỗi tải mô hình tĩnh khi chạy qua pnpm symlink).
- **Bài học (Lessons Learned):**
  Khi truyền file vật lý cục bộ vào bất kỳ thư viện xử lý AI hoặc WebAssembly nào trên Node.js, luôn ưu tiên định dạng URI dạng `file://` thay vì Absolute Path của Windows.

## [2026-05-05] - [MedusaJS Middleware req.path Override (404/301 Errors)]
- **Triệu chứng (Symptoms):**
  Frontend không thể load ảnh qua URL `/uploads/processed_xxx.png`. Trình duyệt báo lỗi 404 (Not Found) hoặc bị redirect 301 tự động nối thêm gạch chéo `/` vào đuôi file (`.png/`).
- **Nguyên nhân gốc rễ (Root Cause):**
  Cơ chế định tuyến nội bộ của MedusaJS tự động sửa đổi thuộc tính `req.path` khi request đi qua custom middleware. Nó cắt bỏ prefix `/uploads` khiến việc parse filename từ `req.path` bị trả về chuỗi rỗng `/`. Thư viện `express.static` cũng không tương thích tốt với cơ chế này.
- **Giải pháp (Resolution):**
  Bỏ `express.static` và viết custom middleware phục vụ file tĩnh (`res.sendFile()`). Thay vì dùng `req.path`, bắt buộc phải trích xuất tên file từ `req.originalUrl` (vì thuộc tính này bảo toàn URL ban đầu) kết hợp với regex để làm sạch trailing slash do 301 redirect gây ra.
- **Bài học (Lessons Learned):**
  Trong môi trường MedusaJS v2, khi thao tác với URL trong custom middleware, luôn cẩn trọng với `req.path` và ưu tiên dùng `req.originalUrl` để lấy chính xác thông tin request ban đầu từ Client.

---