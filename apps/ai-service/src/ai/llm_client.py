import json
import os
from abc import ABC, abstractmethod
from google import genai
from google.genai import types

# --- 1. Interface Chuẩn (Hợp đồng giao tiếp) ---
class IIntentAnalyzer(ABC):
    @abstractmethod
    def parse_query(self, user_query: str) -> dict:
        pass

    @abstractmethod
    def generate_outfit_options(self, user_query: str, limit_options: int, available_products: list) -> dict:
        pass

    @abstractmethod
    def extract_metadata(self, product_name: str, product_description: str, base_category: str) -> dict:
        pass

    @abstractmethod
    def analyze_closet_image(self, image_bytes: bytes) -> dict:
        pass

# --- 2. Adapter cho Google Gemini ---
class GeminiAnalyzerAdapter(IIntentAnalyzer):
    def __init__(self):
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("LLM_MODEL", "gemini-1.5-flash-8b")
        self.client = genai.Client(api_key=gemini_api_key)

    def parse_query(self, user_query: str) -> dict:
        prompt = f"""Bạn là hệ thống phân tích ngôn ngữ tự nhiên. Khách hàng vừa nhập yêu cầu: "{user_query}".
Nhiệm vụ 1: Kiểm tra xem yêu cầu này có liên quan đến thời trang, quần áo, mua sắm hoặc tư vấn phối đồ hay không.
Nếu KHÔNG liên quan (ví dụ: hỏi thời tiết, toán học, lập trình, câu hỏi chung chung...), hãy trả về JSON:
{{
  "is_fashion_related": false,
  "refusal_message": "Câu trả lời từ chối khéo léo, ví dụ: 'Tôi là AI Stylist, tôi chỉ có thể giúp bạn tư vấn và phối đồ thời trang. Bạn muốn tìm trang phục nào hôm nay?'"
}}

Nếu CÓ liên quan, hãy trích xuất yêu cầu thành các bộ lọc JSON để hệ thống Database thực hiện tìm kiếm.
Nếu thông tin nào không được nhắc đến, hãy để null. Bắt buộc CHỈ trả về JSON hợp lệ.

Cấu trúc JSON yêu cầu (khi CÓ liên quan):
{{
  "is_fashion_related": true,
  "target_category": "String | null (Loại trang phục khách đang tìm, có thể là dresses, tops, pants, shoes, accessories)",
  "target_occasion": "String | null (Hoàn cảnh sử dụng, ví dụ: beach, party, casual, work, sport, formal)",
  "target_style": "String | null (Phong cách hướng tới, ví dụ: vintage, streetwear, office, minimalist, y2k)",
  "price_preference": "String | null (cheap, premium, luxury)",
  "search_keywords": "String (Từ khóa cô đọng nhất dùng để tìm kiếm Vector, đã loại bỏ các từ nhiễu)"
}}"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(
                    system_instruction="You are a JSON-only response assistant.",
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[GeminiAnalyzerAdapter] Query parse error: {e}")
            return {
                "is_fashion_related": True,
                "target_category": None,
                "target_occasion": None,
                "target_style": None,
                "price_preference": None,
                "search_keywords": user_query
            }

    def generate_outfit_options(self, user_query: str, limit_options: int, available_products: list) -> dict:
        simplified_products = [
            {
                "id": p["product_id"],
                "name": p["name"],
                "category": p["category"],
                "style": p.get("style", []),
                "price": p.get("price", 0.0),
                "source": p.get("source", "store")
            } for p in available_products
        ]
        
        prompt = f"""Bạn là một Stylist thời trang cao cấp. Dưới đây là yêu cầu phối đồ của khách hàng:
Yêu cầu: "{user_query}"
Số lượng Set đồ (Options) cần tạo: {limit_options}

Dưới đây là danh sách các sản phẩm ĐANG CÓ SẴN trong kho và TỦ ĐỒ CÁ NHÂN của khách hàng (bạn CHỈ được phép chọn từ danh sách này):
{json.dumps(simplified_products, ensure_ascii=False)}

