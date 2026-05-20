# Bug Resolution Log & Error Memory

Tệp tin này lưu trữ lịch sử các lỗi đã được giải quyết để hệ thống AI tham khảo, tránh lặp lại sai lầm và rút ngắn thời gian gỡ lỗi trong tương lai.

## [2026-05-05] - [MedusaJS File Watcher Restarting on Uploads]
- **Triệu chứng (Symptoms):**
  Tiến trình API bị ngắt ngang (treo Frontend, lỗi 500 hoặc rớt kết nối) khi xử lý tác vụ mất thời gian ngay sau khi lưu file vào ổ đĩa. Log báo `[Watcher] created public/uploads/... created: restarting dev server`.
- **Nguyên nhân gốc rễ (Root Cause):**
  File Watcher của MedusaJS quét toàn bộ thư mục `public/` và lập tức khởi động lại server khi có file mới. Không thể bỏ qua bằng `.gitignore` cục bộ trong mọi trường hợp của monorepo.
- **Giải pháp (Resolution):**
  Chuyển thư mục lưu trữ từ `public/uploads` sang `.medusa/uploads`. Thư mục `.medusa/` là "vùng mù" (blind spot) được Watcher cấu hình cứng bỏ qua. Cấu hình middleware `express.static` để map URL `/uploads/*` đến `.medusa/uploads`.
- **Bài học (Lessons Learned):**
  Mọi tệp tin sinh ra ở runtime (ảnh tải lên, logs) phải được lưu vào các thư mục mà File Watcher đã loại trừ (như `.medusa/`) để đảm bảo không đứt gãy luồng xử lý.

## [2026-05-05] - [Unsupported protocol: d: in @imgly on Windows]
- **Triệu chứng (Symptoms):**
  Hàm `removeBackground` của `@imgly/background-removal-node` văng lỗi `Error: Unsupported protocol: d:` khi chạy trên hệ điều hành Windows.
- **Nguyên nhân gốc rễ (Root Cause):**
  Thư viện sử dụng cơ chế parse URI nội bộ. Khi nhận đầu vào là một đường dẫn tuyệt đối của Windows (Ví dụ: `D:\project\file.png`), nó nhầm ký tự `D:` là tên giao thức mạng (giống như `http:`).
- **Giải pháp (Resolution):**
  Sử dụng hàm `pathToFileURL` từ module `url` của Node.js để bọc file path lại thành URI chuẩn `file:///D:/project/file.png` trước khi truyền vào hàm AI. (Bổ sung thêm tham số `publicPath` trỏ đến CDN để phòng ngừa lỗi tải mô hình tĩnh khi chạy qua pnpm symlink).
- **Bài học (Lessons Learned):**
  Khi truyền file vật lý cục bộ vào bất kỳ thư viện xử lý AI hoặc WebAssembly nào trên Node.js, luôn ưu tiên định dạng URI dạng `file://` thay vì Absolute Path của Windows.

## [2026-05-05] - [MedusaJS Middleware req.path Override (404/301 Errors)]
- **Triệu chứng (Symptoms):**
  Frontend không thể load ảnh qua URL `/uploads/processed_xxx.png`. Trình duyệt báo lỗi 404 (Not Found) hoặc bị redirect 301 tự động nối thêm gạch chéo `/` vào đuôi file (`.png/`).
- **Nguyên nhân gốc rễ (Root Cause):**
  Cơ chế định tuyến nội bộ của MedusaJS tự động sửa đổi thuộc tính `req.path` khi request đi qua custom middleware. Nó cắt bỏ prefix `/uploads` khiến việc parse filename từ `req.path` bị trả về chuỗi rỗng `/`. Thư viện `express.static` cũng không tương thích tốt với cơ chế này.
- **Giải pháp (Resolution):**
  Bỏ `express.static` và viết custom middleware phục vụ file tĩnh (`res.sendFile()`). Thay vì dùng `req.path`, bắt buộc phải trích xuất tên file từ `req.originalUrl` (vì thuộc tính này bảo toàn URL ban đầu) kết hợp với regex để làm sạch trailing slash do 301 redirect gây ra.
- **Bài học (Lessons Learned):**
  Trong môi trường MedusaJS v2, khi thao tác với URL trong custom middleware, luôn cẩn trọng với `req.path` và ưu tiên dùng `req.originalUrl` để lấy chính xác thông tin request ban đầu từ Client.

