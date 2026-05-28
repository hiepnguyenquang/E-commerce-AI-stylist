import os
import replicate
import requests
from .vton import IVirtualTryOnService

class CloudFluxVTONAdapter(IVirtualTryOnService):
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            print("[FLUX.2] Cảnh báo: Thiếu REPLICATE_API_TOKEN trong .env.")

    def try_on(self, 
               human_image_url: str, 
               output_path: str,
               garment_image_url: str = None,
               garment_image_urls: list[str] = None, 
               **kwargs) -> str:
        
        garments = garment_image_urls or []
        if garment_image_url and garment_image_url not in garments:
            garments.append(garment_image_url)

        if not garments:
            raise ValueError("Cần cung cấp ít nhất 1 ảnh quần áo cho FLUX.")

        print(f"[FLUX.2] Đang xử lý {len(garments)} món đồ cùng lúc...")
        
        input_images = [human_image_url] + garments
        
        prompt = "A highly photorealistic image of the person wearing BOTH the top garment and the bottom garment provided as reference. Maintain the person's face, body shape, and pose. The garments should fit naturally with realistic lighting and wrinkles."
        if len(garments) == 1:
            prompt = "A highly photorealistic image of the person wearing the exact provided garment as reference. Maintain the person's face, body shape, and pose. The garment should fit naturally with realistic lighting and wrinkles."
            
        input_data = {
            "prompt": prompt,
            "input_images": input_images,
            "output_format": "png",
            "aspect_ratio": "match_input_image",
            "safety_tolerance": 2
        }

        # Hàm run() của replicate là đồng bộ (blocking), hoàn toàn an toàn khi gọi trong worker thread của Pika.
        output = replicate.run(
            "black-forest-labs/flux-2-pro",
            input=input_data
        )

        # FLUX.2 Pro trả về 1 mảng output (có thể chứa nhiều file tùy config, ta lấy ảnh đầu tiên)
        if isinstance(output, list) and len(output) > 0:
            output_url_str = str(output[0])
        else:
            output_url_str = str(output)

        print(f"[FLUX.2] Tải ảnh kết quả từ {output_url_str}")
        
        response = requests.get(output_url_str)
        response.raise_for_status()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(response.content)

        return output_path
