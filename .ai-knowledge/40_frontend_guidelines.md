# Quy chuẩn Thiết kế Frontend (Next.js 14 & React 18)

Dự án áp dụng Next.js 14 (App Router), React 18, Tailwind CSS và Zustand. Việc phân định rõ ràng ranh giới giữa Server và Client là yếu tố sống còn để đảm bảo hiệu suất (Performance), tối ưu hóa SEO và cung cấp trải nghiệm tốt nhất (UX) cho tính năng AI.

## 1. Cấu trúc Thư mục (App Router Architecture)
Mã nguồn Frontend đặt tại `apps/web/src/`.
- `app/`: Chứa định tuyến (Routing). **Mặc định toàn bộ là Server Components**. Chỉ chứa các file `page.tsx`, `layout.tsx`, `loading.tsx`.
- `components/ui/`: Các thành phần giao diện tái sử dụng (Dumb Components như Button, Input, Dialog, Canvas Frame). Không chứa logic gọi API hay Global State.
- `components/features/`: Các thành phần xử lý nghiệp vụ phức tạp (Smart Components như `VTONUploader`, `ProductGrid`, `CartDrawer`).
- `store/`: Chứa các định nghĩa trạng thái toàn cục của Zustand.
- `lib/`: Chứa các hàm tiện ích (utils), cấu hình fetcher (gọi API), và formatters.

## 2. Quy tắc Server Components vs. Client Components
Áp dụng triệt để nguyên tắc **"Lá rụng (Leaves of the tree)"**:
- **Server Components (Mặc định):** Dùng để fetch dữ liệu từ Database/API, render HTML tĩnh (Danh sách sản phẩm, SEO metadata). Tuyệt đối KHÔNG dùng hook (`useState`, `useEffect`).
- **Client Components (`"use client"`):** Chỉ đẩy chỉ thị này xuống các component con sâu nhất có thể (Ví dụ: Nút bấm có hiệu ứng click, Form nhập liệu người dùng, Slider ảnh). Tuyệt đối không đặt `"use client"` ở cấp độ Page (`page.tsx`) hay Layout.

## 3. Quản lý Trạng thái (State Management) với Zustand
Zustand được chọn thay vì Redux/Context API nhờ sự nhẹ nhàng và không gây re-render thừa.
- **Phân tách Store theo Domain (Nghiệp vụ):**
  - `useCartStore`: Quản lý giỏ hàng, đồng bộ hóa tự động với LocalStorage (Sử dụng Persist middleware).
  - `useVTONStore`: Quản lý trạng thái tiến trình thử đồ AI (Chờ ảnh, Đang tải, Nhận SSE, Hoàn thành, Lỗi).
- **Tách biệt State và Action:** Component chỉ lấy (subscribe) đúng state nó cần thiết. Các hàm thay đổi state (actions) nên được gọi trực tiếp mà không cần đưa vào dependency array của `useEffect`.

## 4. Tiền xử lý Ảnh Đầu vào (Client-side Canvas Processing)
Theo quy định kiến trúc lõi (`architecture_rules.md`), toàn bộ ảnh do người dùng tải lên (để tạo hồ sơ AI hoặc thử đồ) **bắt buộc** phải được tiền xử lý tại trình duyệt của khách hàng (Client-side) trước khi gửi lên Server Node.js (BFF). Điều này giúp bảo vệ băng thông và tài nguyên lưu trữ của máy chủ.

- **Component Phụ trách:** Các component như `ImageUploader.tsx` hoặc `VTONCanvas.tsx` (Bắt buộc phải khai báo `"use client"`).
- **Thư viện khuyên dùng:** Kết hợp HTML5 `<canvas>` API và thư viện `browser-image-compression`.
- **Yêu cầu kỹ thuật bắt buộc:**
  1. **Cắt ảnh (Cropping & Resizing):** Ảnh phải được tự động cắt (crop) về đúng **tỷ lệ 3:4** (chuẩn khung hình thời trang) và giới hạn kích thước tối đa (Ví dụ: 768x1024 pixel) thông qua việc vẽ lại trên Canvas (`ctx.drawImage`).
  2. **Nén ảnh (Compression):** Ảnh sau khi cắt phải được nén về định dạng `WebP` hoặc `JPEG` với chất lượng phù hợp sao cho dung lượng đầu ra **bắt buộc dưới 2MB** (có thể dễ dàng thay đổi dung lượng đầu ra bắt buộc)

## 5. Kết nối Thời gian thực (SSE - Server-Sent Events)
Để nhận kết quả sinh ảnh từ AI (Thông qua API-10: `/api/v1/stream/vision-results`), Frontend sử dụng `EventSource`.
- Kênh SSE chỉ được khởi tạo bên trong một Client Component (thường nằm trong `useEffect` của `VTONResultView.tsx`).
- Ngay khi nhận được sự kiện `vision_complete`, Component sẽ lập tức gọi action của `useVTONStore` để cập nhật UI hiển thị ảnh mới, sau đó gọi hàm `eventSource.close()` để đóng kết nối và giải phóng tài nguyên mạng.
