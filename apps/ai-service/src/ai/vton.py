import os
import sys
import torch
import urllib.request
import urllib.parse
from io import BytesIO
import requests
from PIL import Image
from abc import ABC, abstractmethod
import numpy as np

# Add CatVTON repository to sys.path
catvton_path = os.path.join(os.path.dirname(__file__), 'CatVTON')
if catvton_path not in sys.path:
    sys.path.insert(0, catvton_path)

from huggingface_hub import snapshot_download
from diffusers.image_processor import VaeImageProcessor

from model.pipeline import CatVTONPipeline
from model.cloth_masker import AutoMasker, vis_mask
from utils import init_weight_dtype, resize_and_crop, resize_and_padding

class IVirtualTryOnService(ABC):
    @abstractmethod
    def try_on(self, 
               human_image_url: str, 
               garment_image_url: str, 
               output_path: str,
               mask_image_url: str = None,
               cloth_type: str = "upper",
               num_inference_steps: int = 50,
               guidance_scale: float = 2.5,
               seed: int = -1,
               width: int = 768,
               height: int = 1024,
               repaint: bool = False) -> str:
        """
        Thực hiện ghép đồ.
        Trả về đường dẫn/URL file kết quả.
        """
        pass

class LocalCatVTONAdapter(IVirtualTryOnService):
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # Dùng bfloat16 để tiết kiệm VRAM như kiến trúc yêu cầu
        self.dtype = "bf16" if torch.cuda.is_available() else "fp16"
        self.repo_path = None
        
        self.mask_processor = VaeImageProcessor(vae_scale_factor=8, do_normalize=False, do_binarize=True, do_convert_grayscale=True)

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
        return img
        
    def _download_models_if_needed(self):
        if self.repo_path is None:
            print("[CatVTON] Downloading/Verifying models from HuggingFace...")
            # Tải toàn bộ checkpoint của CatVTON (Bao gồm cả SCHP và DensePose)
            self.repo_path = snapshot_download(repo_id="zhengchong/CatVTON")

    def try_on(self, 
               human_image_url: str, 
               garment_image_url: str, 
               output_path: str,
               mask_image_url: str = None,
               cloth_type: str = "upper",
               num_inference_steps: int = 50,
               guidance_scale: float = 2.5,
               seed: int = -1,
               width: int = 768,
               height: int = 1024,
               repaint: bool = False) -> str:
               
        print(f"[CatVTON] Bắt đầu xử lý. Human: {human_image_url}, Garment: {garment_image_url}")
        print(f"[CatVTON] Params: type={cloth_type}, steps={num_inference_steps}, scale={guidance_scale}, seed={seed}, repaint={repaint}")
        
        self._download_models_if_needed()
        
        # 1. Dọn dẹp VRAM trước khi xử lý (Dynamic Loading)
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        pipeline = None
        automasker = None
        
        try:
            # 2. Khởi tạo Pipeline
            print("[CatVTON] Loading Pipeline into VRAM...")
            pipeline = CatVTONPipeline(
                base_ckpt="booksforcharlie/stable-diffusion-inpainting",
                attn_ckpt=self.repo_path,
                attn_ckpt_version="mix",
                weight_dtype=init_weight_dtype(self.dtype),
                use_tf32=True,
                device=self.device,
                skip_safety_check=True
            )
            
            # Tối ưu VRAM (Bắt buộc cho GPU < 12GB)
            # if torch.cuda.is_available():
            #     pipeline.enable_model_cpu_offload() # CatVTONPipeline doesn't support this directly.

            # 3. Tiền xử lý ảnh
            person_image = self._load_image(human_image_url)
            cloth_image = self._load_image(garment_image_url)
            
            person_image = resize_and_crop(person_image, (width, height))
            cloth_image = resize_and_padding(cloth_image, (width, height))
            
            # 4. Xử lý Mask
            mask = None
            if mask_image_url:
                mask_img = self._load_image(mask_image_url).convert("L")
                mask_arr = np.array(mask_img)
                if len(np.unique(mask_arr)) > 1:
                    mask_arr[mask_arr > 0] = 255
                    mask = Image.fromarray(mask_arr)
                    mask = resize_and_crop(mask, (width, height))
            
            if mask is None:
                print(f"[CatVTON] No mask provided. Generating AutoMask for type: {cloth_type}...")
                automasker = AutoMasker(
                    densepose_ckpt=os.path.join(self.repo_path, "DensePose"),
                    schp_ckpt=os.path.join(self.repo_path, "SCHP"),
                    device=self.device, 
                )
                mask = automasker(person_image, cloth_type)['mask']
            
            mask = self.mask_processor.blur(mask, blur_factor=9)
            
            # Khởi tạo seed
            generator = None
            if seed != -1:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            # 5. Inference
            print("[CatVTON] Running Inference...")
            result_image = pipeline(
                image=person_image,
                condition_image=cloth_image,
                mask=mask,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=generator
            )[0]
            
            # 6. Repaint (Hậu xử lý viền/background)
            if repaint:
                from model.cloth_masker import vis_mask
                from utils import repaint_result
                print("[CatVTON] Applying repaint post-processing...")
                # Repaint function uses mask to paste back original pixels outside mask
                result_image = repaint_result(result_image, person_image, mask)

            # 7. Lưu ảnh
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            result_image.save(output_path, "PNG")
            print(f"[CatVTON] Lưu kết quả thành công tại {output_path}")
            
            return output_path
            
        except Exception as e:
            print(f"[CatVTON] Lỗi trong quá trình xử lý: {e}")
            raise e
        finally:
            # 8. Dọn rác VRAM (Dynamic Unloading)
            if pipeline is not None:
                del pipeline
            if automasker is not None:
                del automasker
                
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                import gc
                gc.collect()
                print("[CatVTON] Cleared VRAM.")