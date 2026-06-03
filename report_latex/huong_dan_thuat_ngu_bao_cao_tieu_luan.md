# HƯỚNG DẪN NGÔN NGỮ VÀ THUẬT NGỮ CHO BÁO CÁO BÀI TẬP LỚN

Tài liệu này quy định cách dùng ngôn ngữ và thuật ngữ cho báo cáo bài tập lớn của dự án **AI Fashion E-commerce**: hệ thống thương mại điện tử thời trang tích hợp **AI Stylist**, **Virtual Try-On**, **RAG**, **LanceDB**, **RabbitMQ** và **SSE**.

Mục tiêu của hướng dẫn là giúp báo cáo có văn phong học thuật bằng tiếng Việt, nhưng vẫn giữ đúng bản chất kỹ thuật của hệ thống. Không nên dịch máy móc toàn bộ thuật ngữ tiếng Anh; đồng thời cũng không nên lạm dụng tiếng Anh khi đã có cách diễn đạt tiếng Việt rõ ràng.

---

## 1. Nguyên tắc xử lý thuật ngữ Anh - Việt

### Quy tắc 1: Dịch nghĩa kèm thuật ngữ tiếng Anh ở lần xuất hiện đầu tiên

Với các khái niệm cốt lõi của đề tài, lần đầu xuất hiện nên viết tiếng Việt trước, sau đó đặt thuật ngữ tiếng Anh trong ngoặc đơn. Các lần sau có thể dùng dạng ngắn hơn nếu ngữ cảnh đã rõ.

Ví dụ:

> “Hệ thống sử dụng truy hồi tăng cường sinh (Retrieval-Augmented Generation - RAG) để kết hợp tìm kiếm vector với mô hình ngôn ngữ lớn.”

> “Tính năng thử đồ ảo (Virtual Try-On - VTON) được xử lý bất đồng bộ thông qua RabbitMQ.”

Một số thuật ngữ nên áp dụng quy tắc này:

| Thuật ngữ tiếng Anh | Cách viết khuyến nghị ở lần đầu | Cách viết các lần sau |
|---|---|---|
| AI Stylist | trợ lý phối đồ AI (AI Stylist) | AI Stylist |
| Virtual Try-On | thử đồ ảo (Virtual Try-On - VTON) | VTON hoặc thử đồ ảo |
| Retrieval-Augmented Generation | truy hồi tăng cường sinh (Retrieval-Augmented Generation - RAG) | RAG |
| Vector Search | tìm kiếm vector (Vector Search) | tìm kiếm vector |
| Embedding | vector nhúng (Embedding) | embedding hoặc vector nhúng |
| Server-Sent Events | sự kiện máy chủ gửi tới client (Server-Sent Events - SSE) | SSE |
| Message Queue | hàng đợi thông điệp (Message Queue) | queue hoặc hàng đợi |
| Microservices | kiến trúc vi dịch vụ (Microservices) | microservices hoặc vi dịch vụ |
| Headless E-commerce | thương mại điện tử headless (Headless E-commerce) | headless e-commerce |

---

### Quy tắc 2: Giữ nguyên tên công nghệ, framework, thư viện và model

Tên riêng của framework, thư viện, dịch vụ, mô hình AI và database phải giữ nguyên. Không dịch các tên này sang tiếng Việt.

Nên giữ nguyên:

- Next.js
- React
- Zustand
- Tailwind CSS
- MedusaJS
- FastAPI
- PostgreSQL
- Redis
- RabbitMQ
- LanceDB
- PyArrow
- Gemini
- CatVTON
- FLUX.2
- Replicate
- CLIP
- Sentence Transformers
- Turborepo
- pnpm
- Docker

Ví dụ phù hợp:

> “Frontend được triển khai bằng Next.js 14, React 18 và Zustand.”

> “AI service sử dụng FastAPI, LanceDB và RabbitMQ consumer để xử lý các tác vụ AI.”

Không nên viết:

> “Cơ sở dữ liệu giáo Lance” hoặc “Khung Nhanh API”.

---

### Quy tắc 3: Việt hóa các động từ và cụm từ đã có cách diễn đạt chuẩn

