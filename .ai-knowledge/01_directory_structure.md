# Cấu trúc Thư mục Hệ thống (Monorepo)

Dự án áp dụng kiến trúc Monorepo để dễ dàng chia sẻ Types và Schemas giữa Frontend, Backend và AI Service, sử dụng **Turborepo** và **pnpm workspaces**.

## Kiến trúc Tổng thể
```text
fundamental-project/
├── .ai-knowledge/        # (Knowledge Base) Tài liệu thiết kế, quy chuẩn, log lỗi
├── apps/                 # Chứa các ứng dụng độc lập có thể triển khai
│   ├── web/              # (Frontend) Next.js 14, React 18, Zustand, Tailwind
│   ├── api-medusa/       # (Backend Core) MedusaJS 2.0 (Node.js/TypeScript)
│   └── ai-service/       # (AI Backend) FastAPI, Python (Stable Diffusion, LanceDB)
├── packages/             # Các thư viện dùng chung trong Monorepo
│   ├── shared-types/     # TypeScript definitions (Zod schemas) dùng chung
│   ├── ui-components/    # Shared React components
│   └── eslint-config/    # Cấu hình Linter chuẩn của dự án
├── docker/               # Cấu hình containerization (Postgres, RabbitMQ, Redis)
├── package.json          # Root package.json quản lý workspace
└── turbo.json            # Cấu hình Turborepo pipelines
```

## Nguyên tắc tổ chức mã nguồn (Quy ước)
1. **Tuyệt đối không lặp lại code giao tiếp:** Mọi cấu trúc API payload, Event Queue (RabbitMQ) phải được định nghĩa tại `packages/shared-types/` và tái sử dụng cho cả `web` và `api-medusa`.
2. **AI Service Độc lập:** Ứng dụng `ai-service` viết bằng Python phải có môi trường ảo ảo (venv) riêng hoặc quản lý qua Poetry/Conda, không nhầm lẫn thư viện với Node.js.
3. **Mô hình Dependency:**
   - `apps/web` phụ thuộc `packages/shared-types` và `packages/ui-components`.
   - `apps/api-medusa` phụ thuộc `packages/shared-types`.
