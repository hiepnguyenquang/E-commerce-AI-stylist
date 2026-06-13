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

## 🧭 Tổng quan kiến trúc

```mermaid
flowchart LR
    Web[Next.js Web<br/>localhost:3000]
    Medusa[MedusaJS API<br/>localhost:9000]
    Rabbit[RabbitMQ<br/>5672 / 15672]
    AI[FastAPI AI Service<br/>localhost:8000]
    Lance[(LanceDB)]
    Postgres[(PostgreSQL)]
    Redis[(Redis)]

    Web -->|REST / SSE| Medusa
    Medusa --> Postgres
    Medusa --> Redis
    Medusa -->|publish jobs/events| Rabbit
    Rabbit -->|consume| AI
    AI --> Lance
    AI -->|ai_vision_results| Rabbit
    Rabbit -->|consume result| Medusa
    Medusa -->|SSE vision_update| Web
```

Các luồng chính:
- **AI Stylist:** Web gọi Medusa `/v1/stylist/search`, Medusa gọi FastAPI, FastAPI tìm kiếm RAG trên LanceDB và trả outfit options về Medusa để hydrate dữ liệu sản phẩm/tủ đồ.
- **Product Sync:** Khi sản phẩm được tạo/cập nhật trong Medusa, subscriber đẩy metadata qua queue `product_metadata_sync`; AI Service phân tích metadata và lưu vector vào LanceDB.
- **Wardrobe Sync:** Khi người dùng upload đồ cá nhân, Medusa đẩy queue `closet_metadata_sync`; AI Service phân tích ảnh, tạo embedding và lưu vào `closet_vector`.
- **Virtual Try-On:** Web gọi Medusa `/v1/vton/jobs`; Medusa tạo job, đẩy queue `ai_vision_jobs`; AI Service xử lý VTON và trả kết quả qua `ai_vision_results`; Medusa broadcast cho Web bằng SSE.

## 📁 Cấu trúc thư mục chính

```text
apps/
  web/          Next.js frontend
  api-medusa/   MedusaJS backend, custom routes, modules, workflows
  ai-service/   FastAPI service, LLM, embedding, LanceDB, VTON consumers
packages/
  shared-types/ Shared TypeScript schemas/types
  ui-components/Shared React UI components
docker/         PostgreSQL, Redis, RabbitMQ
plan_checklist/ Development plans and stage checklists
report_latex/   Project report source
slide/          Presentation source and exports
```

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
# Cài đặt dependency theo pyproject.toml / uv.lock
uv sync
```

### 2. Cấu hình biến môi trường

Tạo các file `.env` từ file mẫu:

```powershell
Copy-Item apps\web\.env.example apps\web\.env
Copy-Item apps\api-medusa\.env.example apps\api-medusa\.env
Copy-Item apps\ai-service\.env.example apps\ai-service\.env
```

Các biến quan trọng:

| Service | Biến | Giá trị local mặc định | Ghi chú |
| --- | --- | --- | --- |
| Web | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `http://localhost:9000` | URL Medusa API |
| Web | `NEXT_PUBLIC_AI_SERVICE_URL` | `http://localhost:8000` | URL FastAPI, chủ yếu dùng khi cần gọi trực tiếp |
| Medusa | `DATABASE_URL` | `postgres://medusa_admin:medusa_password@localhost:5432/medusa_db` | PostgreSQL từ Docker |
| Medusa | `REDIS_URL` | `redis://localhost:6379` | Redis cache/event infra |
| Medusa | `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | Queue cho AI jobs và sync |
| Medusa | `AI_SERVICE_URL` | `http://127.0.0.1:8000` | URL FastAPI để Medusa gọi nội bộ |
| Medusa | `STORE_CORS` | `http://localhost:3000` | Cho phép frontend gọi API |
| Medusa | `ADMIN_CORS` | `http://localhost:7001` | Cho Medusa Admin nếu dùng |
| Medusa | `AUTH_CORS` | `http://localhost:3000,http://localhost:9000` | Cần có vì `medusa-config.ts` đang đọc biến này |
| Medusa / AI | `INTERNAL_API_SECRET` | `your_super_secret_internal_key_here` | Phải giống nhau giữa Medusa và AI Service |
| AI Service | `LANCEDB_URI` | `./data/lancedb` | Nơi lưu vector database |
| AI Service | `MEDUSA_BACKEND_URL` | `http://127.0.0.1:9000` | Dùng khi AI Service cần tải ảnh từ Medusa |
| AI Service | `GEMINI_API_KEY` | `...` | Cần cho AI Stylist và phân tích ảnh/từ khóa |
| AI Service | `LLM_MODEL` | `gemini-1.5-flash-8b` | Model Gemini mặc định |
| AI Service | `REPLICATE_API_TOKEN` | `...` | Chỉ cần khi dùng VTON cloud engine FLUX.2 |

> Lưu ý: không commit file `.env` thật. Chỉ commit `.env.example` khi cần cập nhật danh sách biến.