Trong báo cáo học thuật, nên tránh viết nửa Anh nửa Việt ở các động từ phổ thông. Các thuật ngữ kỹ thuật có thể giữ nguyên, nhưng hành động nên viết bằng tiếng Việt.

| Không nên viết | Nên viết |
|---|---|
| code chức năng | triển khai chức năng / viết mã nguồn |
| run service | khởi chạy service / chạy service |
| test hệ thống | kiểm thử hệ thống |
| call API | gọi API |
| upload ảnh | tải ảnh lên |
| save dữ liệu | lưu dữ liệu |
| sync sản phẩm | đồng bộ sản phẩm |
| parse query | phân tích truy vấn |
| generate outfit | sinh gợi ý phối đồ / sinh outfit |
| render UI | hiển thị giao diện |
| handle error | xử lý lỗi |
| mock payment | thanh toán mô phỏng / mock payment |

Lưu ý: Với các cụm đã quen trong kỹ thuật như “API”, “service”, “queue”, “workflow”, “pipeline”, có thể giữ nguyên nếu giúp câu văn rõ hơn. Tuy nhiên, không nên dùng quá dày đặc trong cùng một đoạn.

---

### Quy tắc 4: Không dịch sai bản chất các khái niệm kỹ thuật

Một số thuật ngữ trong dự án có nghĩa kỹ thuật cụ thể, cần dùng nhất quán:

| Thuật ngữ | Cách hiểu đúng trong báo cáo |
|---|---|
| AI service | Dịch vụ FastAPI xử lý AI, không phải toàn bộ backend |
| Backend core | MedusaJS backend quản lý nghiệp vụ e-commerce và orchestration |
| BFF | Backend trung gian phục vụ frontend; trong dự án này Medusa đảm nhận vai trò này cho các luồng AI |
| Vector database | Cơ sở dữ liệu vector LanceDB, không phải PostgreSQL |
| Source of truth | Dữ liệu gốc nằm ở Medusa/PostgreSQL; LanceDB là kho đọc phục vụ AI |
| Hydrate dữ liệu | Bổ sung dữ liệu sản phẩm thật từ Medusa vào kết quả AI trước khi trả frontend |
| Guardrail | Cơ chế giới hạn phạm vi trả lời của AI, ví dụ từ chối câu hỏi ngoài miền thời trang |
| Static local URL | URL file tĩnh local, không phải CDN/S3 production |
| Mock payment | Thanh toán mô phỏng, chưa phải cổng thanh toán thật |

---

## 2. Phong cách hành văn

Báo cáo cần sử dụng văn phong khách quan, chính xác và nhất quán. Nội dung nên mô tả rõ hệ thống đã triển khai, phạm vi MVP và các giới hạn hiện tại.

### 2.1. Dùng ngôi kể khách quan

Trong các chương chính, hạn chế dùng “tôi”, “chúng em”, “nhóm mình”. Nên dùng các cụm khách quan hơn.

Nên dùng:

- “Đề tài”
- “Hệ thống”
- “Báo cáo”
- “Nhóm thực hiện”
- “Pipeline được triển khai”
- “Backend xử lý”
- “AI service đảm nhận”

Ví dụ không phù hợp:

> “Chúng em dùng RabbitMQ vì nó xử lý job tốt.”

Ví dụ phù hợp:

> “RabbitMQ được sử dụng để tách các tác vụ sinh ảnh khỏi request web, giúp backend không bị chặn trong thời gian AI service xử lý VTON.”

Riêng các phần “Lời cam đoan” và “Lời cảm ơn” có thể dùng “nhóm em” nếu phù hợp quy định của trường.

---

### 2.2. Tránh ngôn ngữ quảng cáo hoặc cảm tính

Không nên mô tả hệ thống bằng các từ quá cảm tính nếu không có số liệu chứng minh.

| Tránh dùng | Nên thay bằng |
|---|---|
| cực kỳ nhanh | phản hồi nhanh hơn do tác vụ AI được xử lý bất đồng bộ |
| rất thông minh | có khả năng phân tích yêu cầu ngôn ngữ tự nhiên |
| chất lượng tuyệt vời | tạo được ảnh kết quả ở mức thử nghiệm/MVP |
| hoàn hảo | phù hợp với phạm vi thử nghiệm hiện tại |
| production-ready | chưa dùng nếu chưa có auth, monitoring, object storage, payment thật |

