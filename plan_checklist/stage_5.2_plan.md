# Kế hoạch & Checklist Triển khai: Phân đoạn 5.2 - AI Stylist (Trí tuệ Phối đồ)

## 1. Bối cảnh & Mục tiêu (Background & Motivation)
Xây dựng tính năng AI Stylist cho phép người dùng trò chuyện bằng ngôn ngữ tự nhiên để nhận gợi ý phối đồ từ kho hàng thực tế. Hệ thống áp dụng kiến trúc **RAG (Retrieval-Augmented Generation)** kết hợp với Vector Database (LanceDB) để chống "Hallucination" (ảo giác) - đảm bảo AI chỉ gợi ý các sản phẩm có thật, đang còn hàng.

## 2. Phạm vi & Tác động (Scope & Impact)
- **Backend/AI (`apps/ai-service`):** Khởi tạo LanceDB, viết kịch bản đồng bộ Vector, và xây dựng RAG Pipeline (API-02).
- **Backend/Core (`apps/api-medusa`):** Đóng vai trò Proxy chuyển tiếp request từ Frontend sang AI Service và lưu lịch sử (Session).
- **Frontend (`apps/web`):** Xây dựng giao diện Chat và hiển thị kết quả (Outfit Cards).

---

## 3. Checklist Triển khai Từng phần (Phased Implementation Plan)

> **LƯU Ý QUAN TRỌNG TỪ HỆ THỐNG:**
> Trong quá trình triển khai ban đầu, tôi đã vô tình bỏ quên quy định cốt lõi về **Dependency Inversion Principle (DIP)** được nêu trong file `.ai-knowledge/03_software_architecture_interfaces.md`. Cụ thể, mọi tương tác với AI Models (cả LLM và Embedding) bắt buộc phải thông qua Interface và Adapter, thay vì gọi trực tiếp class chức năng. 
> Lỗi này đã được người dùng nhắc nhở và tôi đã **bổ sung/refactor thành công** cho cả LLM Client (Gemini API) và Embedding Model (Local CLIP).

### Giai đoạn 1 (Phase 1): Thiết lập LanceDB & Script Đồng bộ Vector (AI Service)
*Mục tiêu: Xây dựng cơ sở dữ liệu Vector và nạp dữ liệu mồi (Seed Data).*

- [x] **1.1 Định nghĩa Schema LanceDB:**
  - [x] Khai báo cấu trúc bảng `products_vector` (product_id, vector 512 chiều, category, price, style, occasion, v.v.).
- [x] **1.2 Tích hợp Embedding Model:**
  - [x] Cài đặt và cấu hình mô hình `sentence-transformers/clip-ViT-B-32-multilingual-v1` vào `ai-service` để nhúng (embed) text/hình ảnh.
  - [x] Đã refactor tạo `IEmbeddingService` và `LocalCLIPEmbeddingAdapter`.
- [x] **1.3 Script Đồng bộ Dữ liệu (Vector Sync):**
  - [x] Viết script `sync_to_lancedb.py` lấy dữ liệu giả lập (hoặc dữ liệu từ DB Medusa), nhúng thành Vector và lưu vào LanceDB.
  - [x] Chạy và kiểm tra dữ liệu trong LanceDB.

### Giai đoạn 2 (Phase 2): Phát triển RAG API & Medusa Proxy
*Mục tiêu: Xây dựng API-02 xử lý tìm kiếm ngữ nghĩa và gọi LLM.*

- [x] **2.1 Query Parser (AI Service):**
  - [x] Tích hợp API LLM (Chuyển sang Gemini API do OpenAI hết quota).
  - [x] Cài đặt **Prompt B** để dịch câu query tự nhiên thành các JSON Filters (category, style, occasion, keywords).
  - [x] Đã refactor tạo `IIntentAnalyzer` và `GeminiAnalyzerAdapter`.
- [x] **2.2 Hybrid Search (LanceDB):**
  - [x] Viết logic kết hợp: Lọc cứng bằng metadata (filters) + Lọc mềm bằng Cosine Similarity.
  - [x] Lấy danh sách Top K sản phẩm phù hợp.
- [x] **2.3 Outfit Generator (AI Service):**
  - [x] Cài đặt **Prompt C** nhồi danh sách sản phẩm thu được vào LLM.
  - [x] Yêu cầu LLM sinh ra cấu trúc Set đồ (Options) với định dạng JSON chuẩn.
  - [x] Mở endpoint `POST /api/v1/stylist/search` trên FastAPI.
- [x] **2.4 API Gateway Proxy (MedusaJS):**
  - [x] Tạo custom route `POST /api/v1/stylist/search` tại `api-medusa`.
  - [x] Forward request đến FastAPI `ai-service` kèm internal auth token.
  - [x] Lưu phản hồi (Session data) vào bảng `stylist_sessions` và `stylist_session_items` trước khi trả về Client.

### Giai đoạn 3 (Phase 3): Tích hợp Giao diện (Frontend)
*Mục tiêu: Giao diện người dùng tương tác với AI Stylist.*

- [ ] **3.1 Chat Interface:**
  - [ ] Xây dựng Chatbox UI, quản lý input của người dùng.
- [ ] **3.2 Outfit Card Component:**
  - [ ] Xây dựng UI component hiển thị kết quả Outfit Options (Render ảnh, tiêu đề, lời khuyên và danh sách item).
- [ ] **3.3 Quản lý State:**
  - [ ] Mở rộng Zustand store để quản lý lịch sử trò chuyện và trạng thái "AI is typing...".

---

## 4. Kiểm thử (Verification & Testing)
- [ ] Kiểm tra Script đồng bộ LanceDB.
- [ ] Dùng Postman test trực tiếp API của AI Service (`apps/ai-service`) kiểm tra tốc độ trả về và định dạng JSON.
- [ ] Dùng Postman test API Proxy của MedusaJS để kiểm tra tính toàn vẹn của request và thao tác lưu database.
- [ ] Chat thử trên Frontend: Xác nhận quá trình loading không làm đơ ứng dụng và kết quả render chính xác.