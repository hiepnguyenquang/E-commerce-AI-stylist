# Giai đoạn 2 (Phase 2): Phát triển RAG API & Medusa Proxy

**Mục tiêu:** Xây dựng API-02 xử lý tìm kiếm ngữ nghĩa và gọi LLM.

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