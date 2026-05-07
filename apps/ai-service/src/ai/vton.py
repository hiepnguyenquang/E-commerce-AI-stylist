import os
import torch
import urllib.request
import urllib.parse
from io import BytesIO
import requests
from PIL import Image
from abc import ABC, abstractmethod

class IVirtualTryOnService(ABC):
    @abstractmethod
    def try_on(self, human_image_url: str, garment_image_url: str, output_path: str) -> str:
        """
        Thực hiện ghép đồ.
        Trả về đường dẫn/URL file kết quả.
        """
        pass

class LocalCatVTONAdapter(IVirtualTryOnService):
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    def _load_image(self, url: str) -> Image.Image:
        if url.startswith('http'):
            response = requests.get(url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content)).convert("RGB")
        elif url.startswith('file://'):
            path = urllib.request.url2pathname(url)
            img = Image.open(path).convert("RGB")
        else:
            img = Image.open(url).convert("RGB")
            
        # Resize về chuẩn 768x1024 cho CatVTON (tỷ lệ 3:4)
        return img.resize((768, 1024))

    def try_on(self, human_image_url: str, garment_image_url: str, output_path: str) -> str:
        print(f"[CatVTON] Bắt đầu xử lý. Human: {human_image_url}, Garment: {garment_image_url}")
        
        # 1. Dọn dẹp VRAM trước khi xử lý (Dynamic Loading)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        try:
            # --- KIẾN TRÚC LOAD MODEL THỰC TẾ ---
            # Lưu ý: CatVTON chưa tích hợp sẵn trong thư viện Diffusers mặc định,
            # Thường yêu cầu clone repo riêng hoặc sử dụng pipeline tùy chỉnh.
            # Dưới đây là cấu trúc khung chuẩn:
            # 
            # from diffusers import DiffusionPipeline
            # pipeline = DiffusionPipeline.from_pretrained(
            #     "zhengchong/CatVTON", 
            #     torch_dtype=self.dtype,
            #     trust_remote_code=True
            # ).to(self.device)
            # 
            # if torch.cuda.is_available():
            #     pipeline.enable_xformers_memory_efficient_attention()
            #     pipeline.enable_model_cpu_offload() # Tối ưu OOM
            
            # 3. Tiền xử lý ảnh
            human_img = self._load_image(human_image_url)
            garment_img = self._load_image(garment_image_url)
            
            # 4. Inference
            # result_img = pipeline(
            #     image=human_img,
            #     condition_image=garment_img,
            #     num_inference_steps=25,
            #     guidance_scale=7.5
            # ).images[0]
            
            # --- MOCK LOGIC ---
            # Để phục vụ tiến độ MVP, ta giả lập kết quả trả về
            # bằng cách blend hai ảnh với nhau (cần thay thế khi kết nối model thật)
            import time
            time.sleep(3) # Giả lập thời gian render
            result_img = Image.blend(human_img, garment_img, alpha=0.5)

            # 5. Lưu ảnh
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            result_img.save(output_path, "PNG")
            
            return output_path
            
        except Exception as e:
            print(f"[CatVTON] Lỗi trong quá trình xử lý: {e}")
            raise e
        finally:
            # 6. Dọn rác VRAM sau khi hoàn tất
            # del pipeline
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