Nếu chưa có số liệu benchmark, chỉ nên viết:

> “Phần đánh giá định lượng cần được bổ sung sau khi đo latency và ghi nhận log thực nghiệm.”

Không nên viết:

> “Hệ thống có hiệu năng cao và hoạt động ổn định trong mọi trường hợp.”

---

### 2.3. Trung thực về trạng thái MVP

Báo cáo phải phân biệt rõ phần đã triển khai, phần đang mô phỏng và phần định hướng tương lai.

Các cách viết khuyến nghị:

- “đã triển khai ở mức MVP”
- “đã có pipeline chính”
- “đang sử dụng thanh toán mô phỏng”
- “kết quả VTON hiện được lưu dưới dạng file tĩnh local”
- “chưa tích hợp object storage/CDN”
- “chưa có benchmark hiệu năng chính thức”
- “cần bổ sung retry policy và dead-letter queue khi production hóa”

Các cách viết cần tránh:

- “đã hoàn thiện hệ thống production”
- “đã tích hợp thanh toán thật”
- “ảnh được lưu trên CDN”
- “AI luôn đưa ra gợi ý chính xác”
- “hệ thống realtime hoàn toàn không có độ trễ”

---

## 3. Quy ước thuật ngữ cho dự án AI Fashion E-commerce

### 3.1. Thuật ngữ về kiến trúc và hạ tầng

| Thuật ngữ gốc | Thuật ngữ khuyến nghị | Ghi chú |
|---|---|---|
| Monorepo | monorepo | Có thể giải thích là repository chứa nhiều ứng dụng/package |
| Workspace | workspace | Giữ nguyên khi nói về pnpm workspace |
| Microservices | kiến trúc vi dịch vụ (Microservices) | Dùng tiếng Việt ở lần đầu |
| Frontend | frontend / tầng giao diện | Có thể dùng “frontend” trong phần kỹ thuật |
| Backend | backend / tầng backend | Không dịch thành “hậu trường” |
| AI Service | AI service / dịch vụ AI | Chỉ service FastAPI |
| Backend Core | backend core / backend lõi | Chỉ MedusaJS |
| Message Broker | message broker / bộ trung gian thông điệp | RabbitMQ là message broker |
| Queue | hàng đợi / queue | Dùng “queue” khi nêu tên queue cụ thể |
| Consumer | consumer / tiến trình tiêu thụ message | Có thể giữ nguyên |
| Producer | producer / tiến trình phát message | Có thể giữ nguyên |
| Server-Sent Events | Server-Sent Events (SSE) | Lần đầu có giải thích tiếng Việt |
| Static File | file tĩnh | Dùng khi nói về ảnh upload/output local |

### 3.2. Thuật ngữ về e-commerce và MedusaJS

| Thuật ngữ gốc | Thuật ngữ khuyến nghị | Ghi chú |
|---|---|---|
| Storefront | storefront / giao diện cửa hàng | Dùng “storefront” nếu nói về web commerce |
| Product Grid | lưới sản phẩm / ProductGrid | Tên component giữ nguyên nếu nhắc code |
| Product Variant | biến thể sản phẩm (variant) | Ví dụ size/màu |
| Cart | giỏ hàng |  |
| Checkout | checkout / thanh toán | Vì hiện là MVP, nên viết “checkout MVP” |
| Workflow | workflow / luồng công việc | Medusa Workflow có thể giữ nguyên |
| Saga Workflow | Saga workflow | Giải thích là workflow nhiều bước có rollback |
| Mock Payment | thanh toán mô phỏng (mock payment) | Không viết là thanh toán thật |
| Inventory | tồn kho / inventory | Dùng “tồn kho” trong văn xuôi |
| Admin Tool | công cụ quản trị |  |

### 3.3. Thuật ngữ về AI Stylist và RAG

