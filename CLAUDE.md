# BocBox – Tiệm quà meme (EXE101, SE1986)

Dự án khởi nghiệp sinh viên. Một mình chủ dự án (Dũng) code và quyết định kỹ thuật. Trả lời và viết comment bằng tiếng Việt.

## Mô hình kinh doanh (đã chốt, đừng tự đổi)
- Bán **một box duy nhất 350.000đ**: 1 áo phông in meme (người tặng **tự custom** trên web, hoặc chọn **mẫu shop thiết kế sẵn** rồi sửa chữ/màu) + 1 **"khô gấu"** = móc khóa thú bông dẹt in ảnh meme (mẫu nhóm chọn: Doge chiến binh cầm kiếm và khiên), **random** trong series 6 mẫu. Đóng trong hộp kraft thắt nơ, lót giấy rơm (cập nhật 30/10/2026).
- Trang chủ (`pages/Home.tsx`) đã gộp phần "Trong hộp" cũ (05/11/2026, bỏ `BoxPage.tsx`, `/box` chuyển về `/`): hero → dải meme → mở hộp → áo (tự custom / `SHOP_DESIGNS`) → khô gấu → bao bì, tag, thiệp → 4 bước + lịch đợt → FAQ → tham khảo thị trường → CTA. Ảnh tham khảo trong `frontend/public/products/` (Lazada, có link nguồn; `kho-gau-nhom.webp` là ảnh nhóm gửi).
- Chọn mẫu shop (trang chủ, `/shop`) đi qua `applyTemplate` (`lib/draft.ts`): đang có bản thiết kế dở thì hỏi trước, không chọn mẫu khác thì nháp giữ nguyên.
- Trang `/shop` (`pages/Shop.tsx`, dữ liệu `lib/readyBoxes.ts`): kệ 12 hộp có sẵn kiểu thẻ vuông (tham khảo thecurator.vn), áo đã thiết kế, khô gấu hiện mờ (bí mật). "Chọn hộp này" ghi nháp rồi mở Xưởng in ở bước Tag & thiệp.
- Series khô gấu (6 mẫu, slug `chien-binh`, `mat-doge`, `meo-banh-mi`, `meo-meme`, `sinh-vat-nguyen`, `bo-dong-co`) định nghĩa ở `frontend/src/lib/khoGau.ts` (tên, ảnh, nguồn) và phải khớp bảng `keychain_designs` trong `backend/sql/bocbox-full.sql`. Hiển thị bằng `KhoGauPhoto` (kệ trang chủ, mascot, tồn kho Admin).
- **Không bán item thêm.** Yêu cầu ngoài công cụ thiết kế → khách liên hệ Zalo/Messenger, báo giá riêng.
- **Pre-order theo đợt tuần**: mở thứ Hai, đóng Chủ nhật 23:59 (Asia/Ho_Chi_Minh), in thứ Hai–Tư, đóng hộp thứ Năm, giao thứ Năm–Sáu tuần sau. Khách trả trước 100% (VietQR, nội dung chuyển khoản = mã đơn).
- Trải nghiệm đi kèm: **form ngụy trang** (Google Form mẫu để hỏi size/sở thích người nhận mà không lộ quà), **author tag** "Thiết kế bởi … dành cho …", **thiệp** (cập nhật 01/11/2026).
  - **Author tag** = nhãn vải cotton mộc in mực nâu, gập hai đầu, **may ngoài áo ở gấu áo phía trước** (không phải thẻ treo).
  - **Thiệp kraft 15×10 cm**, 3 kiểu (`cardStyle`): `SPY` thiệp điệp viên (dấu TUYỆT MẬT + lời thú tội của form đã dùng), `MEME` (in meme đầu tiên trên áo), `PLAIN` (kraft trơn). Lời nhắn (`cardMessage`, ≤300 ký tự) khách tự viết hoặc bấm gợi ý theo meme (`lib/cardIdeas.ts`). Lời nhắn đi qua hàng chờ duyệt cùng chữ in áo.
- Custom áo miễn phí, chỉ trong vùng in cố định mặt trước A4 (giữ giá vốn ~205.000đ/box).

