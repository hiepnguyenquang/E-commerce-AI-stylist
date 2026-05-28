# Bản Kế hoạch Chi tiết Tích hợp FLUX.2 API & Kiến trúc Multi-Engine

Tài liệu này trình bày chi tiết về giao diện (Interface), quy trình kết nối và các bước thực thi cụ thể để hỗ trợ chạy song song 2 Engine: **CatVTON (Local)** và **Replicate FLUX.2 (Cloud API)**. Đặc biệt, bản kế hoạch đã được tối ưu cho Use Case **UC-VTON-02 (Phối đồ chủ động - Mix & Match)**.

---

## 1. Tối ưu Hóa Luồng Mix & Match (Nhiều món đồ)

Theo tài liệu `10_use_cases.yaml`, tính năng thử cả 1 bộ đồ (Áo + Quần/Váy) đang được định nghĩa là **Multi-step Jobs** khi dùng CatVTON (Ghép áo -> Lấy kết quả ghép tiếp quần). 

Khi tích hợp FLUX.2, chúng xuất sẽ **nén quá trình này thành 1 bước duy nhất (Single-shot)** bằng cách truyền một mảng nhiều ảnh quần áo (Outfit) vào API của FLUX, giúp giảm độ trễ và tiết kiệm chi phí.

---

## 2. Thiết kế Giao diện (Interfaces)

Cập nhật lại Interface `IVirtualTryOnService` trong `apps/ai-service/src/ai/vton.py` để hỗ trợ truyền một danh sách (list) các ảnh quần áo thay vì chỉ 1 ảnh.

### Lớp Interface (Cập nhật):
```python
class IVirtualTryOnService(ABC):
    @abstractmethod
    async def try_on(self, 
               human_image_url: str, 
               garment_image_urls: list[str], # Sửa thành mảng để hỗ trợ Outfit
               output_path: str,
               # ... các tham số khác
               ) -> str:
        pass
```

### Lớp Adapter cho FLUX.2 (`flux_vton.py`):
```python
import os
import replicate
import requests
import asyncio
from .vton import IVirtualTryOnService

class CloudFluxVTONAdapter(IVirtualTryOnService):
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            raise ValueError("Thiếu REPLICATE_API_TOKEN trong .env")

    async def try_on(self, human_image_url, garment_image_urls, output_path, **kwargs) -> str:
        print(f"[FLUX.2] Đang xử lý {len(garment_image_urls)} món đồ cùng lúc...")
        
        # 1. Gộp toàn bộ ảnh tham chiếu vào 1 mảng
        # human_image_url LUÔN LÀ ảnh đầu tiên (index 0) để làm nền (aspect_ratio = match_input_image)
        input_images = [human_image_url] + garment_image_urls
        
        # 2. Xây dựng tham số đầu vào
        prompt = "A highly photorealistic image of the person wearing BOTH the top garment and the bottom garment provided as reference. Maintain the person's face, body shape, and pose. The garments should fit naturally with realistic lighting and wrinkles."
        
        input_data = {
            "prompt": prompt,
            "input_images": input_images, # Mảng tối đa 8 ảnh
            "output_format": "png",
            "aspect_ratio": "match_input_image",
            "safety_tolerance": 2
        }

        # 3. Gọi API bất đồng bộ (Polling ngầm qua asyncio) thay vì gọi đồng bộ
        output_url = await replicate.async_run(
            "black-forest-labs/flux-2-pro",
            input=input_data
        )

        # 4. Tải ảnh kết quả về local
        print(f"[FLUX.2] Tải ảnh kết quả từ {output_url}")
        response = requests.get(output_url) # Có thể đổi sang aiohttp cho fully async nếu cần
        response.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(response.content)

        return output_path
```

---

## 3. Đánh giá Phương án Kết nối API: Async Polling vs Webhook

Trong quá trình gọi API Replicate để sinh ảnh, có 2 phương pháp phổ biến. Bản thiết kế này đã quyết định chọn **Async Polling (`await replicate.async_run()`)** thay vì Webhook. Dưới đây là bảng phân tích để làm rõ quyết định kiến trúc này:

### Phương pháp 1: Dùng Webhook (Replicate chủ động gọi lại hệ thống)
- **Cơ chế:** Gọi API tạo Job và truyền kèm tham số `webhook="https://my-domain.com/api/webhook"`. Hệ thống đóng kết nối. Khi Replicate xử lý xong (từ 10-30s sau), nó sẽ gọi POST về endpoint webhook đó.
- **Ưu điểm:**
  - Giải phóng hoàn toàn Worker (Luồng xử lý) của hệ thống trong thời gian chờ AI sinh ảnh. Tối ưu cực tốt cho môi trường Production có lưu lượng hàng nghìn truy cập/giây.
- **Nhược điểm:**
  - **Bảo mật:** Bắt buộc phải thiết lập thêm middleware giải mã và xác thực chữ ký (HMAC) của Replicate để tránh bị tấn công từ chối dịch vụ (DDoS) hoặc giả mạo kết quả.
  - **Môi trường Phát triển (Dev):** Máy tính Dev Local (`localhost`) không có IP Public. Phải dùng các công cụ như `ngrok` hoặc `localtunnel` mới nhận được webhook, gây phức tạp quá trình setup cho lập trình viên.

