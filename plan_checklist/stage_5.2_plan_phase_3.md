# Giai đoạn 3 (Phase 3): Tích hợp Giao diện (Frontend)

**Mục tiêu:** Giao diện người dùng tương tác với AI Stylist.

> **Lưu ý cải tiến sau MVP (Intent Guardrail):**
> Cần bổ sung thêm một lớp AI lọc câu hỏi (Intent Guardrail) ở đầu luồng. Nếu câu hỏi của người dùng không liên quan đến phối đồ hoặc thời trang, hệ thống sẽ không thực hiện tìm kiếm mà khéo léo từ chối và điều hướng người dùng về việc phối đồ. Tính năng này sẽ giúp tiết kiệm chi phí API và bảo vệ hệ thống khỏi những prompt không mong muốn, sẽ được bổ sung sau khi hoàn thành bản MVP.

## BÁO CÁO ĐỐI CHIẾU KIẾN TRÚC & CÁC ĐIỂM THIẾU HỤT

1. **Điểm Tuân thủ Tuyệt đối (Compliant):**
   - App Router & Ranh giới Server/Client: Trang `/ai-stylist` sẽ là Server Component để tối ưu SEO và tốc độ tải trang gốc. Tuy nhiên, các khung chat (`ChatBox.tsx`) và card sản phẩm (`OutfitCard.tsx`) yêu cầu tương tác sẽ được áp dụng nguyên tắc "Lá rụng", tách riêng thành Client Components với khai báo `"use client"`.
   - Quản lý Trạng thái: Sẽ tạo mới một Zustand Store (`store/useStylistStore.ts`) theo đúng hướng dẫn chia theo Domain (nghiệp vụ).

2. **Báo cáo Các điểm Thiếu hụt (Missing/Incomplete in Design):**
   - ⚠️ **Thiếu API Lấy chi tiết Sản phẩm (Missing API for Product Details):**
     - Vấn đề: Hợp đồng API-02 chỉ trả về mảng ID sản phẩm. Frontend cần chi tiết để hiển thị hình ảnh, tên và giá.
     - Đề xuất MVP: Frontend sẽ tạm dùng API mặc định của Medusa (`Store API`) để fetch hình ảnh dựa trên ID. Sẽ refactor (Cách 1: Hydrate ở backend) vào lúc tối ưu.
   - ⚠️ **Luồng "Thay đổi món đồ" (Replace Item - API-03) chưa rõ ràng:**
     - Vấn đề: Kế hoạch Phân đoạn 5.2 hiện tại mới chỉ làm tới API-02.
     - Quyết định MVP: Tạm thời chưa code nút "Thay đổi món đồ" trên giao diện, ưu tiên làm mượt mà luồng Chat -> Nhận Option trước.

---

## KẾ HOẠCH TRIỂN KHAI CHI TIẾT (PHASE 3)

- [x] **3.1 Quản lý Trạng thái (Zustand Store)**
  - [x] Tạo file: `apps/web/src/store/useStylistStore.ts`.
  - [x] Định nghĩa interface `Message`: `{ id: string, role: 'user' | 'assistant', content: string, options?: OutfitOption[] }`.
  - [x] Tạo các actions: `addMessage`, `setTyping(boolean)`, `clearChat`.

- [x] **3.2 Xây dựng Giao diện (UI Components)**
  *Tất cả các components dưới đây thuộc thư mục `apps/web/src/components/features/ai-stylist/` và bắt buộc có `"use client"`.*
  - [x] **ChatBox.tsx**:
    - [x] Hiển thị danh sách tin nhắn (Map từ useStylistStore).
    - [x] Hiển thị hiệu ứng loading (Typing indicator) khi isTyping = true.
    - [x] Khung nhập liệu dưới cùng. Khi nhấn Enter -> Lưu tin nhắn User -> Bật isTyping -> Gọi API.
  - [x] **OutfitCard.tsx**:
    - [x] Hiển thị tiêu đề (Title) và lời khuyên (Reasoning).
    - [x] Bên trong chứa một Grid nhỏ để render các ảnh/tên sản phẩm tương ứng với ID nhận được.

- [x] **3.3 Tích hợp Gọi API (Integration)**
  - [x] Viết hàm `fetchOutfitSuggestions` (sử dụng fetch chuẩn của Next.js).
  - [x] Gọi endpoint: `POST http://localhost:9000/api/v1/stylist/search`.
  - [x] Xử lý Global Error Format (Hiện Toast/Alert lỗi thân thiện nếu Backend trả về lỗi).

- [x] **3.4 Khởi tạo Trang (Page Routing)**
  - [x] Tạo file: `apps/web/src/app/ai-stylist/page.tsx` (Server Component).
  - [x] Bọc Layout chuẩn của dự án và Import component ChatBox.tsx vào hiển thị ở trung tâm trang.