## [2026-05-09] - [WSL2 Network Connection Refused (localhost vs 127.0.0.1 vs Host IP)]
- **Triệu chứng (Symptoms):**
  Ứng dụng Python (AI Service) chạy bên trong WSL2/Ubuntu gặp lỗi `[Errno 111] Connection refused` hoặc treo 3-4 phút khi cố gắng kết nối tới RabbitMQ và MedusaJS Backend đang chạy trên môi trường Windows Host.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **Trễ 3-4 phút với RabbitMQ:** Thư viện Python (`pika`) khi phân giải `localhost` thường ưu tiên kết nối IPv6 `::1`. Trên WSL2, kết nối IPv6 bị treo thay vì bị từ chối ngay lập tức, dẫn đến ứng dụng phải chờ hết timeout mới fallback sang IPv4.
  2. **Connection Refused với Medusa:** `127.0.0.1` bên trong WSL2 đại diện cho chính máy ảo đó chứ không phải Windows Host. Vì ứng dụng Node.js (Medusa) chạy trên Windows (không dùng Docker Xuyên thủng mạng) nên kết nối từ WSL gọi vào `127.0.0.1:9000` bị từ chối ngay.
- **Giải pháp (Resolution):**
  - Chuyển tất cả thiết lập RabbitMQ từ `localhost` sang trực tiếp IPv4 `127.0.0.1` để ngăn việc kẹt timeout phân giải IPv6.
  - Khi cần tải dữ liệu (ảnh) từ ứng dụng Native Windows (MedusaJS), AI Service phải tự động lấy Default Gateway của WSL2 (lệnh `ip route show default`) để trích xuất địa chỉ IP tĩnh thực tế của Windows trên mạng ảo (vd: `172.x.x.x`), thay vì dùng cứng `localhost` hay `127.0.0.1`.
- **Bài học (Lessons Learned):**
  Không bao giờ tin tưởng `localhost` khi giao tiếp mạng chéo giữa Windows Host và máy ảo WSL2. Hãy luôn ép IPv4 `127.0.0.1` cho các kết nối Docker cục bộ và sử dụng Default Gateway IP khi liên kết ngược về tiến trình Native của hệ điều hành máy chủ.

## [2026-05-10] - [Uvicorn Startup Hangs & Redundant ML Model Loading in WSL2]
- **Triệu chứng (Symptoms):**
  1. Chạy `uvicorn --reload` mất hơn 5 phút mới hiện log bắt đầu.
  2. Các mô hình AI nặng (như CLIP) bị tải nhiều lần vào bộ nhớ.
  3. Lệnh `uvicorn` không có `--reload` treo cứng hoàn toàn không in ra log (Silent Hang).
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **File Watcher quá tải:** Tính năng `--reload` của Uvicorn quét toàn bộ cây thư mục mỗi giây. Trên WSL2 gắn qua phân vùng Windows (`/mnt/d/`), việc quét thư mục `.venv` chứa hàng chục nghìn file làm nghẽn cổ chai I/O nghiêm trọng.
  2. **Trùng lặp đối tượng:** Thiếu cơ chế Singleton khiến các tiến trình chạy ngầm (Consumers) tự gọi hàm và tự tải nhiều bản sao của Model CLIP vào RAM/VRAM.
  3. **Deadlock Import (C-Extensions):** Khi chạy ở Single-process (không có `--reload`), các thread chạy ngầm tranh nhau khởi chạy và gọi hàm import các thư viện cực nặng như PyTorch, Diffusers tại thời điểm Uvicorn đang cố gắng dựng server event loop, gây ra khóa chéo (Deadlock) ở tầng C-extension.
  4. **Google GenAI ADC Timeout:** Khởi tạo `genai.Client` ở biến toàn cục. Nếu thiếu API Key, SDK tự động tìm Application Default Credentials bằng cách gọi tới Metadata Server (`169.254.169.254`). Request này bị WSL2 "nuốt" (drop packets) gây ra việc tiến trình chính bị treo hàng phút chờ timeout.
- **Giải pháp (Resolution):**
  1. **Hạn chế thư mục Watcher:** Bắt buộc sử dụng cờ `--reload-dir src --reload-dir .` để bỏ qua thư mục `.venv`.
  2. **Singleton Pattern:** Cấu hình `threading.Lock()` cho hàm `get_embedding_service()` để đảm bảo Model chỉ được load 1 lần duy nhất.
  3. **Sequential Background Init:** Cấu trúc lại hàm `lifespan`. Chỉ dùng 1 thread khởi tạo (có `sleep(2)` chờ FastAPI lên hẳn), sau đó mới tuần tự import các thư viện nặng ngầm và khởi chạy các Consumer Threads.
  4. **Lazy Load API Client:** Chuyển việc khởi tạo các dịch vụ phụ thuộc mạng (như `genai.Client`) vào bên trong hàm xử lý của Router (Endpoint) thay vì mức Global.
- **Bài học (Lessons Learned):**
  Khi kết hợp FastAPI với các thư viện AI nặng (PyTorch, Transformers) và SDK gọi mạng (Google/OpenAI) trên kiến trúc đa luồng, tuyệt đối **không import model hoặc khởi tạo client ở cấp độ toàn cục (Global Scope)**. Luôn áp dụng mô hình "Khởi tạo trễ" (Lazy Loading) hoặc "Khởi tạo tuần tự" (Sequential Initialization) để tránh làm nghẽn quá trình nạp Event Loop của Uvicorn.

