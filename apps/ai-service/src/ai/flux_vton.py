import os
import replicate
import requests
import base64
import urllib.request
from .vton import IVirtualTryOnService

class CloudFluxVTONAdapter(IVirtualTryOnService):
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            print("[FLUX.2] Cảnh báo: Thiếu REPLICATE_API_TOKEN trong .env.")

    def _url_to_data_uri(self, url: str) -> str:
        # Xử lý relative path hoặc localhost vì Cloud API không thể tải trực tiếp
        if url.startswith('/'):
            host_ip = "127.0.0.1"
            medusa_url = os.getenv("MEDUSA_BACKEND_URL", f"http://{host_ip}:9000")
            url = f"{medusa_url}{url}"
            
        if url.startswith('http'):
            response = requests.get(url)
            response.raise_for_status()
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            encoded = base64.b64encode(response.content).decode('utf-8')
            return f"data:{content_type};base64,{encoded}"
        else:
            if url.startswith('file://'):
                path = urllib.request.url2pathname(url)
            else:
                path = url
            
            with open(path, "rb") as image_file:
                encoded = base64.b64encode(image_file.read()).decode('utf-8')
                ext = path.split('.')[-1].lower()
                content_type = f"image/{ext}" if ext in ['png', 'jpeg', 'webp'] else "image/jpeg"
                return f"data:{content_type};base64,{encoded}"

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

        print(f"[FLUX.2] Đang tải {len(garments) + 1} ảnh và mã hóa Base64...")
        
        raw_images = [human_image_url] + garments
        input_images = []
        for img_url in raw_images:
            input_images.append(self._url_to_data_uri(img_url))
        
        
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
