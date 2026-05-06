  ## BÁO CÁO ĐỐI CHIẾU KIẾN TRÚC & CÁC ĐIỂM THIẾU HỤT

  1. Điểm Tuân thủ Tuyệt đối (Compliant):
   * App Router & Ranh giới Server/Client: Trang /ai-stylist sẽ là Server Component để tối ưu SEO và tốc độ tải trang gốc. Tuy nhiên,
     các khung chat (ChatBox.tsx) và card sản phẩm (OutfitCard.tsx) yêu cầu tương tác (nhập chữ, click) sẽ được áp dụng nguyên tắc
     "Lá rụng", tách riêng thành Client Components với khai báo "use client".
   * Quản lý Trạng thái: Sẽ tạo mới một Zustand Store (store/useStylistStore.ts) theo đúng hướng dẫn chia theo Domain (nghiệp vụ).

  2. Báo cáo Các điểm Thiếu hụt (Missing/Incomplete in Design):
   * ⚠️ Thiếu API Lấy chi tiết Sản phẩm (Missing API for Product Details):
       * Vấn đề: Theo hợp đồng API-02 (trong file 11_api_contracts.yaml), Backend hiện tại chỉ trả về mảng items dưới dạng danh sách
         ID sản phẩm (VD: ["ff34a2d7...", "3ed87c39..."]). Để UI có thể hiển thị hình ảnh, tên và giá sản phẩm trong Set đồ, Frontend
         cần chi tiết của những ID này.
       * Giải pháp bổ sung vào Phase 3: Chúng ta sẽ cần gọi thêm API mặc định của MedusaJS (Store API: /store/products?id=...) ngay   
       * Vậy Kiến trúc lý tưởng cho tương lai là gì?
        Trong tương lai (Hoặc nếu bạn muốn làm chuẩn ngay từ bây giờ), chúng ta sẽ phải chọn 1 trong 2 cách sau để sửa đổi ở tầng Backend
        (MedusaJS - ứng dụng đóng vai trò BFF):

        Cách 1: Hydrate (Bơm nước) dữ liệu ngay trong API-02
        Thực hiện "gắn" luôn chi tiết sản phẩm vào phản hồi của POST /api/v1/stylist/search.
        * Luồng chạy: 
            1. Medusa nhận request từ Web -> Gọi sang AI (FastAPI).
            2. AI trả về cho Medusa mảng ID ["prod_1", "prod_2"].
            3. Thay vì trả thẳng cho Web, Medusa dùng Query Database nội bộ của nó truy vấn nhanh bảng PostgreSQL lấy ra Tên, Hình, Giá
                của 2 cái ID đó.
            4. Medusa gộp Tên/Hình/Giá đè lên cái mảng ID ban đầu.
            5. Medusa trả cho Frontend một cục JSON chứa ĐẦY ĐỦ mọi thứ. Web chỉ việc nhận 1 lần và render luôn.
        * Ưu điểm: UX mượt nhất, đúng chuẩn mô hình BFF.

        Cách 2: Viết một Custom API chuyên dụng (API-04: Mini-catalog)
        Như trong file 11_api_contracts.yaml bạn đã thiết kế, thực ra chúng ta đã dự trù một API mang tên:
        API-04: Lấy danh mục phụ trợ (Mini-catalog) -> GET /api/v1/products/{product_id}/mini-catalog
        Chúng ta có thể mở rộng API này để nó nhận một List ID (?ids=p1,p2) thay vì 1 ID.
        * Luồng chạy: Nó sẽ chỉ Select đúng bảng Hình ảnh, Tên và Giá. Bỏ qua toàn bộ các logic giỏ hàng/Variants phức tạp của Medusa mặc
            định.
        * Ưu điểm: Tối ưu hóa băng thông (chỉ trả về vài bytes JSON), tái sử dụng được cho nhiều chỗ khác trên Frontend.
        
        Đề xuất cho Phase 3 hiện tại:
        Bởi vì mục tiêu của chúng ta ở Phân đoạn 5.2 là "Strict MVP" (Tuân thủ tuyệt đối chuẩn chạy được nhanh nhất), tôi đề xuất:

        > Ở Phase 3 này, Frontend sẽ tạm dùng API mặc định của Medusa (Store API: @medusajs/medusa-js client) để fetch hình ảnh dựa trên
        ID. 
        > Chúng ta chấp nhận điểm nghẽn UX nhỏ này ở bản MVP để hoàn thành nhanh tiến độ. Khi sang giai đoạn "Tối ưu hóa & Đánh bóng
        (Polishing)", tôi sẽ thực hiện Cách 1 (Hydrate ngay trong API-02 ở Medusa) để giải quyết triệt để bài toán này.

         trên Frontend (hoặc viết thêm một hàm tổng hợp tại Backend) để "hydrate" danh sách ID này thành dữ liệu hiển thị.
   * ⚠️ Luồng "Thay đổi món đồ" (Replace Item - API-03) chưa rõ ràng:
       * Vấn đề: Kế hoạch Phân đoạn 5.2 hiện tại mới chỉ làm tới API-02. Logic tìm sản phẩm thay thế (API-03) yêu cầu query loại trừ
         (Context exclusion) trên LanceDB chưa được xây dựng ở Backend.
       * Quyết định MVP: Tạm thời chưa code nút "Thay đổi món đồ" trên giao diện, ưu tiên làm mượt mà luồng Chat -> Nhận Option
         trước.

  ---

  KẾ HOẠCH TRIỂN KHAI CHI TIẾT (PHASE 3)

  1. Quản lý Trạng thái (Zustand Store)
   * Tạo file: apps/web/src/store/useStylistStore.ts.
   * Định nghĩa interface Message: { id: string, role: 'user' | 'assistant', content: string, options?: OutfitOption[] }.
   * Tạo các actions: addMessage, setTyping(boolean), clearChat.

  2. Xây dựng Giao diện (UI Components)
  Tất cả các components dưới đây thuộc thư mục apps/web/src/components/features/ai-stylist/ và bắt buộc có "use client".
   * ChatBox.tsx:
       * Hiển thị danh sách tin nhắn (Map từ useStylistStore).
       * Hiển thị hiệu ứng loading (Typing indicator) khi isTyping = true.
       * Khung nhập liệu dưới cùng. Khi nhấn Enter -> Lưu tin nhắn User -> Bật isTyping -> Gọi API.
   * OutfitCard.tsx:
       * Hiển thị tiêu đề (Title) và lời khuyên (Reasoning).
       * Bên trong chứa một Grid nhỏ để render các ảnh/tên sản phẩm tương ứng với ID nhận được.

  3. Tích hợp Gọi API (Integration)
   * Viết hàm fetchOutfitSuggestions (sử dụng fetch chuẩn của Next.js).
   * Gọi endpoint: POST http://localhost:9000/api/v1/stylist/search.
   * Xử lý Global Error Format (Hiện Toast/Alert lỗi thân thiện nếu Backend trả về lỗi).

  4. Khởi tạo Trang (Page Routing)
   * Tạo file: apps/web/src/app/ai-stylist/page.tsx (Server Component).
   * Bọc Layout chuẩn của dự án và Import component ChatBox.tsx vào hiển thị ở trung tâm trang.