## [2026-05-12] - [Windows Native Transition: Symlinks, Safetensors, and PIL Palette Warnings]
- **Triệu chứng (Symptoms):**
  Khi chạy `ai-service` trên Windows Native thay vì WSL, Terminal hiện hàng loạt warning:
  1. `huggingface_hub` không hỗ trợ tạo symlink.
  2. Không tìm thấy file `safetensors` cho `stable-diffusion-inpainting` gây delay vài giây nạp weights định dạng pickle cũ.
  3. `PIL.Image` báo warning "Palette images with Transparency expressed in bytes should be converted to RGBA images" khi đọc ảnh tách nền truyền từ Node.js sang.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. Windows yêu cầu Developer Mode để tạo symlink.
  2. Hàm `from_pretrained` của Diffusers mặc định tìm file `.safetensors` trước, nếu thất bại mới tìm `.bin` (pickle), gây lãng phí thời gian.
  3. Thư viện `@imgly/background-removal-node` bên MedusaJS trả về mảng bytes của ảnh dạng P-mode (Palette) với index màu trong suốt, thay vì định dạng tiêu chuẩn RGBA/RGB, khiến PIL bên Python phải cảnh báo.
- **Giải pháp (Resolution):**
  1. Bật **Developer Mode** trong cài đặt của Windows để cho phép tạo symlink (Đã bật thành công).
  2. Tại `pipeline.py` của CatVTON, bổ sung tham số `use_safetensors=False` vào các hàm nạp mô hình VAE, UNet, và Safety Checker để ép đọc trực tiếp file pickle.
  3. Cài đặt thêm thư viện `sharp` vào ứng dụng `api-medusa`. Sau khi xóa nền, dùng `sharp(buffer).toFormat('png').toBuffer()` để chuẩn hóa cấu trúc byte về chuẩn RGBA/RGB trước khi lưu file ảnh `processed_...png`.
- **Bài học (Lessons Learned):**
  1. Cấu trúc file ảnh truyền giữa các nền tảng (Node.js -> Python) không chỉ quan tâm đến đuôi `.png` mà còn phải chuẩn hóa encoding (RGB/RGBA) thông qua các công cụ như `sharp` để tránh các lỗi xử lý ngầm.
  2. Khi khởi chạy mô hình mã nguồn mở không có sẵn `.safetensors`, việc gắn cờ `use_safetensors=False` là cần thiết để triệt tiêu thời gian chờ vô ích trong môi trường Production.

## [2026-05-12] - [Optimize CatVTON VRAM Loading Time]
- **Triệu chứng (Symptoms):**
  Mỗi lần người dùng gọi API thử đồ ảo (VTON), hệ thống tốn quá nhiều thời gian để nạp (load) mô hình CatVTON vào VRAM rồi lại xóa đi (Dynamic Loading). Việc này gây chậm trễ đáng kể cho người dùng.
- **Nguyên nhân gốc rễ (Root Cause):**
  Mã nguồn ban đầu áp dụng cơ chế Dynamic Loading (chỉ nạp model khi có request, và dọn dẹp VRAM ngay sau khi xong) nhằm nhường chỗ cho model NLP. Tuy nhiên, hệ thống đã chuyển sang dùng Cloud LLM API (Gemini) thay vì Local NLP, khiến không gian VRAM (8GB) hoàn toàn trống rỗng và chỉ dành cho Model VTON. Việc tải động là không còn cần thiết.
- **Giải pháp (Resolution):**
  Cập nhật class `LocalCatVTONAdapter`:
  1. Di chuyển logic khởi tạo `CatVTONPipeline` và `AutoMasker` vào trong hàm `__init__`. Các model sẽ được tải thẳng vào VRAM một lần duy nhất lúc khởi động AI server (Persistent Loading).
  2. Xóa bỏ logic `torch.cuda.empty_cache()` và xóa object (`del pipeline`) trong hàm `try_on`.
- **Bài học (Lessons Learned):**
  1. Chiến lược quản lý VRAM (Dynamic hay Persistent) phụ thuộc vào số lượng và dung lượng của các Model cạnh tranh bộ nhớ. Nếu một Model nặng khác không tồn tại, ưu tiên giữ nó thường trú trong VRAM để loại bỏ độ trễ do disk I/O.

