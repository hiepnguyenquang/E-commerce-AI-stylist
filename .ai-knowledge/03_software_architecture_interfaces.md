# Kiến trúc Phần mềm: Adapter & Dependency Inversion

Tài liệu này định nghĩa nguyên lý thiết kế cốt lõi (Core Architecture Principles) cho toàn bộ hệ thống Backend (Node.js & FastAPI), nhằm đảm bảo tính mở rộng (Scalability) và chống khóa chặt vào một công nghệ cụ thể (No Vendor Lock-in).

## Nguyên lý Cốt lõi (Dependency Inversion Principle - DIP)

Bảo vệ logic nghiệp vụ lõi (Core Domain) không bị phụ thuộc cứng (hardcode) vào bất kỳ nhà cung cấp API, cấu trúc dữ liệu của bên thứ ba, hay phần cứng cụ thể nào. 

Mọi giao tiếp của hệ thống với hệ sinh thái bên ngoài (AI Models, Database, Cổng thanh toán) đều **bắt buộc** phải thông qua các Hợp đồng (Interfaces) do chính hệ thống của chúng ta định nghĩa. Các công nghệ bên ngoài sẽ đóng vai trò là các "Adapter" tuân thủ theo các Interface này.

---

## 1. Interface cho AI Vision (Xử lý ảnh Virtual Try-On)

Đảm bảo hệ thống có thể chuyển tải (offload) tác vụ nặng sang máy chủ đám mây ngay lập tức khi phần cứng cục bộ (RTX 5060) quá tải, mà không làm gián đoạn luồng Message Queue.

*   **Interface chuẩn:** `IVirtualTryOnService`
    *   *Nhiệm vụ:* Nhận đầu vào chuẩn là dữ liệu byte của ảnh và đầu ra là một URL định dạng chuỗi.
*   **Các Adapter triển khai (Implementations):**
    *   `LocalCatVTONAdapter`: Gọi trực tiếp model suy luận trên phần cứng cục bộ, tận dụng VRAM của RTX 5060.
    *   `CloudFalAIAdapter`: Xử lý đóng gói request để gọi API qua mạng tới dịch vụ Fal.ai.

## 2. Interface cho AI Stylist (NLP & Vector Search)

Tốc độ ra mắt và cập nhật của các mô hình AI là rất nhanh. Việc thiết kế Interface giúp việc "thay não" (đổi ngôn ngữ/model) cho hệ thống chỉ tốn đúng một dòng code thay đổi lớp khởi tạo.

*   **Interface chuẩn:** `IIntentAnalyzer`
    *   *Nhiệm vụ:* Nhận đầu vào là đoạn text yêu cầu và trả về cấu trúc JSON chứa từ khóa phân tích.
*   **Các Adapter triển khai (Implementations):**
    *   `KimiAnalyzerAdapter`: Tương tác với model Kimi-k2.5 cho phiên bản hiện tại.
    *   `OpenAIAnalyzerAdapter`: Chuẩn bị sẵn Adapter để gọi API các model lớn hơn (như GPT-4) trong tương lai.

## 3. Interface cho Hạ tầng cơ sở (Lưu trữ & Thanh toán)

Tách biệt logic nghiệp vụ khỏi các dịch vụ vật lý hoặc dịch vụ tài chính bên ngoài.

### 3.1. Lưu trữ File (Storage)
*   **Interface chuẩn:** `IStorageService`
*   **Các Adapter triển khai:**
    *   `LocalStorageAdapter`: Lưu ảnh ngay trong thư mục tĩnh của máy chủ khi phát triển (Development).
    *   `S3StorageAdapter`: Viết thêm adapter này để kết nối AWS S3 khi cần mở rộng quy mô lưu trữ.

### 3.2. Cổng Thanh toán (Payment Gateway)
*   **Interface chuẩn:** `IPaymentGateway`
*   **Các Adapter triển khai:**
    *   `MockPaymentAdapter`: Luôn trả về trạng thái "Đã thanh toán" cho luồng Checkout hiện hành (MVP).
    *   `VNPayAdapter`: Tích hợp thực tế sau này. Thiết kế này là tiền đề để cắm cổng thanh toán thật vào mà không làm ảnh hưởng đến cấu trúc bảng giao dịch trên PostgreSQL hay luồng MedusaJS Workflows.