### Phương pháp 2: Dùng Async Polling (Phương án Chọn trong Code)
- **Cơ chế:** Sử dụng hàm `await replicate.async_run()`. SDK của Replicate sẽ tự động gửi HTTP request liên tục (mỗi vài giây) để hỏi trạng thái. Nhờ vào tính năng `async/await` của Python, trong lúc đợi, luồng (Thread) sẽ được nhường lại cho Event Loop để hệ thống làm việc khác.
- **Ưu điểm:**
  - **Đơn giản hóa hạ tầng:** Không cần cấu hình public domain, không cần `ngrok` khi code local. Tương thích ngay lập tức với mọi môi trường.
  - **Bảo mật:** Không mở thêm bất kỳ API Endpoint nào ra Internet, đóng chặt cửa với các nguy cơ tấn công Webhook.
  - **Hiệu suất vẫn đảm bảo:** Vì Python Worker hỗ trợ `asyncio` (FastAPI), việc chờ đợi I/O (await) tốn cực kì ít tài nguyên RAM/CPU, và không làm "block" toàn bộ server.
- **Nhược điểm:**
  - Tốn một chút xíu băng thông nội bộ để hỏi trạng thái liên tục so với Webhook, nhưng hoàn toàn không đáng kể.

**Kết luận:** 
Hệ thống AI Fashion E-commerce của chúng ta đang sử dụng kiến trúc hàng đợi RabbitMQ đứng trước Python Worker. Việc "chờ 20 giây" của hàm `await` đã được cô lập hoàn toàn ở tầng Worker độc lập, Medusa Core và Frontend không hề bị đình trệ. Do đó, việc đánh đổi sự phức tạp của Webhook để lấy sự đơn giản, bảo mật của **Async Polling** là quyết định kiến trúc phù hợp và tối ưu nhất cho thiết kế hiện tại.

---

## 4. Quy trình Kết nối (Connection Execution Flow)

### Bước 1: Frontend truyền yêu cầu (Next.js)
Frontend cho phép chọn nhiều trang phục để tạo thành Outfit.
```typescript
// POST /api/v1/vton/try-on
{
  "garment_ids": ["item_top_123", "item_bottom_456"],
  "person_image": "/uploads/user/person.png",
  "engine": "cloud" // Nếu user chọn 'local', Medusa sẽ tách thành Multi-step
}
```

### Bước 2: MedusaJS xử lý và đẩy vào RabbitMQ
Payload `ai_vision_jobs` được cập nhật để chứa mảng URL trang phục.
```json
{
  "job_id": "job_999",
  "human_image_url": "http://localhost:9000/uploads/user/person.png",
  "garment_image_urls": [
      "http://localhost:9000/uploads/garments/shirt.png",
      "http://localhost:9000/uploads/garments/pants.png"
  ],
  "output_path": "D:/programing/project/fundamental project/apps/api-medusa/.medusa/uploads/results/job_999.png",
  "engine": "cloud"
}
```

### Bước 3: Python Worker (AI Service) điều phối (Factory Pattern)
```python
engine_pref = payload.get("engine", os.getenv("VTON_ENGINE", "local"))

if engine_pref == "cloud":
    generator = CloudFluxVTONAdapter()
    notify_medusa_sse(job_id, status="rendering")
    # Sử dụng await thay cho gọi đồng bộ
    final_path = await generator.try_on(...)
else:
    generator = LocalCatVTONAdapter()
    # ... logic multi-step await
```

### Bước 4: MedusaJS phát SSE về Frontend
Sau khi có ảnh, Python Worker báo kết quả qua webhook `/api/v1/internal/vision-callback` nội bộ. Frontend nhận ảnh hoàn chỉnh của nguyên bộ đồ.

---

## 5. Kế hoạch Triển khai Code (Phases)

**Phase 1: Cập nhật Shared Types & Medusa API**
- Thay đổi thuộc tính `garment_image_url` (string) thành `garment_image_urls` (string array) trong `VTONJobEvent`.
- Cập nhật endpoint Medusa để truyền mảng sản phẩm.

**Phase 2: Triển khai Lớp Adapter tại AI Service**
- Cập nhật hàm `try_on` của `IVirtualTryOnService` thành `async def try_on`.
- Cài đặt `replicate`, tạo `flux_vton.py` và viết `CloudFluxVTONAdapter` dùng `async_run`.

**Phase 3: Tinh chỉnh Frontend UI (Đã hoàn thành)**
- Cập nhật UI nút "Thử cả bộ" (Mix & Match) trong trang Wardrobe.
- Bổ sung bộ chọn Engine (Cơ bản / Cao cấp) vào Card Sản phẩm (`ProductActionButtons`) trong Cửa hàng.
- Bổ sung bộ chọn Engine (Local / FLUX.2) vào `OutfitCard` trong luồng AI Stylist.
- Đảm bảo thanh Progress bar tương thích với cả 2 luồng.
