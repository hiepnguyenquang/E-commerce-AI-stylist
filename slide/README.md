# Slide bảo vệ đồ án cơ sở

Bộ slide HTML/CSS/JS chạy offline, không dùng framework hoặc CDN.

## Mở slide

Mở trực tiếp `index.html` bằng trình duyệt. Để tránh hạn chế của một số trình duyệt khi chạy từ `file://`, có thể chạy HTTP server có sẵn của Python:

```powershell
python -m http.server 8080 --directory slide
```

Sau đó mở `http://localhost:8080`.

## Điều khiển

- `←`, `→`, `↑`, `↓`, `PageUp`, `PageDown`, `Space`: chuyển slide.
- `P`: bật hoặc thoát trình chiếu toàn màn hình.
- `T`: chuyển chế độ sáng/tối.
- `O`: mở tổng quan slide.
- `Home`, `End`: tới slide đầu hoặc cuối.

## Xuất PDF

1. Nhấn nút `PDF` trên thanh điều khiển hoặc dùng `Ctrl + P`.
2. Chọn `Save as PDF`.
3. Chọn bố cục ngang và bật tùy chọn in hình nền.
4. Đặt lề là `None` nếu trình duyệt không tự nhận CSS trang in.

CSS in đã thiết lập kích thước trang 16:9 và tự động in toàn bộ slide.

File `slides-preview.pdf` là bản PDF đã xuất thử gồm đủ 18 trang. Thư mục `previews/` chứa một số ảnh render dùng để kiểm tra nhanh giao diện.