## [2026-05-13] - [AI Stylist Bỏ Qua Trang Phục Cá Nhân (Closet Items)]
- **Triệu chứng (Symptoms):**
  Khi người dùng chat yêu cầu AI Stylist gợi ý phối đồ, kết quả trả về luôn là các sản phẩm từ cửa hàng (store) và AI hoàn toàn không đề xuất các sản phẩm trong tủ đồ cá nhân (closet) dù dữ liệu metadata đã được đồng bộ vào LanceDB.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **Thiếu Metadata Nguồn gốc (Source) ở Tầng Giao tiếp LLM:** Mặc dù `VectorSearch` trong LanceDB trả về kết quả có trường `"source": "closet"`, nhưng tại `llm_client.py` (API sinh outfit), hàm loop trích xuất `simplified_products` truyền vào prompt đã bỏ sót và loại bỏ thuộc tính `"source"`. Điều này khiến LLM không có căn cứ nhận diện item nào đến từ đâu.
  2. **Prompt định hướng sai (Prompt Misdirection):** Lời nhắc (Prompt C) nói với LLM rằng `"Dưới đây là danh sách các sản phẩm ĐANG CÓ SẴN trong kho..."`. Việc thiếu tag nguồn gốc và câu lệnh chỉ định "trong kho" đã khiến AI phớt lờ các món đồ cá nhân (giá 0.0) vì nghĩ đó không phải sản phẩm được mua sắm chuẩn.
  3. **Lỗi Hardcode IP gây hỏng đồng bộ khi chạy WSL2:** Mặc dù trước đó đã có hàm `get_host_ip()` để giải quyết vấn đề mạng cho WSL2 kết nối vào MedusaJS, nhưng trong `main.py` ở module `start_closet_consumer`, biến `host_ip` lại bị hardcode cứng `"127.0.0.1"`. Khi chạy AI Service trên WSL2, việc tải ảnh tủ đồ từ MedusaJS bị `Connection Refused`, sinh ra Exception bị chìm, làm mất bản ghi Vector cho LanceDB (lỗi này đã được sửa đồng thời).
- **Giải pháp (Resolution):**
  - Bổ sung trường `"source": p.get("source", "store")` vào vòng lặp tạo `simplified_products`.
  - Cập nhật Prompt C để chỉ rõ danh sách bao gồm cả `"trong kho và TỦ ĐỒ CÁ NHÂN"`, đồng thời thêm chỉ thị Ràng buộc buộc LLM phải `ƯU TIÊN sử dụng các sản phẩm từ tủ đồ cá nhân (có "source": "closet") để phối cùng các món đồ mới`.
  - Đổi lại biến `host_ip = get_host_ip()` trong hàm lắng nghe hàng đợi đồng bộ ảnh để vá triệt để lỗi mạng khi AI Service đặt trong WSL2.
- **Bài học (Lessons Learned):**
  Trong mô hình RAG (Retrieval-Augmented Generation), việc Data Pipeline truy xuất thành công dữ liệu là chưa đủ. Dữ liệu khi đi vào Context Window của LLM cần phải truyền tải nguyên vẹn Metadata đặc trưng (như `source`) và Lời nhắc (Prompt) phải có định hướng (Instruction) tường minh để LLM hiểu và ứng xử đúng với Context đó. Không được giả định AI "tự hiểu" ý nghĩa chỉ qua thuộc tính Tên của đối tượng.

## [2026-05-13] - [TypeError: fetch failed (ECONNREFUSED) when updating AI Profile]
- **Triệu chứng (Symptoms):**
  Khi cập nhật ảnh hồ sơ AI từ Frontend (hoặc khi Next.js khởi chạy), terminal log của `web:dev` báo lỗi `TypeError: fetch failed` kèm mã `ECONNREFUSED`. Thao tác upload trên UI cũng hiện cảnh báo lỗi lưu hồ sơ.
- **Nguyên nhân gốc rễ (Root Cause):**
  Lỗi không nằm ở mã nguồn Frontend. Nguyên nhân do hệ thống MedusaJS Backend (cổng 9000) đã bị sập (Crash) ngay từ lúc khởi động nền. Cụ thể, khi thêm module xử lý ảnh `sharp@0.34.5` vào Medusa để sửa lỗi PIL, thư viện này gặp lỗi nạp thư viện C++ liên kết động trên Windows (`ERR_DLOPEN_FAILED: Could not load the "sharp" module using the win32-x64 runtime`). Việc Medusa sập từ trong trứng nước khiến mọi request fetch từ Next.js tới port 9000 bị từ chối kết nối (`ECONNREFUSED`).
- **Giải pháp (Resolution):**
  - Hạ cấp phiên bản (Downgrade) thư viện `sharp` xuống phiên bản `0.32.6` (phiên bản cực kỳ ổn định trên Windows). Cụ thể đã chạy: `pnpm --filter @fundamental/api-medusa add sharp@0.32.6`.
  - Khởi động lại Medusa API, máy chủ đã chạy thành công ở cổng 9000. Lỗi kết nối chấm dứt, người dùng có thể tải ảnh lên bình thường.
- **Bài học (Lessons Learned):**
  Trên môi trường Windows Native, việc sử dụng các thư viện Node.js có chứa native bindings (C-extensions) như `sharp` hoặc `canvas` rất dễ bị lỗi `ERR_DLOPEN_FAILED`. Khi xuất hiện lỗi `ECONNREFUSED` từ phía Frontend, thay vì tìm lỗi ở source code React/Next.js, bắt buộc phải kiểm tra ngay tiến trình Backend tương ứng có thực sự đang chạy (Listening) hay không bằng cách xem log Terminal khởi động của Backend.

