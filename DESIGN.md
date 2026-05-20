---
name: AI Fashion E-commerce
description: Trợ lý AI Stylist và phòng thử đồ ảo cá nhân hóa
---

# Design System: AI Fashion E-commerce

## 1. Overview

**Creative North Star: "The Avant-Garde Runway"**

Giao diện là một sàn diễn thời trang rực rỡ và đầy năng lượng. Thoát khỏi sự an toàn của thiết kế phẳng, hệ thống áp dụng ngôn ngữ thiết kế "Glassmorphism" kết hợp với "Vibrant Gradients" và hiệu ứng không gian 3D mờ ảo. Mọi cú click, mọi lần di chuột đều mang lại sự thích thú (delight) thông qua các hoạt ảnh vật lý có độ nảy nhẹ, biến việc mua sắm thành một trải nghiệm giải trí đích thực.

**Key Characteristics:**
- Năng lượng thị giác cao (High visual energy).
- Chiều sâu không gian (Depth & Layering) với kính mờ và bóng đổ lớn.
- Chuyển động và phản hồi liên tục (Micro-interactions).

## 2. Colors

**The Drenched Accent Rule.** Sử dụng nền sáng tinh khôi (Off-white/Slate-50) kết hợp với các dải màu Gradient nóng bùng nổ (Rose-500 sang Orange-500) làm điểm nhấn chủ đạo.

- **Background**: `slate-50` kết hợp các quầng sáng (glow orbs) màu `rose-300/30`.
- **Primary Accent**: Dải gradient `from-rose-500 to-orange-500`.
- **Surface**: `white/70` đến `white/90` kèm `backdrop-blur` để tạo hiệu ứng kính.

## 3. Typography

**The Bold Statement Rule.**
- Tiêu đề (Headings): `font-black` (cực đậm), `tracking-tighter` (khoảng cách chữ hẹp), kết hợp đổ màu gradient cho các tiêu đề chính.
- Nội dung (Body): `font-medium` hoặc `font-light` để tạo độ tương phản mạnh với tiêu đề.

## 4. Elevation

**The Floating World Rule.** 
Các thẻ (Cards), Nút bấm (Buttons) và Khung chứa (Panels) không dính chặt vào nền. Chúng phải được nâng lên bằng các bóng đổ lớn, mềm mại (VD: `shadow-[0_20px_50px_rgba(0,0,0,0.1)]`) và nảy lên khi tương tác (`hover:-translate-y-2`).

## 5. Do's and Don'ts

### Do:
- **Do** sử dụng Gradient và Glow (Ánh sáng mờ) để làm nổi bật Call-to-Action.
- **Do** áp dụng hiệu ứng phóng to (`scale-105`), xoay nhẹ (`rotate-2`) khi hover vào hình ảnh thời trang để tạo sức sống.
- **Do** bọc các thành phần bằng lớp kính mờ (Glassmorphism) để khoe khéo các quầng màu nền phía sau.

### Don't:
- **Don't** làm phẳng giao diện; không dùng border đen/xám cứng nhắc.
- **Don't** ngần ngại sử dụng màu sắc rực rỡ ở những nơi cần sự chú ý.