Nhiệm vụ: 
Hãy chọn ra các món đồ phù hợp nhất từ danh sách trên để kết hợp thành {limit_options} Options hoàn chỉnh.
Ràng buộc QUAN TRỌNG: 
- Mỗi Option PHẢI là một BỘ ĐỒ HOÀN CHỈNH. Tức là nó phải bao gồm ít nhất một Áo (tops) và một Quần/Váy (bottoms), HOẶC một chiếc Váy liền (dresses). Không bao giờ được gợi ý chỉ một chiếc áo hoặc chỉ một chiếc quần. Bạn có thể thêm giày (shoes) hoặc phụ kiện (accessories) nếu có trong danh sách.
- Hãy ƯU TIÊN sử dụng các sản phẩm từ tủ đồ cá nhân (có "source": "closet") để phối cùng các món đồ mới từ cửa hàng (có "source": "store"), nhằm tạo sự kết nối với trang phục sẵn có của khách.
- CÁC OPTION PHẢI KHÁC BIỆT NHAU: Tuyệt đối không được tạo ra 2 Option giống hệt nhau. Mỗi Option nên mang một phong cách (style) khác nhau hoặc sử dụng các món đồ chính (áo/quần/váy) khác nhau.

1. Mỗi Option phải có 1 tiêu đề (title) hấp dẫn.
2. Có lời giải thích (reasoning) thuyết phục khách hàng tại sao Set đồ này hợp với họ và giải thích sự kết hợp giữa các món đồ.
3. Bắt buộc trả về định dạng JSON chuẩn xác theo cấu trúc sau, không kèm văn bản thừa:

{{
  "options": [
    {{
      "option_id": "opt_1",
      "title": "Tên chủ đề Set đồ",
      "reasoning": "Lời khuyên của Stylist (Khoảng 2-3 câu)...",
      "items": ["id_1", "id_3"] 
    }}
  ]
}}"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(
                    system_instruction="You are a highly skilled Fashion Stylist and JSON-only response assistant.",
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[GeminiAnalyzerAdapter] Outfit generator error: {e}")
            return {"options": []}

    def extract_metadata(self, product_name: str, product_description: str, base_category: str) -> dict:
        prompt = f"""Bạn là một chuyên gia phân loại dữ liệu thời trang. Hãy đọc thông tin sản phẩm dưới đây và trích xuất các thuộc tính thành định dạng JSON.
Bắt buộc CHỈ trả về một chuỗi JSON hợp lệ, không giải thích gì thêm, không bọc trong markdown block.

Thông tin sản phẩm:
- Tên: {product_name}
- Mô tả: {product_description}
- Danh mục gốc: {base_category}

Cấu trúc JSON yêu cầu:
{{
  "category": "String (Ví dụ: dresses, tops, pants, shoes, accessories. Trả về đúng danh mục gần nhất với {base_category})",
  "color": "String (Màu sắc chủ đạo, tiếng Anh)",
  "style": ["Array of Strings" (Ví dụ: vintage, streetwear, office, minimalist, y2k)],
  "occasion": ["Array of Strings" (Ví dụ: party, casual, work, sport, formal)],
  "material": "String (Ví dụ: denim, silk, cotton, leather)"
}}"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[types.Content(role="user", parts=[types.Part.from_text(text=prompt)])],
                config=types.GenerateContentConfig(
                    system_instruction="You are a JSON-only response assistant.",
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[GeminiAnalyzerAdapter] Extract metadata error: {e}")
            return {
                "category": base_category,
                "color": "unknown",
                "style": [],
                "occasion": [],
                "material": "unknown"
            }

    def analyze_closet_image(self, image_bytes: bytes) -> dict:
        prompt = """Bạn là chuyên gia phân loại thời trang. Dựa vào hình ảnh trang phục, hãy trích xuất các thông tin sau và trả về định dạng JSON:
{
  "category": "String (tops, bottoms, dresses, outerwear, shoes, accessories)",
  "color": "String (Màu sắc chủ đạo)",
  "style": ["Array of Strings" (vintage, streetwear, office, casual, etc.)],
  "pattern": "String (solid, striped, floral, graphic, etc.)",
  "material": "String (denim, cotton, leather, unknown)"
}"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=[
                    types.Content(
                        role="user", 
                        parts=[
                            types.Part.from_text(text=prompt),
                            types.Part.from_bytes(data=image_bytes, mime_type="image/png")
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction="You are a JSON-only response assistant.",
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[GeminiAnalyzerAdapter] Analyze closet image error: {e}")
            return {
                "category": "unknown",
                "color": "unknown",
                "style": [],
                "pattern": "unknown",
                "material": "unknown"
            }

# Để tương thích ngược (hoặc Dependency Injection), tạo Factory hoặc Export mặc định
import threading

_intent_analyzer_instance = None
_intent_analyzer_lock = threading.Lock()

def get_intent_analyzer() -> IIntentAnalyzer:
    global _intent_analyzer_instance
    if _intent_analyzer_instance is None:
        with _intent_analyzer_lock:
            if _intent_analyzer_instance is None:
                _intent_analyzer_instance = GeminiAnalyzerAdapter()
    return _intent_analyzer_instance
