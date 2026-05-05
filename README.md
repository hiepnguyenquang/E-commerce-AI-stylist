# AI Fashion E-commerce (Stage 4 - Integration Completed)

Dự án Thương mại điện tử thời trang tích hợp AI, sử dụng kiến trúc Monorepo để kết hợp sức mạnh của MedusaJS (E-commerce Core), Next.js (Frontend) và FastAPI (AI Services).

## 🚀 Giới thiệu
Chương trình là một hệ thống Microservices hiện đại cho phép người dùng trải nghiệm các tính năng thời trang AI như:
- **AI Stylist:** Tư vấn phối đồ qua ngôn ngữ tự nhiên.
- **Virtual Try-On (VTON):** Thử đồ ảo trên ảnh cá nhân.
- **Giao tiếp Hệ thống:** Sử dụng RabbitMQ để xử lý bất đồng bộ các tác vụ AI nặng và SSE để cập nhật kết quả thời gian thực.

## 🛠 Tech Stack
- **Monorepo:** Turborepo, pnpm.
- **Frontend:** Next.js 14 (App Router), React 18, Zustand.
- **Backend Core:** MedusaJS 2.0 (Node.js/TypeScript), PostgreSQL, Redis.
- **AI Service:** FastAPI (Python), LanceDB (Vector DB), Pika (RabbitMQ client).
- **Infrastructure:** Docker, RabbitMQ.

## 📋 Yêu cầu hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js v20+** & **pnpm** (`npm install -g pnpm`).
2. **Python 3.10+** & **uv** (`pip install uv`).
3. **Docker Desktop** (Đã bật và đang chạy).

## 📦 Hướng dẫn cài đặt & Chạy thử (Step-by-Step)

### 1. Cài đặt thư viện
Tại thư mục gốc dự án:
```bash
pnpm install
```

Tại thư mục `apps/ai-service`:
```bash
uv venv
# (Windows)
.venv\Scripts\activate
# (Sau đó cài đặt dependency)
uv pip install -r pyproject.toml
```

### 2. Khởi động hạ tầng (Docker)
Mở terminal tại thư mục `docker/`:
```bash
docker compose up -d
```
*Đợi các container PostgreSQL, Redis, RabbitMQ ở trạng thái "Started".*

### 3. Khởi tạo Database (Chỉ làm lần đầu)
Tại thư mục gốc dự án:
```bash
pnpm -F @fundamental/api-medusa exec medusa db:migrate
```

### 4. Khởi động toàn bộ hệ thống

**Terminal 1 (Frontend & MedusaJS):** Tại thư mục gốc:
```bash
pnpm dev
```

**Terminal 2 (AI Service):** Tại thư mục `apps/ai-service`:
```bash
uv run uvicorn main:app --reload
```

## 🧪 Kiểm thử luồng giao tiếp (Integration Test)
Để kiểm tra xem MedusaJS có gửi được tin nhắn sang FastAPI thông qua RabbitMQ hay không, hãy mở **Terminal thứ 3** và chạy lệnh cURL sau (trên Windows):

```powershell
curl.exe -X POST http://localhost:9000/custom/internal/test-rmq -H "x-internal-token: your_super_secret_internal_key_here" -H "Content-Type: application/json"
```

**Kết quả mong đợi:**
- Terminal cURL trả về JSON `status: success`.
- Terminal của **AI Service** in ra log: `[RabbitMQ Consumer] Received product metadata sync event...`.

---
*Dự án đang trong quá trình phát triển Giai đoạn 5.