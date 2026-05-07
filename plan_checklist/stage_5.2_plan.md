# Kế hoạch Triển khai: Phân đoạn 5.2 - AI Stylist (Trí tuệ Phối đồ)

## 1. Bối cảnh & Mục tiêu (Background & Motivation)
Xây dựng tính năng AI Stylist cho phép người dùng trò chuyện bằng ngôn ngữ tự nhiên để nhận gợi ý phối đồ từ kho hàng thực tế. Hệ thống áp dụng kiến trúc **RAG (Retrieval-Augmented Generation)** kết hợp với Vector Database (LanceDB) để chống "Hallucination" (ảo giác) - đảm bảo AI chỉ gợi ý các sản phẩm có thật, đang còn hàng.

## 2. Phạm vi & Tác động (Scope & Impact)
- **Backend/AI (`apps/ai-service`):** Khởi tạo LanceDB, viết kịch bản đồng bộ Vector, và xây dựng RAG Pipeline (API-02).
- **Backend/Core (`apps/api-medusa`):** Đóng vai trò Proxy chuyển tiếp request từ Frontend sang AI Service và lưu lịch sử (Session).
- **Frontend (`apps/web`):** Xây dựng giao diện Chat và hiển thị kết quả (Outfit Cards).

> **LƯU Ý QUAN TRỌNG TỪ HỆ THỐNG:**
> Trong quá trình triển khai ban đầu, tôi đã vô tình bỏ quên quy định cốt lõi về **Dependency Inversion Principle (DIP)** được nêu trong file `.ai-knowledge/03_software_architecture_interfaces.md`. Cụ thể, mọi tương tác với AI Models (cả LLM và Embedding) bắt buộc phải thông qua Interface và Adapter, thay vì gọi trực tiếp class chức năng. 
> Lỗi này đã được người dùng nhắc nhở và tôi đã **bổ sung/refactor thành công** cho cả LLM Client (Gemini API) và Embedding Model (Local CLIP).

## 3. Các giai đoạn triển khai (Phases)
- [x] [Giai đoạn 1: Thiết lập LanceDB & Script Đồng bộ Vector (AI Service)](./stage_5.2_plan_phase_1.md)
- [x] [Giai đoạn 2: Phát triển RAG API & Medusa Proxy](./stage_5.2_plan_phase_2.md)
- [x] [Giai đoạn 3: Tích hợp Giao diện (Frontend)](./stage_5.2_plan_phase_3.md)

## 4. Kiểm thử (Verification & Testing)
- [x] Kiểm tra Script đồng bộ LanceDB.
- [x] Dùng Postman test trực tiếp API của AI Service (`apps/ai-service`) kiểm tra tốc độ trả về và định dạng JSON.
- [x] Dùng Postman test API Proxy của MedusaJS để kiểm tra tính toàn vẹn của request và thao tác lưu database.
- [x] Chat thử trên Frontend: Xác nhận quá trình loading không làm đơ ứng dụng và kết quả render chính xác.