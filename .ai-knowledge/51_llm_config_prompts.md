# Cấu hình LLM & Prompt Engineering

Tài liệu này quy định chiến lược sử dụng Mô hình Ngôn ngữ Lớn (LLM) và các bộ Prompts chuẩn hóa phục vụ cho tính năng "AI Stylist" (Tư vấn phối đồ) và tự động hóa dữ liệu sản phẩm.

## 1. Chiến lược Lựa chọn LLM (LLM Strategy)

Vì hệ thống vận hành trên phần cứng giới hạn (**1 GPU RTX 5060 8GB VRAM**), toàn bộ VRAM vật lý đã được ưu tiên cấp phát cho các tác vụ nặng như sinh ảnh (CatVTON) và nhúng vector (CLIP).

- **Quyết định (MVP):** Tuyệt đối KHÔNG chạy Local LLM (như Llama-3-8B hoặc Mistral) trên máy chủ để tránh rủi ro Out-of-Memory (OOM).
- **Giải pháp:** Sử dụng **Cloud LLM API** (Khuyến nghị: `OpenAI gpt-4o-mini` hoặc `Gemini 1.5 Flash`).
- **Lợi ích:** Tiêu tốn 0GB VRAM nội bộ, chi phí API cực thấp, tốc độ phản hồi tính bằng mili-giây và khả năng tuân thủ định dạng JSON (JSON mode) xuất sắc.

---

## 2. Hệ thống System Prompts Cốt lõi

Để đảm bảo LLM hoạt động chính xác như một API (nhận Input, trả Output định dạng tĩnh), tất cả các Prompts đều phải ép buộc LLM trả về cấu trúc JSON nghiêm ngặt.

### Prompt A: Trích xuất Dữ liệu (Metadata Extractor)
- **Luồng sử dụng:** `QUEUE-02` (Đồng bộ dữ liệu sản phẩm mới từ Medusa sang LanceDB).
- **Mục đích:** Tự động đọc tên/mô tả của một sản phẩm mới do Admin nhập và gắn thẻ (Tagging) các thuộc tính thời trang chuyên sâu.
- **Nội dung Prompt:**
```text
Bạn là một chuyên gia phân loại dữ liệu thời trang. Hãy đọc thông tin sản phẩm dưới đây và trích xuất các thuộc tính thành định dạng JSON.
Bắt buộc CHỈ trả về một chuỗi JSON hợp lệ, không giải thích gì thêm, không bọc trong markdown block.

Thông tin sản phẩm:
- Tên: {product_name}
- Mô tả: {product_description}
- Danh mục gốc: {base_category}

Cấu trúc JSON yêu cầu:
{
  "category": "String (Ví dụ: dresses, tops, pants, shoes, accessories)",
  "color": "String (Màu sắc chủ đạo, tiếng Anh)",
  "style": ["Array of Strings" (Ví dụ: vintage, streetwear, office, minimalist, y2k)],
  "occasion": ["Array of Strings" (Ví dụ: party, casual, work, sport, formal)],
  "material": "String (Ví dụ: denim, silk, cotton, leather)"
}
```

### Prompt B: Phân tích Truy vấn Khách hàng (Query Parser)
- **Luồng sử dụng:** Bước 1 của `API-02` (Truy vấn phối đồ).
- **Mục đích:** Dịch câu nói tự nhiên của khách hàng thành các điều kiện lọc (Filters) cứng và từ khóa tìm kiếm mềm để truy vấn vào LanceDB.
- **Nội dung Prompt:**
```text
Bạn là hệ thống phân tích ngôn ngữ tự nhiên. Khách hàng vừa nhập yêu cầu tìm kiếm thời trang: "{user_query}".
Hãy trích xuất yêu cầu này thành các bộ lọc JSON để hệ thống Database thực hiện tìm kiếm.
Nếu thông tin nào không được nhắc đến, hãy để null. Bắt buộc CHỈ trả về JSON.

Cấu trúc JSON yêu cầu:
{
  "target_category": "String | null (Loại trang phục khách đang tìm)",
  "target_occasion": "String | null (Hoàn cảnh sử dụng)",
  "target_style": "String | null (Phong cách hướng tới)",
  "price_preference": "String | null (cheap, premium, luxury)",
  "search_keywords": "String (Từ khóa cô đọng nhất dùng để tìm kiếm Vector, đã loại bỏ các từ nhiễu)"
}
```

### Prompt C: Gợi ý Phối đồ (Outfit Suggestion - AI Stylist)
- **Luồng sử dụng:** Bước cuối của `API-02` (Truy vấn phối đồ).
- **Mục đích:** Từ tập sản phẩm (Pool) đã được LanceDB lọc ra, LLM sẽ đóng vai Stylist để "nhặt" các món đồ ghép thành những Set đồ (Options) hoàn chỉnh, kèm theo lời giải thích thuyết phục.
- **Tính năng cốt lõi:** Chống "Hallucination" tuyệt đối. LLM chỉ được phép lấy ID sản phẩm từ danh sách cung cấp sẵn, không được bịa ra sản phẩm không có thực.
- **Nội dung Prompt:**
```text
Bạn là một Stylist thời trang cao cấp. Dưới đây là yêu cầu phối đồ của khách hàng:
Yêu cầu: "{user_query}"
Số lượng Set đồ (Options) cần tạo: {limit_options}

Dưới đây là danh sách các sản phẩm ĐANG CÓ SẴN trong kho (bạn CHỈ được phép chọn từ danh sách này):
{available_products_json} 
// Định dạng mảng: [{"id": "p_1", "name": "...", "category": "...", "style": [...]}, ...]

Nhiệm vụ: 
Hãy chọn ra các món đồ phù hợp nhất từ danh sách trên để kết hợp thành {limit_options} Options hoàn chỉnh.
1. Mỗi Option phải có 1 tiêu đề (title) hấp dẫn.
2. Có lời giải thích (reasoning) thuyết phục khách hàng tại sao Set đồ này hợp với họ.
3. Bắt buộc trả về định dạng JSON chuẩn xác theo cấu trúc sau, không kèm văn bản thừa:

{
  "options": [
    {
      "option_id": "opt_1",
      "title": "Tên chủ đề Set đồ",
      "reasoning": "Lời khuyên của Stylist (Khoảng 2-3 câu)...",
      "items": ["p_1", "p_3", "p_10"] // Mảng chứa ID của các sản phẩm được chọn
    }
  ]
}
```

---

## 3. Tổng kết Luồng RAG (Retrieval-Augmented Generation)

Luồng tư vấn phối đồ (API-02) hoạt động theo cơ chế RAG 3 bước chặt chẽ:
1. **Extract (Dùng Prompt B):** LLM phân tích câu chat của User ra JSON Filters.
2. **Retrieve (Dùng LanceDB):** FastAPI dùng JSON Filters đó để Query LanceDB bằng phương pháp Hybrid Search (Lọc cứng Metadata + Lọc mềm Vector). Kết quả trả về một tập rổ (Pool) chứa ~20 sản phẩm có độ chính xác cao nhất (Có sẵn hàng, đúng giá, đúng style).
3. **Generate (Dùng Prompt C):** FastAPI nhồi Pool 20 sản phẩm đó vào LLM để nó tư duy, đóng gói thành 2-3 Set đồ hoàn chỉnh trả về cho Frontend (Kèm lời khuyên). 
