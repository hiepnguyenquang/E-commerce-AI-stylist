from abc import ABC, abstractmethod
from sentence_transformers import SentenceTransformer
from PIL import Image
import torch
import os

# --- 1. Interface Chuẩn (Hợp đồng giao tiếp) ---
class IEmbeddingService(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Chuyển đổi văn bản thành vector."""
        pass

    @abstractmethod
    def embed_image(self, image_path_or_obj) -> list[float]:
        """Chuyển đổi hình ảnh thành vector."""
        pass

# --- 2. Adapter cho Local CLIP Model ---
class LocalCLIPEmbeddingAdapter(IEmbeddingService):
    def __init__(self, model_name: str = "sentence-transformers/clip-ViT-B-32-multilingual-v1"):
        """
        Khởi tạo model Embedding (CLIP đa ngôn ngữ).
        Phù hợp với đặc tả trong .ai-knowledge/50_ai_model_specs.md.
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[LocalCLIPEmbeddingAdapter] Loading model '{model_name}' on {self.device}...")
        self.model = SentenceTransformer(model_name, device=self.device)
        print("[LocalCLIPEmbeddingAdapter] Model loaded successfully.")
        
    def embed_text(self, text: str) -> list[float]:
        embedding = self.model.encode(text, convert_to_tensor=True)
        return embedding.cpu().tolist()

    def embed_image(self, image_path_or_obj) -> list[float]:
        if isinstance(image_path_or_obj, str):
            if not os.path.exists(image_path_or_obj):
                raise FileNotFoundError(f"Image not found: {image_path_or_obj}")
            image = Image.open(image_path_or_obj)
        else:
            image = image_path_or_obj
            
        embedding = self.model.encode(image, convert_to_tensor=True)
        return embedding.cpu().tolist()

# Factory
def get_embedding_service() -> IEmbeddingService:
    return LocalCLIPEmbeddingAdapter()
