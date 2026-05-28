# Báo Cáo: Các Kiến Thức (Knowledge) Còn Thiếu

Dựa trên việc kiểm tra các tài liệu hiện có trong `.ai-knowledge/` (như `api_contracts.yaml`, `architecture_rules.md`, `database_schema.sql`, v.v.), hệ thống hiện đã có bộ khung tốt về kiến trúc và giao tiếp. Tuy nhiên, để có thể bắt đầu quá trình viết code (implement) một cách trơn tru, dự án cần bổ sung các tài liệu (knowledge) sau:

## 1. Cấu trúc Repository & Môi trường (Repository Structure & Setup)
*   **Vấn đề:** Hiện chưa rõ dự án sẽ tổ chức theo dạng Monorepo (Turborepo/Nx) hay Multi-repo riêng biệt cho Frontend, Backend Node.js, và AI FastAPI.
*   **Yêu cầu bổ sung:** 
    *   Tài liệu quy định cấu trúc thư mục chuẩn (`directory_structure.md`).
    *   Hướng dẫn thiết lập môi trường phát triển cục bộ (`local_setup.md`) bao gồm Docker Compose (cho RabbitMQ, Postgres, Redis) và các biến môi trường (`.env.example`).

## 2. Cơ chế Xác thực Liên dịch vụ (Inter-service Authentication)
*   **Vấn đề:** Hệ thống có nhiều service (Node.js Core và AI FastAPI) cần giao tiếp với nhau qua API và Message Queue, nhưng chưa có quy định bảo mật cho các giao tiếp này.
*   **Yêu cầu bổ sung:** 
    *   Cần tài liệu `internal_auth_rules.md` định nghĩa cách các service xác thực nhau (VD: sử dụng API Keys nội bộ, JWT token, hay Mutual TLS).

## 3. Schema cho Vector Database (LanceDB)
*   **Vấn đề:** Tài liệu kiến trúc có đề cập việc sử dụng LanceDB cho các tác vụ AI (tìm kiếm vector), nhưng `database_schema.sql` hiện tại chỉ chứa schema của PostgreSQL.
*   **Yêu cầu bổ sung:** 
    *   Cần file định nghĩa cấu trúc bảng/collections cho LanceDB (`vector_db_schema.md` hoặc `.yaml`), bao gồm số chiều (dimensions) của vector, các metadata đi kèm để phục vụ lọc dữ liệu.

Internal_Async_Contracts## 4. Đặc tả Endpoints Nội bộ (Internal Webhooks / SSE)
*   **Vấn đề:** `api_contracts.yaml` quy định các luồng bất đồng bộ sử dụng RabbitMQ và Webhook/SSE, nhưng chưa định nghĩa cụ thể các API endpoint nội bộ sẽ nhận callback từ AI Service.
*   **Yêu cầu bổ sung:** 
    *   Cập nhật `api_contracts.yaml` hoặc tạo file mới `internal_apis.yaml` để đặc tả các endpoint nội bộ (VD: Node.js nhận kết quả sinh ảnh từ AI Service qua Webhook).

## 5. Quy chuẩn Thiết kế Frontend (Frontend Conventions)
*   **Vấn đề:** Được yêu cầu sử dụng Next.js 14, React 18, và Zustand, nhưng chưa có quy ước về cách phân chia component và quản lý state.
*   **Yêu cầu bổ sung:** 
    *   Tạo file `frontend_guidelines.md` quy định:
        *   Cấu trúc thư mục Frontend (phân chia `app/`, `components/`, `lib/`, `store/`).
        *   Nguyên tắc tách biệt Server Components và Client Components.
        *   Luồng quản lý state chuẩn với Zustand.

## 6. Luồng Tích hợp MedusaJS Workflows
*   **Vấn đề:** Hệ thống sử dụng MedusaJS 2.0 làm core e-commerce, nhưng chưa có tài liệu hướng dẫn cách đưa các tác vụ gọi AI (qua RabbitMQ) vào hệ thống Workflow của Medusa.
*   **Yêu cầu bổ sung:** 
    *   Tạo tài liệu `medusa_workflows_ai.md` mô tả kiến trúc tích hợp: làm sao để một luồng đặt hàng/thử đồ tự động trigger AI Job, theo dõi trạng thái, và cập nhật kết quả vào database của MedusaJS.

## 7. Đặc tả Mô hình AI Sinh ảnh (Image Gen / VTON Models)
*   **Vấn đề:** Thiếu thông số kỹ thuật cho các Model AI cốt lõi như Virtual Try-On (VTON) và Image Generation.
*   **Yêu cầu bổ sung:** 
    *   Tài liệu `ai_model_specs.md` định nghĩa:
        *   **Kiến trúc Model:** Lựa chọn giữa Stable Diffusion (SDXL/Flux) kết hợp ControlNet/IP-Adapter hay các model chuyên biệt (IDM-VTON).
        *   **Optimization:** Cách cấu hình để chạy mượt mà trên **RTX 5060 8GB** (Sử dụng TensorRT, Quantization 4-bit/8-bit, hoặc xformers).
        *   **I/O Format:** Quy định kích thước ảnh chuẩn (VD: 768x1024) và các tham số inference mẫu.

## 8. Cấu hình LLM & Prompt Engineering
*   **Vấn đề:** Chưa có quy định về việc sử dụng LLM cho tư vấn thời trang và trích xuất dữ liệu sản phẩm.
*   **Yêu cầu bổ sung:** 
    *   Tài liệu `llm_config_prompts.md` quy định:
        *   **Lựa chọn Model:** Sử dụng Local LLM (Llama 3, Mistral) hay External API (Gemini/OpenAI).
        *   **System Prompts:** Lưu trữ bộ prompt chuẩn cho "Fashion Stylist AI" và "Metadata Extractor".
        *   **Cơ chế RAG:** Quy trình LLM truy vấn dữ liệu từ LanceDB để tư vấn sản phẩm có sẵn trong kho.
