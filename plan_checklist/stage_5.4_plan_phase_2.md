# Giai đoạn 2: Xây dựng luồng Đồng bộ Sản phẩm sang AI (Product Sync Workflow)

**Mục tiêu:** Tự động hóa quá trình đưa hàng hóa mới từ cơ sở dữ liệu hệ thống (Medusa) sang cơ sở dữ liệu Vector của AI (LanceDB).

### 1. Product Sync Workflow (MedusaJS - `apps/api-medusa`)
- [x] **Mở rộng/Hook vào Product Creation:**
  - [x] Bắt sự kiện khi một sản phẩm (Product) được tạo hoặc cập nhật thành công trong PostgreSQL.
- [x] **Step: `emitSyncToRabbitMQStep`:**
  - [x] Đóng gói thôngക tin sản phẩm (ID, Name, Description, Category) thành payload JSON.
  - [x] Đẩy message vào hàng đợi `QUEUE-02` (`product_metadata_sync`) của RabbitMQ.
  - [x] Xử lý dự phòng (Fallback): Nếu RabbitMQ sập, không rollback việc tạo sản phẩm mà log lại ID để sync sau.

### 2. AI Sync Consumer (`apps/ai-service`)
- [x] **Khởi tạo Consumer QUEUE-02:**
  - [x] Lắng nghe message từ hàng đợi `product_metadata_sync`.
- [x] **Logic Xử lý AI (Tagging & Embedding):**
  - [x] Áp dụng **Prompt A**: Gọi LLM Cloud API truyền tên và mô tả sản phẩm vào để lấy JSON chứa tag (style, occasion, material).
  - [x] Tạo câu văn miêu tả từ JSON và nhúng thành Vector 512 chiều bằng model CLIP.
- [x] **Cập nhật LanceDB:**
  - [x] Upsert dữ liệu (Vector + ID + Tags) vào bảng `products_vector`.