## Meme và ảnh áo
- Quyết định của chủ dự án (30/10/2026): bản demo môn học **dùng ảnh meme gốc tải từ mạng** (template Imgflip), không cần sàng lọc bản quyền. Nếu bán thật thì phải xem lại.
- Ảnh meme in áo: `frontend/public/memes/{slug}.jpg` (20 meme). Slug phải khớp bảng `memes` trong `backend/sql/bocbox-full.sql`.
- Mockup áo: ảnh áo trắng thật `frontend/public/mockup/tee-white.png` (THOR, Wikimedia Commons, CC BY 2.0, ghi nguồn ở footer). Màu áo khác được nhuộm bằng canvas trong `art.ts` (`drawTee`). Vùng in đo theo tỉ lệ ảnh, xem `PRINT_BOX`. Tag vải vẽ ở `TAG_SPOT` khi truyền `tag` cho `TeePreview`/`TeeEditor`.
- Thiết kế áo = 1–4 lớp meme `{slug,x,y,w}` + khối chữ `{x,y,s}`, tọa độ theo tỉ lệ vùng in, lưu ở `layoutJson` của đơn (kiểm tra ở `OrderService.applyLayout`). Đơn cũ không có bố cục được đổi bằng `withLayout`.
- Tag vải và thiệp kraft vẽ bằng canvas trong `lib/paper.ts` (`drawLabel`, `drawCard`; sợi vải, giấy kraft, mực in có seed nên ổn định). Component `AuthorTag`, `GiftCard` trong `components/Cards.tsx`; nền "mở hộp" `.flatlay` dùng ảnh giấy rơm thật `products/giay-rom.jpg`.
- Khô gấu và mascot dùng ảnh thật (`KhoGauPhoto`).