## [2026-05-13] - [VTON State Conflict between Wardrobe and AI Stylist]
- **Triệu chứng (Symptoms):**
  Khi người dùng thực hiện Mix & Match và chạy VTON ở trang Tủ đồ cá nhân (Wardrobe), nếu chuyển sang trang AI Stylist hoặc trang Sản phẩm, modal VTON (dành riêng cho thử đồ 1 món) cũng tự động bật lên và hiển thị cùng trạng thái tiến trình (đang chạy, hoàn thành).
- **Nguyên nhân gốc rễ (Root Cause):**
  Ứng dụng Next.js (SPA) sử dụng Zustand để quản lý trạng thái toàn cục (Global State) cho tính năng VTON (`useVTONStore`). Cả `WardrobePage` và `VTONModal` (được nhúng ở AI Stylist) đều lắng nghe chung các biến `status`, `progressMessage`. Do chưa có cơ chế phân biệt ngữ cảnh (context), bất kỳ component nào gọi lệnh `startVTON` cũng sẽ khiến toàn bộ các component khác đang lắng nghe bị kích hoạt UI đồng loạt.
- **Giải pháp (Resolution):**
  1. Bổ sung trường `activeContext: 'modal' | 'wardrobe' | null` vào `useVTONStore.ts`.
  2. Khi gọi hàm `startVTON` (từ OutfitCard/Product), gán `activeContext = 'modal'`. Khi gọi `startMultiStepVTON` (từ Wardrobe), gán `activeContext = 'wardrobe'`.
  3. Sửa đổi `VTONModal.tsx` để chỉ render khi `activeContext === 'modal'`. Tương tự, màn hình loading của trang Wardrobe chỉ hiện khi `activeContext === 'wardrobe'`.
- **Bài học (Lessons Learned):**
  Khi sử dụng Global State Management (như Zustand hoặc Redux) cho các tác vụ UI có thể được kích hoạt từ nhiều trang khác nhau (như modal, overlay), bắt buộc phải có thuộc tính đánh dấu ngữ cảnh (context) hoặc ID của phiên làm việc để tránh rò rỉ trạng thái (state leakage) làm sai lệch UI ở các trang không liên quan.

## [2026-05-13] - [AI Stylist Generating Duplicate Outfit Options]
- **Triệu chứng (Symptoms):**
  Khi lượng sản phẩm trong kho hoặc tủ đồ cá nhân quá ít, AI Stylist sinh ra 2 bộ đồ (Options) giống hệt nhau hoặc lặp lại cùng một phong cách thay vì đưa ra các lựa chọn khác biệt hoặc chỉ trả về 1 bộ đồ duy nhất.
- **Nguyên nhân gốc rễ (Root Cause):**
  Trong file `llm_client.py`, câu lệnh hệ thống (Prompt C) ép buộc LLM bằng câu lệnh `Hãy chọn ra các món đồ phù hợp nhất từ danh sách trên để kết hợp thành {limit_options} Options hoàn chỉnh.` Do hệ thống quy định cứng `limit_options = 2` từ Frontend, LLM bị ép buộc phải sinh ra đủ 2 bộ. Khi không có đủ sản phẩm phù hợp để tạo ra 2 bộ khác biệt, thay vì trả về 1 bộ duy nhất, LLM cố gắng "lách luật" bằng cách lặp lại kết quả hoặc ghép nối vô lý để đủ định mức.
- **Giải pháp (Resolution):**
  - Chỉnh sửa Prompt C, định nghĩa lại `limit_options` là số lượng **TỐI ĐA** (maximum) thay vì bắt buộc.
  - Bổ sung lệnh rõ ràng: `Nếu danh sách sản phẩm cung cấp không đủ đa dạng để tạo ra {limit_options} Set đồ hoàn toàn khác biệt, hãy chỉ trả về số lượng Option khả thi (ví dụ 1 Option duy nhất). TUYỆT ĐỐI KHÔNG được tạo ra các Option trùng lặp...`.
- **Bài học (Lessons Learned):**
  Khi thiết kế hệ thống Prompt để sinh mảng dữ liệu (Array of items), cần phải trù trừ trường hợp tập dữ liệu đầu vào (Context/Pool) quá nhỏ không đủ đáp ứng số lượng yêu cầu (Limit). Không nên ép buộc cứng (hard limit) số lượng kết quả trả về đối với LLM để tránh tình trạng ảo giác (Hallucination) hoặc lặp lại kết quả (Repetition).

