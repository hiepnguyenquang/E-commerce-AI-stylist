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

## [2026-05-13] - [AI Stylist Logic Flaws: Item-level VTON and Duplicate Options]
- **Triệu chứng (Symptoms):**
  1. Trong giao diện kết quả AI Stylist, mỗi món đồ trong một bộ đồ (Outfit Option) đều có nút "Thử VTON" riêng lẻ. Điều này đi ngược lại với logic trải nghiệm vì người dùng muốn thử toàn bộ trang phục của set đồ đó cùng lúc.
  2. AI đôi khi gợi ý 2 Option (Set đồ) giống hệt nhau về cả phong cách lẫn sản phẩm, gây lãng phí không gian hiển thị và giảm chất lượng tư vấn.
- **Nguyên nhân gốc rễ (Root Cause):**
  1. Nút VTON được đặt cứng trong vòng lặp `.map` render từng `OutfitItem` thay vì ở cấp độ `OutfitOption`. Đồng thời nó gọi hàm `startTryOn` (chỉ hỗ trợ ghép 1 ảnh) thay vì `startMultiStepTryOn` (hỗ trợ ghép cả bộ).
  2. Câu lệnh Prompt điều khiển LLM trong `llm_client.py` chưa có ràng buộc yêu cầu sự đa dạng (diversity) giữa các lựa chọn được sinh ra. LLM tự động lấy các sản phẩm tốt nhất từ Pool và do không bị cấm, nó tạo ra các Option trùng lặp.
- **Giải pháp (Resolution):**
  1. Tại `OutfitCard.tsx`: Xóa nút VTON ở từng món đồ. Thêm một nút "Thử Đồ (Toàn Set)" ở Header của thẻ Option. Nút này sẽ thu thập tất cả URL và suy luận loại trang phục (tops, bottoms, dress) dựa vào Tên (Title), sau đó gọi `startMultiStepTryOn(humanUrl, garments, 'modal')`.
  2. Tại `llm_client.py`: Bổ sung chỉ thị nghiêm ngặt vào Prompt: `"CÁC OPTION PHẢI KHÁC BIỆT NHAU: Tuyệt đối không được tạo ra 2 Option giống hệt nhau. Mỗi Option nên mang một phong cách (style) khác nhau hoặc sử dụng các món đồ chính khác nhau"`.
- **Bài học (Lessons Learned):**
  Khi thiết kế tính năng AI sinh nội dung (Generative UI), phải luôn dự đoán trường hợp AI lười biếng sinh ra nội dung trùng lặp. Prompt engineering cần có các quy tắc ràng buộc (constraints) rõ ràng về tính đa dạng của Output. Đối với luồng VTON đa bước (Mix & Match), cần đảm bảo Frontend có thể tự động phân loại đúng danh mục (category) của món đồ để gửi cho AI Worker xử lý mượt mà.
