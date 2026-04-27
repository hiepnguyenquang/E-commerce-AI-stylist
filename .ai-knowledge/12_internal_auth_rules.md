# Quy chuẩn Xác thực Nội bộ (Internal Auth Rules)

Tài liệu này quy định cách thức các dịch vụ trong hệ thống (Node.js Core và AI FastAPI) xác thực lẫn nhau khi giao tiếp trực tiếp qua HTTP API trong mạng nội bộ.

## 1. Chiến lược: Static Shared Key (MVP)
Để tối ưu tốc độ phát triển nhưng vẫn đảm bảo tính bảo mật cơ bản, hệ thống sử dụng một "Khóa bí mật dùng chung" (Shared Secret) được lưu cấu hình trong biến môi trường của các service.

- **Biến môi trường:** `INTERNAL_API_SECRET`
- **Vị trí truyền:** Header của HTTP Request.
- **Tên Header:** `x-internal-token`

## 2. Quy trình Xác thực
1. **Service A (Người gọi - Caller):** Đọc giá trị `INTERNAL_API_SECRET` từ `.env` và đính kèm vào header `x-internal-token`.
2. **Service B (Người nhận - Receiver):** Sử dụng một Middleware để kiểm tra sự tồn tại và tính chính xác của header `x-internal-token` trước khi xử lý logic nghiệp vụ.
3. **Kết quả:**
   - Nếu khớp: Tiếp tục xử lý.
   - Nếu không khớp hoặc thiếu: Trả về lỗi `401 Unauthorized`.

## 3. Ví dụ triển khai (Reference Implementation)

### A. Đối với FastAPI (Python) - `ai-service`
Sử dụng `Security` và `HTTPHeader` của FastAPI để tạo chốt chặn:

```python
from fastapi import Header, HTTPException, Security, status

INTERNAL_API_SECRET = "your_secret_key_here" # Load từ os.getenv

async def verify_internal_token(x_internal_token: str = Header(None)):
    if x_internal_token != INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal token"
        )
    return x_internal_token

# Sử dụng trong Router
@app.post("/v1/process-image")
async def process_image(token: str = Security(verify_internal_token)):
    return {"message": "Authenticated"}
```

### B. Đối với Node.js (Express/MedusaJS) - `api-medusa`
Tạo một middleware chuyên biệt:

```typescript
const internalAuthMiddleware = (req, res, next) => {
    const internalToken = req.headers['x-internal-token'];
    const secret = process.env.INTERNAL_API_SECRET;

    if (!internalToken || internalToken !== secret) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized: Internal access only"
        });
    }
    next();
};

// Áp dụng cho các routes nội bộ (ví dụ: nhận kết quả từ AI)
router.post("/internal/ai-callback", internalAuthMiddleware, handleCallback);
```

## 4. Lộ trình mở rộng (Future Roadmap)
Khi hệ thống chuyển từ MVP sang giai đoạn Production quy mô lớn, Middleware này sẽ được nâng cấp:
- **Phase 2:** Thay thế chuỗi tĩnh bằng **HMAC Signature** để đảm bảo tính toàn vẹn của payload.
- **Phase 3:** Chuyển sang sử dụng **Internal JWT** được cấp phát bởi một Identity Service riêng (Auth0, Keycloak) để quản lý quyền hạn (RBAC) chi tiết hơn cho từng service.

> **Lưu ý:** Tuyệt đối không để lộ `INTERNAL_API_SECRET` ra Frontend hoặc log ra console/file.
