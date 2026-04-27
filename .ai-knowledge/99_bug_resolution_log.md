# Bug Resolution Log & Error Memory

Tệp tin này lưu trữ lịch sử các lỗi đã được giải quyết để hệ thống AI tham khảo, tránh lặp lại sai lầm và rút ngắn thời gian gỡ lỗi trong tương lai.

## [YYYY-MM-DD] - [Tên ngắn gọn của lỗi]
- **Triệu chứng (Symptoms):**
  (Mô tả lỗi hiển thị trên giao diện hoặc log cảnh báo từ server. Ví dụ: API trả về 500 khi upload ảnh quá 5MB).
- **Nguyên nhân gốc rễ (Root Cause):**
  (Giải thích kỹ thuật lý do đoạn code cũ thất bại. Ví dụ: Quên cấu hình giới hạn dung lượng trong middleware multer).
- **Giải pháp (Resolution):**
  (Cách khắc phục. Ghi rõ tên file đã sửa và logic cốt lõi. Ví dụ: Thêm `limits: { fileSize: 5 * 1024 * 1024 }` vào `src/middlewares/upload.ts`).
- **Bài học (Lessons Learned):**
  (Rút ra quy tắc để AI tuân thủ ở các tác vụ sau. Ví dụ: Luôn kiểm tra size file ở tầng middleware trước khi đẩy vào luồng xử lý AI).

---