## [2026-05-13] - [AI Stylist Gender Confusion and Profile Hydration Failure]
- **Triệu chứng (Symptoms):**
  1. Khi người dùng thiết lập hồ sơ AI (AI Profile) là Nam (`male`), sau khi tải lại trang, giới tính bị hiển thị ngược về `Unisex`.
  2. Khi người dùng chat với AI Stylist, AI thường xuyên xưng hô là "quý cô" hoặc tư vấn trang phục theo phong cách nữ tính bất chấp người dùng là nam.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **Lỗi Frontend/Backend Hydration:** File model của MedusaJS (`ai-profile.ts`) và cấu trúc schema CSDL ban đầu không hề có cột `gender`. Ở backend (`route.ts` của ai-profile), thông tin `gender` từ `formData` bị bỏ qua hoàn toàn và không được lưu vào Postgres. Do đó, khi Frontend (`page.tsx`) gọi API `GET /v1/ai-profile`, không có trường `gender` trả về, khiến React state bị fallback về giá trị mặc định là `unisex`.
  2. **Thiếu Ngữ cảnh Giới tính trong LLM (Missing Context):** API AI Stylist (`/v1/stylist/search`) không hề gửi thông tin giới tính sang Python AI Service. Hàm `generate_outfit_options` trong `llm_client.py` cũng không có cơ chế nhận `gender`. Do thiếu ngữ cảnh, LLM tự động mặc định (bias) đối tượng mua sắm thời trang là nữ giới ("quý cô").
- **Giải pháp (Resolution):**
  1. **Sửa Model và API:** Bổ sung trường `gender: model.text().nullable()` vào file `models/ai-profile.ts`. Cập nhật `POST /v1/ai-profile` (MedusaJS) để trích xuất `gender` từ `req.body` và lưu vào DB. Cập nhật Frontend để hydrate biến state `gender` từ API trả về.
  2. **Tiêm Ngữ cảnh Giới tính (Context Injection):** Sửa API proxy `POST /v1/stylist/search` để tự động truy vấn (fetch) `gender` từ bảng `ai_profiles` của người dùng hiện tại trước khi gửi request sang Python. Tại Python, thêm biến nội suy `audience` (dành cho nam giới / dành cho nữ giới) vào Prompt tùy thuộc vào giá trị `gender` nhận được, và bổ sung ràng buộc nghiêm ngặt cấm xưng hô sai giới tính.
- **Bài học (Lessons Learned):**
  Khi xây dựng các tính năng cá nhân hóa bằng AI (Personalized AI), mọi dữ liệu định danh cốt lõi (như giới tính, độ tuổi) phải được truyền xuyên suốt qua toàn bộ vòng đời của request (từ Frontend -> Core Backend -> AI Worker -> LLM Context Window). Nếu làm rơi rớt dữ liệu ở bất kỳ mắt xích nào, LLM sẽ tự động điền vào bằng định kiến (bias) có sẵn của nó, gây ra trải nghiệm tệ hại cho người dùng.

## [2026-05-14] - [AI Stylist Over-Suggesting Items Unfriendly to VTON]
- **Triệu chứng (Symptoms):**
  AI Stylist thỉnh thoảng gợi ý những Set đồ bao gồm 3 món (ví dụ: Áo thun + Quần âu + Áo khoác ngoài) hoặc thêm giày dép, phụ kiện. Tuy nhiên, luồng VTON đa bước (Multi-step) hiện tại của hệ thống chỉ được thiết kế ổn định cho tối đa 2 lớp quần áo cơ bản (1 áo + 1 quần, hoặc 1 váy liền). Việc AI gọi thêm áo khoác ngoài (outerwear) hoặc phụ kiện khiến giao diện VTON bị lỗi hoặc gửi request không hợp lệ cho CatVTON worker.
- **Nguyên nhân gốc rễ (Root Cause):**
  Trong file `llm_client.py`, cấu trúc Prompt C của LLM cho phép AI Stylist có quyền tự do thêm các phụ kiện và áo khoác ngoài (Câu lệnh cũ: *"Bạn có thể thêm giày (shoes) hoặc phụ kiện (accessories) nếu có trong danh sách"*). LLM không tự biết được giới hạn kỹ thuật của hệ thống VTON phía sau.
- **Giải pháp (Resolution):**
  Cập nhật lại toàn bộ ngữ cảnh Ràng buộc (Constraints) trong Prompt C (`llm_client.py`) để nghiêm cấm AI gợi ý vượt quá khả năng xử lý của VTON:
  1. Thêm chỉ thị `GIỚI HẠN SỐ LƯỢNG MÓN ĐỒ`: Khẳng định hệ thống hiện tại chỉ hỗ trợ thử đồ ảo tối đa 2 lớp.
  2. Bắt buộc AI chia làm 2 trường hợp: Hoặc là chính xác 2 món (1 Áo + 1 Quần/Chân váy), Hoặc là chính xác 1 món (Váy liền/Đầm).
  3. Bổ sung lệnh cấm ngặt nghèo: `TUYỆT ĐỐI KHÔNG gợi ý thêm Áo khoác ngoài (outerwear), Giày (shoes) hay Phụ kiện (accessories) trong thời điểm hiện tại`.