| Thuật ngữ gốc | Thuật ngữ khuyến nghị | Ghi chú |
|---|---|---|
| AI Stylist | AI Stylist / trợ lý phối đồ AI | Dùng nhất quán |
| User Query | truy vấn người dùng |  |
| Intent Parsing | phân tích ý định |  |
| Guardrail | guardrail / cơ chế giới hạn phạm vi | Dùng khi nói về từ chối câu hỏi ngoài miền |
| RAG | RAG | Lần đầu giải thích đầy đủ |
| Retrieval | truy hồi |  |
| Generation | sinh nội dung / sinh gợi ý |  |
| Vector Search | tìm kiếm vector |  |
| Similarity Search | tìm kiếm tương đồng |  |
| Metadata Filter | bộ lọc metadata |  |
| Embedding | embedding / vector nhúng | Dùng một trong hai cách, tránh đổi liên tục |
| Outfit Option | phương án phối đồ / outfit option | Có thể giữ “outfit option” trong phần UI/API |
| Reasoning | lời giải thích phối đồ / reasoning | Không nên dịch là “suy luận” nếu đang nói text hiển thị cho người dùng |
| Hydration | hydrate dữ liệu | Giải thích là bổ sung dữ liệu thật trước khi trả frontend |

### 3.4. Thuật ngữ về Virtual Try-On

| Thuật ngữ gốc | Thuật ngữ khuyến nghị | Ghi chú |
|---|---|---|
| Virtual Try-On | thử đồ ảo (VTON) | Lần đầu viết đầy đủ |
| VTON Job | tác vụ VTON / VTON job |  |
| Human Image | ảnh người dùng / ảnh cơ thể |  |
| Garment Image | ảnh trang phục |  |
| Mask | mask / mặt nạ vùng xử lý | Có thể giữ “mask” trong kỹ thuật |
| Inference | suy luận / inference | Dùng “inference” khi nói về model |
| Local Engine | engine local | CatVTON local |
| Cloud Engine | engine cloud | FLUX.2 qua Replicate |
| Before/After | ảnh trước/sau | Dùng trong phần minh chứng thực nghiệm |
| Multi-step VTON | VTON nhiều bước / multi-step VTON | Dùng cho thử áo + quần tuần tự |

### 3.5. Thuật ngữ về dữ liệu

| Thuật ngữ gốc | Thuật ngữ khuyến nghị | Ghi chú |
|---|---|---|
| Relational Database | cơ sở dữ liệu quan hệ | PostgreSQL |
| Vector Database | cơ sở dữ liệu vector | LanceDB |
| Schema | schema / lược đồ dữ liệu |  |
| Migration | migration / tập lệnh di trú cơ sở dữ liệu | Có thể giữ “migration” |
| Model | model dữ liệu / model | Phân biệt với model AI |
| Soft Delete | xóa mềm |  |
| JSON Payload | payload JSON |  |
| API Contract | hợp đồng API |  |
| Zod Schema | Zod schema | Giữ nguyên tên thư viện |
| Pydantic Model | Pydantic model | Giữ nguyên tên thư viện |

---

## 4. Quy tắc gọi tên đúng theo code hiện tại

Báo cáo phải ưu tiên cách gọi khớp với mã nguồn hiện tại, không lấy nguyên các tài liệu thiết kế cũ nếu đã lệch code.

### 4.1. LLM và AI provider

Trong code hiện tại:

- AI Stylist dùng `GeminiAnalyzerAdapter`.
- Model mặc định lấy từ biến môi trường `LLM_MODEL`, fallback là `gemini-1.5-flash-8b`.
- Không mô tả Kimi hoặc GPT là provider chính nếu chưa có adapter đang dùng trong code.

Cách viết đúng:

> “AI service sử dụng Gemini để phân tích ý định và sinh outfit options.”

Cách viết cần tránh:

> “Hệ thống sử dụng Kimi-k2.5 làm LLM chính.”

---

### 4.2. Virtual Try-On provider

Trong code hiện tại:

- Local engine: `LocalCatVTONAdapter`.
- Cloud engine: `CloudFluxVTONAdapter` gọi Replicate model `black-forest-labs/flux-2-pro`.
- Không gọi FLUX.2 là pipeline local.
- Không viết Fal.ai là provider hiện tại nếu code đang dùng Replicate.

Cách viết đúng:

> “VTON hỗ trợ CatVTON local và FLUX.2 cloud thông qua Replicate.”

---

### 4.3. Checkout và lưu trữ ảnh

Trong code hiện tại:

- Checkout là Saga workflow mô phỏng.
- Payment là mock, có thể cố ý thất bại bằng `payment_method = fail`.
- Ảnh upload lưu trong `.medusa/uploads`.
- Ảnh kết quả VTON được trả qua static URL từ FastAPI.

Cách viết đúng:

> “Checkout được triển khai ở mức MVP với mock payment.”

> “Kết quả VTON hiện được lưu local và trả về dưới dạng static URL.”

Cách viết cần tránh:

> “Hệ thống đã tích hợp cổng thanh toán thật.”

> “Kết quả VTON được lưu trên CDN/S3.”

---

### 4.4. Function Calling và JSON-driven UI

Frontend hiện ánh xạ JSON response của AI thành các hành động UI như thêm vào giỏ, đổi món và thử đồ. Không gọi cơ chế này là Function Calling nếu không dùng function calling API thật.

Cách viết đúng:

> “Kết quả AI được chuẩn hóa dưới dạng JSON để frontend ánh xạ thành các hành động giao diện.”

Cách viết cần tránh:

> “Hệ thống sử dụng Function Calling để điều khiển frontend.”

---

## 5. Quy ước trình bày trong LaTeX

### 5.1. Cách viết tên file, route, queue và biến môi trường

Trong báo cáo LaTeX, các tên file, thư mục, endpoint, queue, biến môi trường và tên class nên đặt trong `\code{...}` hoặc `\texttt{...}`.

Ví dụ:

- `\code{apps/web}`
- `\code{/v1/stylist/search}`
- `\code{ai_vision_jobs}`
- `\code{GEMINI_API_KEY}`
- `\code{LocalCatVTONAdapter}`

Lưu ý: ký tự gạch dưới `_` trong LaTeX dễ gây lỗi nếu viết thô. Nên dùng macro `\code{...}` đã được định nghĩa trong `main.tex`.

---

### 5.2. Cách trình bày bảng thuật ngữ và bảng đánh giá

Bảng trong báo cáo nên dùng để tóm tắt, không thay thế hoàn toàn phần phân tích. Sau mỗi bảng quan trọng nên có đoạn văn giải thích ý nghĩa.

Bảng nên dùng các cột:

- “Thành phần”
- “Công nghệ”
- “Vai trò”
- “Trạng thái”
- “Ghi chú”

Khi bảng chứa nhiều endpoint hoặc schema dài, ưu tiên dùng `longtable` hoặc rút gọn nội dung để tránh tràn trang.

---

### 5.3. Cách dùng hình ảnh và placeholder

Khi chưa có ảnh thực nghiệm, có thể để placeholder với mô tả rõ ràng:

> “Ảnh chụp cần bổ sung: giao diện AI Stylist hiển thị OutfitCard và nút thử đồ.”

Không nên mô tả như đã có kết quả nếu chưa chụp hoặc chưa chạy thực nghiệm.

---

## 6. Checklist rà thuật ngữ trước khi nộp báo cáo

Trước khi nộp bản cuối, cần rà các điểm sau:

- [ ] Tên đề tài thống nhất là “Xây dựng hệ thống thương mại điện tử thời trang tích hợp AI Stylist và Virtual Try-On”.
- [ ] Lần đầu xuất hiện đã giải thích RAG, VTON, SSE, Message Queue, Vector Search.
- [ ] Không còn thuật ngữ lệch dự án cũ như LightGBM, Faiss, NDCG, Recall/Ranking hai giai đoạn nếu không liên quan trực tiếp.
- [ ] Không mô tả Kimi, GPT hoặc Fal.ai là thành phần chính khi code hiện dùng Gemini và Replicate.
- [ ] Không gọi JSON-driven UI là Function Calling.
- [ ] Không viết checkout là thanh toán thật.
- [ ] Không viết ảnh VTON được lưu trên CDN/S3.
- [ ] Các endpoint, queue, class và biến môi trường có dấu `_` được đặt trong `\code{...}` khi đưa vào LaTeX.
- [ ] Các phần chưa có số liệu đo được viết là kế hoạch hoặc phần cần bổ sung, không kết luận định lượng.
- [ ] Văn phong khách quan, hạn chế từ cảm tính và quảng cáo.

