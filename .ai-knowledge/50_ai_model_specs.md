# Đặc tả Mô hình AI (AI Model Specifications)

Tài liệu này quy định chi tiết các Mô hình Trí tuệ Nhân tạo (AI Models) được sử dụng trong dự án, bao gồm cấu hình phần cứng, định dạng đầu vào/đầu ra, và các kỹ thuật tối ưu hóa bắt buộc để hệ thống có thể vận hành ổn định trên phần cứng mục tiêu là **Nvidia RTX 5060 (8GB VRAM)**.

## 1. Mô hình Virtual Try-On (VTON)

Chịu trách nhiệm ghép trang phục (Garment) lên người mẫu (Human).

- **Mô hình cốt lõi:** `CatVTON` (Concatenation Is All You Need for Virtual Try-On).
- **Lý do lựa chọn:** Kiến trúc tinh gọn (chỉ 49.57M tham số cần huấn luyện), loại bỏ các bộ mã hóa phức tạp (Pose/Image Encoders), giúp giảm hơn 49% lượng VRAM tiêu thụ so với các phương pháp dựa trên ReferenceNet. Hoạt động mượt mà dưới mức 8GB VRAM.

### Cấu hình Kỹ thuật (Inference Config):
- **Độ phân giải chuẩn (Resolution):** `1024x768` (Tỷ lệ 3:4). *Lưu ý: Đầu vào từ Frontend (Next.js) phải được crop/resize chính xác kích thước này bằng Canvas trước khi gọi API.*
- **Kiểu dữ liệu (Precision):** Bắt buộc sử dụng `bfloat16` (bf16) để giảm một nửa dung lượng VRAM so với fp32 mà không làm suy giảm chất lượng ảnh đáng kể.
- **Tham số Inference mẫu:**
  - `num_inference_steps`: 20 - 30 (Mặc định: 25).
  - `guidance_scale`: 7.5.

### Yêu cầu Tối ưu Phần cứng (FastAPI):
- Bắt buộc cài đặt thư viện `xformers` (hoặc Flash Attention 2) để tối ưu hóa bộ nhớ khi tính toán Attention.
- Sử dụng tính năng `enable_model_cpu_offload()` của thư viện HuggingFace `diffusers` nếu cần chạy đồng thời nhiều tác vụ nặng, đảm bảo không xảy ra lỗi Out-of-Memory (OOM).

## 2. Mô hình Nhúng Dữ liệu (Vector Embedding)

Chịu trách nhiệm chuyển đổi văn bản (Text) và hình ảnh (Image) thành các vector số học (Embeddings) để lưu trữ và truy vấn trong LanceDB (Phục vụ tính năng Semantic Search).

- **Mô hình cốt lõi:** `sentence-transformers/clip-ViT-B-32-multilingual-v1`
- **Lý do lựa chọn:** Phiên bản đa ngôn ngữ (Multilingual) hỗ trợ tiếng Việt xuất sắc. Khách hàng có thể tìm kiếm bằng ngôn ngữ tự nhiên (VD: "Váy hoa nhí đi biển mùa hè") mà không cần công cụ dịch thuật trung gian. Dung lượng cực nhẹ (~1GB VRAM).

### Cấu hình Kỹ thuật (Embedding Config):
- **Kích thước Vector (Dimensions):** `512` chiều (Trùng khớp 100% với schema đã khai báo trong LanceDB).
- **Metric Tính khoảng cách:** `Cosine Similarity`.
- **Thiết lập:** Load model vào GPU (`device='cuda'`) nhưng vì dung lượng nhỏ nên có thể giữ thường trực trên VRAM (nếu còn trống) để tăng tốc độ phản hồi API tìm kiếm.

## 3. Quản lý Vòng đời GPU (GPU Memory Lifecycle)

Với giới hạn 8GB VRAM, hệ thống (FastAPI Worker) phải áp dụng cơ chế quản lý bộ nhớ nghiêm ngặt:
1. **Không Load đồng thời:** Tuyệt đối không load toàn bộ model CatVTON và CLIP (cùng các LLM khác nếu có) vào VRAM cùng một lúc lúc khởi động server.
2. **Dynamic Loading (Tải động):**
   - Khi có Job VTON tới: Xóa model CLIP (nếu đang có), gọi `torch.cuda.empty_cache()`, load CatVTON, chạy inference, xóa CatVTON, dọn rác.
   - Khi có Job Search tới: Load model CLIP (rất nhanh), thực hiện nhúng (embedding), trả kết quả.
3. **Queue Constraints:** Thống nhất với Node.js (BFF) thông qua RabbitMQ: Worker AI chỉ được phép xử lý **1 job tại 1 thời điểm** (`prefetch_count=1`). Không chạy song song (Concurrency) trên cùng 1 GPU vật lý 8GB.