- **Bài học (Lessons Learned):**
  Đối với hệ thống AI kết hợp nhiều công nghệ (ví dụ LLM kết hợp với Computer Vision), sự sáng tạo của LLM phải luôn được kiểm soát và đồng bộ với giới hạn năng lực kỹ thuật của mô hình Vision. Không nên cho phép LLM gợi ý những tính năng/sản phẩm mà hệ thống backend (hay engine render ảnh) không có khả năng xử lý, để tránh tạo ra kỳ vọng sai và trải nghiệm lỗi cho người dùng.

## [2026-05-14] - [MedusaJS invalid_data Error after adding columns to Model]
- **Triệu chứng (Symptoms):**
  Khi thêm trường (cột) mới vào Data Model của MedusaJS (ví dụ thêm gender vào AiProfile), nếu khởi động lại server và dùng API POST/PUT để lưu dữ liệu có chứa trường mới đó, Medusa sẽ trả về lỗi 500 Internal Server Error với `type: 'invalid_data'` và `code: undefined`.
- **Nguyên nhân gốc rễ (Root Cause):**
  Trong MedusaJS v2, việc thay đổi định nghĩa Model trong thư mục models/ chỉ là thay đổi mã nguồn ORM. Medusa không tự động Alter bảng (thêm cột) ở PostgreSQL khi chạy lệnh `medusa develop` (hoặc pnpm dev). Do bảng Postgres chưa có cột gender, hệ thống ORM của Medusa chặn việc lưu (validation error) hoặc ném ra exception invalid_data vì dữ liệu không khớp với Database schema.
- **Giải pháp (Resolution):**
  Mỗi khi thay đổi bất kỳ file Model nào, bắt buộc phải sinh file Migration và chạy Migrate. Cụ thể:
  1. `npx medusa db:generate [tên_module]` (vd: `npx medusa db:generate aiPersonalization`).
  2. `npx medusa db:migrate`.
  Đã thực thi 2 lệnh này thành công, dữ liệu gender đã có thể được lưu bình thường.
- **Bài học (Lessons Learned):**
  Trong quá trình phát triển với MedusaJS (và các ORM nói chung), mã nguồn (Model) và cơ sở dữ liệu (Database Schema) là hai thực thể tách biệt. Mọi sự thay đổi về cấu trúc phải luôn đi kèm với quá trình Migration (Generate -> Migrate) để đảm bảo đồng bộ, tránh các lỗi `invalid_data` không rõ nguyên nhân.

## [2026-05-14] - [AI Stylist VTON Try-On Generating Garbage Results]
- **Triệu chứng (Symptoms):**
  Khi người dùng nhấn 'Thử Đồ Toàn Set' trong AI Stylist, ảnh kết quả (VTON) bị biến dạng nghiêm trọng (ví dụ: quần bị mặc lên thân trên, áo bị mặc lên chân). Trong khi đó, luồng Mix & Match ở trang Tủ đồ (Wardrobe) lại hoạt động hoàn hảo.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **Thiếu Category Type:** Thuộc tính `type` (upper_body, lower_body, dress) của trang phục rất quan trọng để CatVTON phân tích và tạo mask. Ở luồng Tủ đồ, Frontend đã định tuyến sẵn loại quần áo. Nhưng ở AI Stylist, `OutfitCard.tsx` tự động đoán bừa `type` bằng cách tìm từ khóa (quần, váy) trong tên. Nếu tên sản phẩm là tiếng Anh hoặc thiếu từ khóa, thẻ tự động gắn mặc định `type = 'upper_body'`. Do đó, nếu AI gợi ý một chiếc quần, VTON sẽ che đi thân trên và cố vẽ cái quần lên ngực người mẫu.
  2. **Thứ tự thực thi VTON (Order of Execution):** `OutfitCard.tsx` gửi danh sách quần áo lên API theo thứ tự ngẫu nhiên. Nếu áo được vẽ sau quần (hoặc ngược lại không đúng chuẩn) có thể gây lỗi xếp lớp (layering) trên CatVTON.
- **Giải pháp (Resolution):**
  1. **Hydrate chính xác Category:** Cập nhật API Proxy `api/v1/stylist/search/route.ts` ở MedusaJS, lấy thêm `categories` từ Database và map vào trường `clothing_type` (upper_body, lower_body, dress) truyền thẳng cho Frontend.
  2. **Sort Logic ở Frontend:** Trong `OutfitCard.tsx`, ưu tiên lấy `item.clothing_type` thay vì đoán tên. Đồng thời, hàm `handleOutfitTryOn` đã được bổ sung thuật toán sắp xếp (sort) mảng `garmentsToProcess` theo thứ tự: `dress` -> `lower_body` -> `upper_body` trước khi gửi lên API để đảm bảo lớp vẽ được phân tầng chuẩn.
