# Thiết lập Môi trường Phát triển Cục bộ (Local Setup)

## 1. Yêu cầu Hệ thống (Prerequisites)
- **Node.js:** v20.x trở lên.
- **Package Manager:** `pnpm` (v8+).
- **Python:** 3.10 trở lên (khuyên dùng `conda` hoặc `poetry` cho `ai-service`).
- **Docker & Docker Compose:** Để chạy các dịch vụ nền (Postgres, Redis, RabbitMQ).
- **Phần cứng:** Nvidia GPU (RTX 5060 hoặc tương đương) with Cuda Toolkit 12.x để chạy AI local.

## 2. Các Dịch vụ Nền (Infrastructure Services)
Dự án sử dụng `docker-compose.yml` đặt tại thư mục `docker/` để chạy:
- **Postgres (v15+):** Cơ sở dữ liệu chính của MedusaJS.
- **Redis:** Quản lý cache và queue cơ bản.
- **RabbitMQ:** Xử lý hàng đợi bất đồng bộ chuyên sâu giữa Core Backend và AI Service.

**Lệnh khởi động:**
```bash
cd docker
docker-compose up -d
```

## 3. Khởi tạo Dự án
1. **Cài đặt thư viện Node.js (Monorepo Root):**
   ```bash
   pnpm install
   ```
2. **Thiết lập AI Service (Python):**
   ```bash
   cd apps/ai-service
   python -m venv venv
   source venv/bin/activate  # Hoặc venv\Scripts\activate trên Windows
   pip install -r requirements.txt
   ```

## 4. Quản lý Biến môi trường (.env)
Mỗi ứng dụng sẽ có một file `.env.example` riêng. Yêu cầu copy thành `.env.local`:
- `apps/api-medusa/.env.local` (Chứa DB URL, RabbitMQ URI, API Keys).
- `apps/web/.env.local` (Chứa Public API URLs).
- `apps/ai-service/.env.local` (Chứa LanceDB path, RabbitMQ URI).

## 5. Khởi động Toàn bộ Dự án
Vì sử dụng Turborepo, bạn có thể chạy tất cả (Web, Medusa) cùng lúc từ thư mục gốc:
```bash
pnpm dev
```
*(AI service thường cần được chạy riêng biệt trong Terminal chứa môi trường ảo Python đã kích hoạt)*:
```bash
cd apps/ai-service
uvicorn main:app --reload --port 8000
```