### 3. Khởi động hạ tầng (Docker)
Mở terminal tại thư mục `docker/`:
```bash
docker compose up -d
```
*Đợi các container PostgreSQL, Redis, RabbitMQ ở trạng thái "Started".*

### 4. Khởi tạo Database (Chỉ làm lần đầu)
Tại thư mục gốc dự án:
```bash
pnpm -F @fundamental/api-medusa exec medusa db:migrate
```

Nếu cần seed dữ liệu mẫu:
```bash
pnpm -F @fundamental/api-medusa exec medusa db:seed ./src/migration-scripts/initial-data-seed.ts
```

### 5. Khởi động toàn bộ hệ thống

**Terminal 1 (Frontend & MedusaJS):** Tại thư mục gốc:
```bash
pnpm dev
```

**Terminal 2 (AI Service):** Tại thư mục `apps/ai-service`:
```bash
uv run uvicorn main:app --reload
```

---

## 🔗 Các đường link sử dụng hệ thống (Web URLs)

Sau khi khởi động thành công toàn bộ hệ thống, bạn có thể truy cập các địa chỉ sau:

### 💻 Client Frontend (Next.js - Port 3000)
*   **Trang chủ (Landing Page):** [http://localhost:3000](http://localhost:3000)
*   **Trò chuyện & Tư vấn với AI Stylist:** [http://localhost:3000/ai-stylist](http://localhost:3000/ai-stylist)
*   **Phòng thử đồ ảo & Tủ đồ (Wardrobe):** [http://localhost:3000/wardrobe](http://localhost:3000/wardrobe)
*   **Thiết lập Hồ sơ AI (AI Profile):** [http://localhost:3000/ai-profile](http://localhost:3000/ai-profile)
*   **Giao diện Admin up đồ trực quan:** [http://localhost:3000/admin-tools/add-product](http://localhost:3000/admin-tools/add-product)

### ⚙️ Backend & AI Services
*   **MedusaJS Core API Port:** [http://localhost:9000](http://localhost:9000)
*   **FastAPI AI Service Port:** [http://localhost:8000](http://localhost:8000)
*   **Tài liệu API FastAPI (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
*   **RabbitMQ Management UI:** [http://localhost:15672](http://localhost:15672) (`guest` / `guest`)

---

## 🔌 API và Queue Contracts quan trọng

### Medusa API routes

| Route | Method | Vai trò |
| --- | --- | --- |
| `/v1/stylist/search` | `POST` | Nhận prompt từ Web, gọi AI Service, hydrate outfit options |
| `/v1/stylist/replace` | `POST` | Tìm item tương tự để thay thế trong outfit |
| `/v1/stylist/sessions` | `GET` | Lấy lịch sử phiên tư vấn |
| `/v1/vton/jobs` | `POST` | Tạo job thử đồ ảo và đẩy vào RabbitMQ |
| `/v1/stream/vision-results?user_id=...` | `GET` | SSE stream trả tiến trình/kết quả VTON |
| `/v1/ai-profile` | `POST` | Upload ảnh/hồ sơ AI của người dùng |
| `/v1/user/garments` | `GET/POST` | Quản lý tủ đồ cá nhân |
| `/v1/internal/products` | `POST` | Tạo sản phẩm từ giao diện admin tool |

### FastAPI routes

| Route | Method | Vai trò |
| --- | --- | --- |
| `/health` | `GET` | Kiểm tra AI Service còn sống |
| `/ping-db` | `GET` | Kiểm tra LanceDB, yêu cầu `x-internal-token` |
| `/api/v1/stylist/search` | `POST` | Parse intent, search LanceDB, generate outfit options |
| `/api/v1/stylist/replace` | `POST` | Tìm item tương tự bằng vector search |

### RabbitMQ queues

| Queue | Producer | Consumer | Payload chính |
| --- | --- | --- | --- |
| `product_metadata_sync` | Medusa product subscriber | AI Service | Product id, name, description, image, category, gender |
| `closet_metadata_sync` | Medusa wardrobe route | AI Service | Closet item id, user id, image url, category, description |
| `ai_vision_jobs` | Medusa VTON route/orchestrator | AI Service | Job id, user id, person image, garment image(s), VTON params |
| `ai_vision_results` | AI Service | Medusa vision consumer | Job id, user id, status, result image url, error message |

---

## 🛍️ Hướng dẫn Up đồ/Sản phẩm vào Cửa hàng

Dự án cung cấp 2 phương thức để bạn đưa sản phẩm mới vào cửa hàng:

### Cách 1: Qua Giao diện Web trực quan (Khuyến nghị cho 1 vài sản phẩm)
1.  Khởi động toàn bộ hệ thống.
2.  Mở trình duyệt truy cập đường dẫn: [http://localhost:3000/admin-tools/add-product](http://localhost:3000/admin-tools/add-product)
3.  Điền các thông tin sản phẩm: **Tên**, **Giá (VNĐ)**, **Danh mục**, **Mô tả** và tải lên **Hình ảnh sản phẩm**.
4.  Nhấn nút **Tạo Sản phẩm**. 
    > **Cơ chế hoạt động:** Hệ thống tự động đẩy dữ liệu sang MedusaJS Backend (lưu trữ Postgres), đồng thời bắn sự kiện qua RabbitMQ đến AI Service để phân tích ngữ nghĩa, tạo vector nhúng và đồng bộ tự động vào LanceDB.

### Cách 2: Seed hàng loạt dữ liệu mẫu (Khuyến nghị khi khởi tạo ban đầu)
Nếu bạn muốn nạp sẵn hàng loạt sản phẩm mẫu thời trang cùng với cấu hình hoàn chỉnh vào Database:
1.  Mở Terminal tại thư mục gốc dự án.
2.  Chạy lệnh seed sau:
    ```bash
    pnpm -F @fundamental/api-medusa exec medusa db:seed ./src/migration-scripts/initial-data-seed.ts
    ```
3.  Đợi lệnh chạy hoàn tất, toàn bộ danh mục sản phẩm thời trang mẫu sẽ được khởi tạo trong Postgres và tự động đồng bộ sang LanceDB.

---

## 🧪 Kiểm thử luồng giao tiếp (Integration Test)
Để kiểm tra xem MedusaJS có gửi được tin nhắn sang FastAPI thông qua RabbitMQ hay không, hãy mở **Terminal thứ 3** và chạy lệnh cURL sau (trên Windows):

```powershell
curl.exe -X POST http://localhost:9000/custom/internal/test-rmq -H "x-internal-token: your_super_secret_internal_key_here" -H "Content-Type: application/json"
```

**Kết quả mong đợi:**
- Terminal cURL trả về JSON `status: success`.
- Terminal của **AI Service** in ra log: `[RabbitMQ Consumer] Received product metadata sync event...`.

## 🧰 Development Commands

| Lệnh | Chức năng |
| --- | --- |
| `pnpm dev` | Chạy Turbo dev cho frontend và Medusa |
| `pnpm build` | Build toàn bộ workspace |
| `pnpm lint` | Chạy lint qua Turbo |
| `pnpm -F web dev` | Chạy riêng Next.js frontend |
| `pnpm -F @fundamental/api-medusa dev` | Chạy riêng Medusa backend |
| `pnpm -F @fundamental/api-medusa exec medusa db:migrate` | Chạy migration Medusa |
| `uv run uvicorn main:app --reload` | Chạy AI Service tại `apps/ai-service` |

## ⚠️ Known MVP Limitations

- **VTON pipeline local** đang dùng cơ chế tạm: garment URL của job kế tiếp được lưu vào trường `error_message` trong `vton_job`. Về lâu dài nên thêm trường `metadata` JSONB hoặc bảng job payload riêng.
- **SSE manager** đang lưu client trong memory của process Medusa. Nếu scale nhiều instance, cần Redis pub/sub, RabbitMQ fanout hoặc sticky session.
- **User identity** vẫn có fallback `mock-customer-id` / `default_user` ở một số luồng demo. Khi tích hợp auth thật cần truyền customer id nhất quán từ Medusa auth context.
- **LanceDB table** chỉ được tạo khi có event sync đầu tiên. Nếu chưa seed/upload sản phẩm, AI Stylist có thể trả danh sách rỗng.
- **AI/VTON dependencies** rất nặng, đặc biệt PyTorch/Diffusers/CatVTON. Lần khởi động đầu tiên có thể mất nhiều thời gian và cần GPU/VRAM phù hợp.
- **Giá và tồn kho trong vector** hiện có default trong AI Service (`price: 0`, `in_stock: true`) nếu payload chưa truyền đủ dữ liệu.

## 🩺 Troubleshooting

| Triệu chứng | Cách kiểm tra / xử lý |
| --- | --- |
| Web gọi API bị CORS | Kiểm tra `STORE_CORS`, `AUTH_CORS` trong `apps/api-medusa/.env` có `http://localhost:3000` |
| Medusa không kết nối DB | Chạy `docker compose ps` trong thư mục `docker/`, kiểm tra `DATABASE_URL` |
| Queue không nhận message | Mở RabbitMQ UI `http://localhost:15672`, kiểm tra queue và `RABBITMQ_URL` |
| AI Stylist trả rỗng | Seed sản phẩm hoặc upload sản phẩm mới để tạo vector trong LanceDB |
| FastAPI báo thiếu token | Đảm bảo `INTERNAL_API_SECRET` giống nhau ở Medusa và AI Service |
| VTON không trả kết quả | Kiểm tra queue `ai_vision_jobs`, log AI Service, SSE `/v1/stream/vision-results` và user id có khớp không |
| Ảnh upload không load | Kiểm tra file trong `apps/api-medusa/.medusa/uploads` và route `/uploads/...` |
| Tiếng Việt bị lỗi font trong terminal | Dùng `Get-Content -Encoding UTF8 README.md` hoặc terminal UTF-8 |

---
*Dự án đang trong quá trình phát triển Giai đoạn 5.*
