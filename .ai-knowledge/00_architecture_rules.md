# Architecture Rules & Tech Stack Definition

## 1. Nguyên tắc Kiến trúc Hệ thống (System Architecture)

### 1.1. Phân tách Microservices
Hệ thống được thiết kế theo kiến trúc Microservices để tách biệt hai loại tải (workload) đối lập:
- Core E-commerce Service: Tập trung vào xử lý I/O cao, độ trễ thấp (CRUD sản phẩm, giỏ hàng, thanh toán).
- AI Services (Vision & NLP): Tập trung vào tính toán GPU nặng, thời gian xử lý dài (5-20 giây/request).
- Mục tiêu: Tránh việc các tác vụ AI chặn (block) luồng xử lý của các thao tác thương mại điện tử cơ bản.

### 1.2. Cơ chế Giao tiếp Liên dịch vụ (Inter-service Communication)
- Giao tiếp Đồng bộ (Synchronous): Sử dụng gRPC hoặc REST API nội bộ cho các luồng cần phản hồi nhanh như truy vấn dữ liệu sản phẩm giữa Core Service và AI NLP Service.
- Giao tiếp Bất đồng bộ (Asynchronous): Sử dụng Message Broker (RabbitMQ - AMQP 0-9-1) để quản lý hàng đợi tác vụ sinh ảnh thử đồ. AI Service đóng vai trò là Worker lắng nghe queue.
- Giao tiếp Server-Client: Sử dụng Server-Sent Events (SSE). Backend chủ động đẩy thông báo trạng thái và URL ảnh kết quả xuống Frontend ngay khi AI hoàn tất xử lý. Không sử dụng HTTP Polling.

## 2. Chi tiết Tech Stack

### 2.1. Tầng Frontend & BFF (Next.js)
- Framework: Next.js 14 (App Router) và React 18.
- Quản lý Trạng thái: Zustand. Sử dụng bộ nhớ độc lập bên ngoài cây DOM để quản lý trạng thái hàng đợi AI (Pending, Rendering, Completed), tránh re-render toàn cục.
- Tiền xử lý Hình ảnh: Sử dụng Browser Canvas API và browser-image-compression tại client. Ảnh phải được nén xuống dưới 2MB và tự động cắt (crop) về tỷ lệ 3:4 trước khi upload để bảo vệ tài nguyên server và băng thông.
- Rendering Strategy: Dữ liệu E-commerce dùng Server Components (RSC); Phân hệ AI (nút tải ảnh, preview kết quả) dùng Client Components để cô lập vùng nhớ UI.

### 2.2. Tầng Backend Core (Node.js)
- Framework: Node.js/TypeScript kết hợp MedusaJS 2.0.
- Workflow Engine: Sử dụng MedusaJS Workflow để thực hiện Durable Execution, đảm bảo tính nhất quán dữ liệu (rollback/hoàn tiền) nếu tiến trình AI thất bại.
- Database (RDBMS): PostgreSQL 14+. Sử dụng chuẩn ACID cho giao dịch. Tận dụng kiểu dữ liệu JSONB và chỉ mục GIN để quản lý metadata sản phẩm linh hoạt.

### 2.3. Tầng AI Service (FastAPI)
- Framework: FastAPI (Python) để tận dụng cơ chế ASGI xử lý bất đồng bộ.
- Quản lý Môi trường: Sử dụng `uv` ở chế độ hardlink để tối ưu dung lượng lưu trữ khi cài đặt các thư viện AI nặng (PyTorch, Diffusers).
- AI Vision: Mô hình CatVTON (yêu cầu VRAM < 8GB) cho môi trường local. Tích hợp Fal.ai cho môi trường Production.
- AI Stylist: Kimi-k2.5 hoặc Llama-3-8B cho phân tích ý định (Intent Classification); ViCLIP-OT cho nhúng đa phương thức (Multimodal Embedding).
- Vector Database: LanceDB. Thực hiện Hybrid Search (kết hợp lọc Metadata và Similarity Search) để tăng độ chính xác của kết quả phối đồ.

## 3. Quy chuẩn Vận hành và Ràng buộc Kỹ thuật

### 3.1. Quản trị VRAM (RTX 5060 8GB)
- Tuyệt đối không nạp đồng thời mô hình Vision và NLP vào VRAM. Ưu tiên xử lý NLP trên CPU/RAM hệ thống hoặc qua API ngoại vi.
- RabbitMQ QoS: Thiết lập prefetch_count=1. Worker chỉ nhận và xử lý duy nhất một tác vụ sinh ảnh tại một thời điểm để tránh tràn bộ nhớ đồ họa.

### 3.2. API & Data Contract
- Validation: Sử dụng Zod (TypeScript) và Pydantic (Python) để thực hiện xác thực dữ liệu tại Runtime.
- Cơ chế đồng bộ: Frontend (Next.js) tự động sinh định nghĩa Interface từ file openapi.json của Backend thông qua công cụ openapi-typescript.

### 3.3. Chuẩn hóa Phản hồi Lỗi (Global Error Format)
Mọi phản hồi lỗi (Status Code >= 400) phải tuân thủ cấu trúc:
- status: "error"
- error_code: Định danh lỗi dưới dạng chuỗi (ví dụ: INSUFFICIENT_STOCK, AI_SERVICE_UNAVAILABLE).
- message: Thông báo lỗi thân thiện với người dùng cuối.
- details: Đối tượng chứa chi tiết kỹ thuật phục vụ việc gỡ lỗi.    