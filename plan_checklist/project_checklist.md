# AI Fashion E-commerce - Kế hoạch Triển khai Tổng thể (Checklist)

Tài liệu này dùng để theo dõi tiến độ khởi tạo và phát triển dự án từ con số 0 dựa trên kiến trúc Monorepo (Turborepo).

## Giai đoạn 1: Thiết lập Hệ sinh thái Monorepo & Hạ tầng
- [x] Khởi tạo `package.json` gốc (Root) cho quản lý workspace (`pnpm`).
- [x] Khởi tạo `pnpm-workspace.yaml` để định nghĩa `apps/*` và `packages/*`.
- [x] Khởi tạo `turbo.json` để cấu hình Turborepo pipelines (build, lint, dev).
- [x] Tạo cấu trúc thư mục khung (Scaffolding) cho `apps/` (web, api-medusa, ai-service) và `packages/` (shared-types, ui-components, eslint-config).
- [x] Khởi tạo hạ tầng Docker (`docker/docker-compose.yml`) cho Postgres 15+, Redis, và RabbitMQ.
- [x] Tạo các file `.env.example` mẫu.

## Giai đoạn 2: Xây dựng Thư viện Dùng chung (Shared Packages)
- [x] Cấu hình gói `packages/eslint-config` (Chuẩn lint chung cho TypeScript/React).
- [x] Cấu hình gói `packages/shared-types` (Chứa `tsconfig.json` gốc, Zod Schemas, API Interfaces, RabbitMQ Payloads).
- [x] Cấu hình gói `packages/ui-components` (React 18 components, Tailwind CSS setup).

## Giai đoạn 3: Bootstrap 3 Ứng dụng Cốt lõi
- [x] **Frontend (`apps/web`):**
  - [x] Khởi tạo Next.js 14 (App Router) với TypeScript và Tailwind CSS.
  - [x] Cấu hình liên kết (dependencies) với `shared-types` và `ui-components`.
  - [x] Thiết lập Zustand store cơ bản (`useCartStore`, `useVTONStore`).
- [x] **Backend Core (`apps/api-medusa`):**
  - [x] Khởi tạo MedusaJS 2.0 (Node.js/TypeScript).
  - [x] Cấu hình kết nối PostgreSQL và Redis.
  - [x] Thiết lập liên kết với `shared-types`.
- [x] **AI Service (`apps/ai-service`):**
  - [x] Khởi tạo FastAPI (Python 3.10+).
  - [x] Thiết lập môi trường ảo bằng `uv` (tạo `pyproject.toml` hoặc `requirements.txt`).
  - [x] Cấu hình kết nối LanceDB và RabbitMQ cơ bản.

## Giai đoạn 4: Triển khai Các Cầu nối Đầu tiên (Integration)
- [x] Cấu hình lệnh `pnpm dev` ở thư mục gốc để chạy đồng thời cả Web và API Medusa qua Turborepo.
- [x] Viết Middleware xác thực nội bộ (`x-internal-token`) cho MedusaJS và FastAPI.
- [x] Cấu hình RabbitMQ Producer (Node.js) và Consumer (FastAPI Python) cho luồng `QUEUE-02` (product_metadata_sync).
- [x] Kiểm thử luồng giao tiếp cơ bản: Next.js -> MedusaJS -> RabbitMQ -> FastAPI.

## Giai đoạn 5: Phát triển Tính năng Cốt lõi (Dựa trên Use Cases)
- [x] **Epic: User Profile & Personalization:** Thiết lập AI Profile (Tải ảnh, nén Canvas, lưu Vector).
- [x] **Epic: AI Stylist & Smart Recommendation:** API tìm kiếm ngữ nghĩa, prompt engineering, giao tiếp với LanceDB.
- [x] **Epic: Virtual Try-On (VTON) Operations:** Luồng xử lý ảnh bất đồng bộ với CatVTON, gửi kết quả qua SSE.
- [x] **Epic: Personal Wardrobe & Assets:** Quản lý tủ đồ ảo của người dùng.
- [x] **Epic: E-commerce Core Transactions:** Giỏ hàng, tồn kho (Workflows), thanh toán.