- **Bài học (Lessons Learned):**
  Khi truyền dữ liệu ảnh vào AI Vision Model phân chia theo bộ phận cơ thể (như CatVTON), tuyệt đối không đoán loại trang phục bằng chuỗi văn bản (string matching) trên Frontend nếu tên sản phẩm không được chuẩn hóa. Phải luôn lấy loại trang phục nguyên bản (category type) trực tiếp từ Database gốc để làm Input điều hướng cho AI.

## [2026-05-14] - [AI Stylist Refusal UI and VTON Limits]
- **Triệu chứng (Symptoms):**
  1. Khi người dùng nhập "hello" (không liên quan đến thời trang), AI phản hồi đúng từ chối, nhưng UI hiển thị dưới dạng một "Outfit Card" (Thẻ trang phục) có tên "Chủ đề Không Hỗ Trợ" kèm theo nút "Thử Đồ Toàn Set".
  2. Nếu AI gợi ý 3 món đồ (ví dụ: Áo + Quần + Phụ kiện), tính năng VTON đa bước có thể bị hỏng nếu gửi một loại món đồ mà AI Model (CatVTON) không hỗ trợ (chỉ hỗ trợ upper_body, lower_body, dress).
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **UI Intent Guardrail:** API `stylist.py` trả về thông báo từ chối dưới dạng một mảng `options` giả (mock option). `ChatBox.tsx` mặc định thấy có `options` là lập tức lặp qua và render ra `OutfitCard.tsx`.
  2. **VTON Item Limits:** Trong `OutfitCard.tsx`, mảng `garmentsToProcess` được đẩy tất cả mọi item có thumbnail, dẫn đến việc các phụ kiện hoặc giày cũng bị gửi lên luồng VTON.
- **Giải pháp (Resolution):**
  1. **Sửa API và UI Guardrail:** Sửa `stylist.py` để trả về định dạng `{"refusal": True, "message": refusal}` thay vì trả mảng `options`. Sửa `route.ts` để forward trạng thái này. Sửa `ChatBox.tsx` để hiển thị `data.refusal` thành tin nhắn văn bản thông thường (text message) của Assistant, tránh kích hoạt render Card.
  2. **Filter VTON Input:** Cập nhật `OutfitCard.tsx` để lọc (filter) mảng `garmentsToProcess`, chỉ đẩy lên `startMultiStepTryOn` các item có `clothing_type` thuộc danh sách cho phép là `['upper_body', 'lower_body', 'dress']`. Thêm thông báo Alert thân thiện nếu không có món nào hợp lệ.
- **Bài học (Lessons Learned):**
  Các luồng rẽ nhánh báo lỗi/từ chối từ AI (Guardrails) cần có chuẩn dữ liệu riêng biệt với luồng dữ liệu bình thường, không nên ép kiểu (mockup data) để tránh UI phải phỏng đoán và sinh ra các thành phần giao diện thừa thãi. Đối với các tác vụ gọi Model nặng (Vision), bắt buộc phải có whitelist filter ở Frontend trước khi gọi API để tránh phí tài nguyên cho các input không hợp lệ.

## [2026-05-20] - [CatVTON Garment Length Alteration due to Background Removal]
- **Triệu chứng (Symptoms):**
  CatVTON sinh ảnh bị thay đổi độ dài trang phục so với ý muốn. Cụ thể, khi người dùng đang mặc quần dài nhưng tải lên quần ngắn để thử, mô hình CatVTON tự động kéo giãn quần ngắn thành quần dài.
- **Nguyên nhân gốc rễ (Root Cause):**
  Việc sử dụng công cụ cắt nền (Background Removal) trước khi truyền ảnh trang phục vào CatVTON làm mất đi các thông tin bao cảnh xung quanh viền áo/quần. Điều này khiến mô hình VTON không nhận diện được chính xác tỷ lệ và độ dài gốc của trang phục, dẫn đến việc bị ảnh hưởng bởi hình khối (silhouette) của trang phục gốc trên người mặc (ví dụ: chân đang mặc quần dài).
- **Giải pháp (Resolution):**
  Loại bỏ hoàn toàn bước xóa nền (`removeBackground`) trong API upload trang phục (`POST /v1/user/garments`). Hệ thống chỉ dùng `sharp` để chuẩn hóa định dạng ảnh gốc sang PNG tiêu chuẩn nhằm cung cấp tối đa bối cảnh cho mô hình CatVTON tự nội suy.
- **Bài học (Lessons Learned):**
  Các mô hình AI sinh ảnh thế hệ mới (như CatVTON, Diffusion) thường có khả năng phân tích hình ảnh tổng thể cực tốt. Việc can thiệp tiền xử lý (như xóa nền, làm mờ) đôi khi mang lại tác dụng ngược (phá hủy dữ liệu context của AI). Hãy luôn truyền ảnh nguyên bản nhất có thể cho các mô hình này thay vì cố gắng tinh chỉnh bằng thuật toán cổ điển.