## Công nghệ
- `frontend/`: React 18 + Vite + TypeScript, react-router (HashRouter), Framer Motion, canvas-confetti, icon `@phosphor-icons/react` (MIT). CSS thuần trong `src/styles.css`.
  - `npm run dev` → nối backend `VITE_API_URL` (mặc định http://localhost:8080/api/v1). **Không còn API giả lập** (đã bỏ `mockApi.ts`, `.env.demo`, `dev:mock` ngày 04/11/2026): frontend luôn cần backend + SQL Server.
- `backend/`: Java 21, Spring Boot 3.3.5 (Web, Data JPA, Validation, Scheduling, Security), Maven.
  - **Cấu trúc package `com.bocbox`** (tái cấu trúc 06/11/2026, trước là `com.bocbox.demo` với `domain/repo/service/web`):
    `config/` (SecurityConfig, CorsConfig, `BocboxProperties` = toàn bộ `bocbox.*` trong application.yml) ·
    `security/` (JwtConfig, JwtTokenService, LoginThrottle) · `controller/` (Public, Auth, Customer, Upload, AdminOrder, AdminBatch, AdminCatalog, AdminReport, Staff) ·
    `service/` (Order, Batch, Catalog, CustomerAccount, StaffAccount, Image, Payment, Report, SizeSuggestion, ContentFilter) · `repository/` ·
    `entity/` + `entity/enums/` (field private + getter/setter, không Lombok) · `dto/request`, `dto/response`, `dto/OrderLayout` · `mapper/` (entity → response) ·
    `exception/` (`AppException` + `ErrorType`, `GlobalExceptionHandler` đổi sang mã HTTP, body `{"message": ...}`) · `web/filter/RequestLogFilter`.
  - Quy ước: controller chỉ nhận request, gọi service, map sang DTO; service không ném lỗi HTTP (dùng `AppException`); API không trả entity trực tiếp.
  - Test: `src/test/java/com/bocbox` (luồng trạng thái đơn, lọc từ cấm, nhận diện ảnh, gợi ý size), chạy `mvnw test`. Profile `docker` (`application-docker.yml`) bật `forward-headers-strategy` khi chạy sau nginx.
  - **Chỉ dùng SQL Server** (đã bỏ H2 ngày 01/11/2026). Chuỗi lưu `nvarchar` (`hibernate.use_nationalized_character_data`). DB `bocbox` collation `Vietnamese_100_CI_AS`, tài khoản `bocbox_app`.
  - Mật khẩu DB, JWT secret nằm trong `backend/config/bocbox-local.yml` (**không commit**, có trong `.gitignore`; mẫu `config/bocbox-local.example.yml`), được nạp qua `spring.config.import`. Biến môi trường cùng tên (`DB_PASSWORD`, `JWT_SECRET`…) vẫn dùng được.
  - **Cấu trúc bảng + toàn bộ dữ liệu nằm trong một script tổng `backend/sql/bocbox-full.sql`** (10 bảng, có `customers`, `custom_images`; 24 tài khoản khách mẫu `0901000001`…`0901000024`, mật khẩu `Bocbox@2026`) (04/11/2026, thay `create-db.sql`, `create-db-sa.sql`, `DataSeeder`, `DemoDataSeeder`). Script xóa DB `bocbox`, tạo lại DB + login `bocbox_app` (`@AppPassword` ở mục 2) + 8 bảng + dữ liệu: danh mục, 2 tài khoản `admin`/`nhanvien` (mật khẩu `Bocbox@2026`, BCrypt), 5 đợt tính theo thứ Hai của tuần chạy script (đợt cuối đang mở) và 55 đơn mẫu.
    - Backend để `ddl-auto: none`: Hibernate không tạo/sửa bảng, không nạp dữ liệu. **Đổi entity trong `entity/` thì sửa mục 3 của script cho khớp** (tên cột theo snake_case, chuỗi `nvarchar`, thời gian `datetime2(6)`).
    - Script được sinh bằng cách port logic seeder cũ (Java `Random(20261031)`); trạng thái đơn mẫu chụp theo ngày 04/11/2026.
  - **Khách vãng lai (guest) làm được mọi thứ trừ đặt đơn** (05/11/2026). Bấm đặt hộp khi chưa đăng nhập → popup đăng nhập/đăng ký (`lib/auth.tsx`, `requireLogin()`), xong thì đặt tiếp luôn, thiết kế không mất.
    - Tài khoản khách: bảng `customers`, đăng nhập bằng **SĐT + mật khẩu** (BCrypt), JWT role `CUSTOMER`, subject `customer:{id}`, hạn 30 ngày (`bocbox.jwt.customer-ttl-days`). API trong `controller/CustomerController.java` (nghiệp vụ ở `service/CustomerAccountService`, `ImageService`, `PaymentService`) dưới `/api/v1/customer/**` (register, login, me, orders, uploads). Phiên phía trình duyệt: `lib/customer.ts` (tách với phiên nhân viên `lib/session.ts`).
    - "Đơn của tôi" (`/my-orders`, `pages/MyOrders.tsx`) thay cho tra đơn bằng mã + 4 số cuối SĐT (đã bỏ `Lookup.tsx` và header `X-Phone-Last4`). Khách chỉ xem/sửa/hủy được đơn của chính tài khoản mình.
    - Nút Đăng nhập / menu tài khoản ở góc phải thanh trên; "Thiết kế ngay" là mục nổi bật cuối menu (`App.tsx`).
  - **Luật duyệt đơn**: đơn mới = `PENDING_APPROVAL` (Chờ duyệt). Quản trị duyệt thiết kế (chữ, ảnh tải lên, lời nhắn) → `PENDING_PAYMENT`, lúc đó khách mới thấy mã VietQR. "Cần sửa" → `NEEDS_EDIT` + ghi chú, khách sửa ở `/build?edit=MÃ` rồi đơn quay lại chờ duyệt. "Từ chối" → `CANCELLED` kèm lý do. Đơn chờ duyệt không tính doanh thu, không bốc khô gấu (`OrderStatus.isPaid()`).
  - **Ảnh khách tải lên**: lúc thiết kế giữ trong nháp dạng data URL (slug `local:{id}`, đã thu nhỏ ≤ 1400 px); bấm đặt thì gửi `POST /customer/uploads` → slug `u:{uuid}`, lưu trong bảng `custom_images` (varbinary, ≤ 3 MB, nhận diện PNG/JPG/WEBP theo byte đầu). Ảnh xem công khai ở `GET /api/v1/uploads/{uuid}` (có CORS để canvas xuất file in). Ảnh đi qua duyệt cùng đơn.
  - Xưởng in mở ra là **áo trơn** (chưa meme, chưa chữ) nếu chưa chọn mẫu; áo phải có ít nhất 1 meme/ảnh hoặc 1 dòng chữ mới đặt được.
  - Đăng nhập quản trị: Spring Security + JWT HS256 (`config/SecurityConfig.java`, `security/JwtConfig.java`, `security/JwtTokenService.java` cấp token cho cả nhân viên và khách; `POST /api/v1/auth/login`, token 12 giờ). Bảng `staff_users` (BCrypt), role STAFF (xử lý đơn, kho) và ADMIN (thêm chốt đợt, báo cáo, ẩn/hiện meme, quản lý nhân viên `/admin/staff`).
    - Token chỉ hợp lệ khi tài khoản còn hoạt động và đúng quyền (validator trong `jwtDecoder`): khóa nhân viên là có hiệu lực ngay.
    - `LoginThrottle`: sai 5 lần theo tên đăng nhập (20 lần theo IP) → khóa 15 phút (HTTP 429). `POST /auth/password` tự đổi mật khẩu.
    - Frontend giữ phiên trong `lib/session.ts`.
  - Bộ lọc từ cấm `ContentFilter` so khớp **giữ dấu** (bỏ dấu sẽ gắn cờ nhầm "ngủ", "lớn").
  - Mã đơn: `BB` + yyMMdd + 4 ký tự ngẫu nhiên. Luồng trạng thái: `OrderStatus.next()` (Java) = `NEXT_STATUS` (TS); chờ thanh toán và in chỉ được khi nội dung đã duyệt.
- Môi trường: Windows, PowerShell. Giai đoạn 1 chỉ chạy localhost, **chưa deploy**.

## Giao diện "Xưởng quà kraft" (làm lại 01/11/2026)
- Chủ dự án thấy giao diện cũ (caro xanh, viền navy dày, emoji 3D) "có phong cách AI" nên đổi: nền giấy ngà có thớ, chữ mực nâu `--ink #2e2822`, cam BocBox `#F47A3A` làm màu nhấn, phụ màu kraft / xô thơm / hồng đất. Viền mảnh 1px, bóng mềm, không dùng bóng lệch kiểu sticker. Token màu ở `:root` trong `styles.css`.
- Font: **Fraunces** (tiêu đề), **Be Vietnam Pro** (chữ thường), **Patrick Hand** (chữ viết tay trên tag/thiệp), **Baloo 2** chỉ còn là font in áo.
- Icon: component `Icon` trong `components/Fun.tsx` (Phosphor, nét duotone); tên icon cũ kiểu emoji được ánh xạ trong `ICONS`. Đã bỏ Fluent Emoji, hạt cườm, dây cờ.
- Thanh trên: logo · Trang chủ · Hộp có sẵn · Phòng điệp viên · Đơn của tôi · [Thiết kế ngay] · tài khoản (góc phải). Xưởng in: 5 bước (stepper), nháp tự lưu `localStorage['bocbox:draft']` (`lib/draft.ts`, gồm kiểu thiệp, lời nhắn, ảnh tự tải lên), có nút "Làm lại từ áo trơn". Màn "Đợi chút!" chỉ hiện lần đầu mỗi phiên.
- **Khu quản trị** `#/admin` (`pages/admin/`): khung riêng có thanh bên tối (không dùng đầu/chân trang bán hàng), gọn, không hiệu ứng. Các màn: Tổng quan (việc cần làm, doanh thu theo đợt), Đơn hàng (lọc + chi tiết + duyệt/chuyển trạng thái), Đợt & xưởng in (bảng màu × size, bốc khô gấu, in tag & thiệp, chốt đợt), Kho khô gấu, Thư viện meme, Nhân viên (ADMIN), Tài khoản (đổi mật khẩu). Link vào ở footer "Nhân viên đăng nhập".

## Trạng thái hiện tại (01/11/2026)
- 05/11/2026: thêm tài khoản khách (guest xem/thiết kế tự do, đặt đơn mới cần đăng nhập), "Đơn của tôi", luật duyệt đơn trước khi thanh toán, tải ảnh lên in áo, gộp trang chủ + "Trong hộp", xưởng in mở ra áo trơn. Phải chạy lại `bocbox-full.sql`.
- 04/11/2026: bỏ mock data và seeder, DB dựng lại bằng `backend/sql/bocbox-full.sql`.
- Backend chạy với SQL Server trên máy (localhost:1433), đã nạp dữ liệu demo; bộ kiểm thử API quản trị (đăng nhập, nhân viên, khóa đăng nhập, kho, meme, thiệp) đạt.
- Frontend: đã chạy toàn luồng với backend thật (kệ hộp → Xưởng in → thiệp/tag → đặt đơn) và khu quản trị (trước đây chạy ở chế độ mock, nay chỉ còn backend thật).
  - Máy không có `mvn` trong PATH; dùng `C:\Users\Admin\.m2\wrapper\dists\apache-maven-3.10.0-bin\...\bin\mvn.cmd`.
  - Maven báo lỗi PKIX khi tải thư viện → đặt `$env:MAVEN_OPTS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"` trước khi build.
  - CORS chỉ cho phép `CORS_ORIGINS` (mặc định :5173). Nếu Vite chạy cổng khác thì đặt thêm biến này.
- Chưa thử: kéo thả bằng tay trên điện thoại thật; in tag/thiệp ra giấy thật.

## Việc tiếp theo (theo thứ tự)
1. Flyway thay script tay `bocbox-full.sql`.
2. Cấu hình tài khoản ngân hàng thật cho VietQR; link Google Form thật cho 3 mẫu form ngụy trang.
3. Email xác nhận đơn và nhắc dịp tặng (trước 14 ngày).
4. Thêm ảnh chụp thật tag vải/thiệp khi nhóm làm mẫu (hiện là ảnh dựng bằng canvas).

## Tài liệu liên quan
- Report CP3 (BMC) và kịch bản thuyết trình nằm ngoài repo này.
- Kế hoạch kỹ thuật: tài liệu "BocBox – Kế hoạch xây dựng website (React · Spring Boot · SQL Server)".
