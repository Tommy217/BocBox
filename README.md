# BocBox – Demo "Tiệm quà meme" (giai đoạn 1, chạy localhost)

Box quà meme: 1 áo tự thiết kế (hoặc mẫu shop) + 1 khô gấu random + author tag vải + thiệp kraft, pre-order theo đợt tuần, giá 350.000đ.

| Phần | Công nghệ | Thư mục |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript, Framer Motion, Phosphor Icons | `frontend/` |
| Backend | Java 21, Spring Boot 3.3 (Web, Data JPA, Validation, Scheduling, Security + JWT) | `backend/` |
| Database | MongoDB (Atlas khi deploy, `mongodb://localhost:27017/bocbox` trên máy), database `bocbox` | `backend/db/` |

## Cài lần đầu (máy mới)

1. Tạo database `bocbox` với toàn bộ collection, index và dữ liệu bằng **một script tổng** `backend/db/bocbox-full.mongodb.js`:
   - MongoDB Compass: kết nối tới Atlas (hoặc `mongodb://localhost:27017`), mở tab **MONGOSH** ở cuối màn hình, dán cả file rồi Enter.
   - Hoặc mongosh:

   ```powershell
   mongosh "<chuỗi kết nối, không cần tên database>" --file backend\db\bocbox-full.mongodb.js
   ```

   Script xóa database `bocbox` cũ rồi tạo lại từ đầu: 20 meme, 4 màu áo, bảng size, 3 form ngụy trang, 6 mẫu khô gấu, 2 tài khoản quản trị `admin` / `nhanvien` (mật khẩu `Bocbox@2026`, đăng nhập xong đổi ngay), 24 tài khoản khách mẫu `0901000001`…`0901000024` (mật khẩu `Bocbox@2026`; `0901000002` có đơn đã duyệt chờ thanh toán, `0901000020` có đơn bị báo cần sửa), 5 đợt (4 tuần trước + tuần đang mở) và 55 đơn mẫu. Muốn về dữ liệu ban đầu thì chạy lại script này (tắt backend trước).

2. Chép `backend/config/bocbox-local.example.yml` thành `backend/config/bocbox-local.yml` và điền chuỗi kết nối MongoDB (`.../bocbox?...`), JWT secret (≥ 32 ký tự). File này **không commit**.

## Chạy hằng ngày – 2 cửa sổ PowerShell

```powershell
# Cửa sổ 1: backend (không tự nạp dữ liệu: phải chạy bocbox-full.mongodb.js trước)
cd backend
mvn spring-boot:run          # hoặc Run BocboxApplication trong IntelliJ (working directory = backend)

# Cửa sổ 2: frontend
cd frontend
npm install
npm run dev                  # mở http://localhost:5173
```

Trang quản trị: `http://localhost:5173/#/admin` (link "Nhân viên đăng nhập" ở cuối trang).

## Luồng demo gợi ý (5 phút)

1. **Trang chủ / Hộp có sẵn** → xem hộp, chọn một mẫu (khô gấu là bí mật). Chưa cần đăng nhập.
2. **Phòng điệp viên** → chọn mẫu form ngụy trang, nhập 165 cm / 55 kg → gợi ý size.
3. **Thiết kế ngay** → áo trơn: thêm meme hoặc **tải ảnh từ máy**, sửa câu đùa, đổi màu → Tag & thiệp → Giao hàng → "Đăng nhập & bỏ vào hộp": popup đăng nhập/đăng ký bằng SĐT, đăng nhập xong đơn được gửi luôn.
4. **Đơn của tôi** → đơn "Chờ duyệt"; quản trị duyệt xong mới hiện mã VietQR (nội dung chuyển khoản = mã đơn). Bị "Cần sửa" thì bấm Sửa thiết kế.
5. **Quản trị** → Đơn hàng: "Duyệt, nhận đơn" / "Cần sửa" / "Từ chối" → "Đã nhận tiền" → Đợt & xưởng in: bảng màu × size, bốc khô gấu, in tag & thiệp, file in PNG → Nhân viên: thêm/khóa tài khoản.

## API chính (`http://localhost:8080/api/v1`)

Công khai (khách vãng lai): `GET /memes` · `GET /shirt-colors` · `GET /sizes` · `GET /spy-forms` · `GET /keychain-series/current` · `POST /size-suggestions` · `GET /batches/open` · `GET /uploads/{uuid}`

Tài khoản khách: `POST /customer/register` · `POST /customer/login` · (JWT khách) `GET|PUT /customer/me` · `POST /customer/password` · `GET|POST /customer/orders` · `GET|PUT /customer/orders/{code}` · `POST /customer/orders/{code}/cancel` · `GET /customer/orders/{code}/payment-qr` · `POST /customer/uploads` (multipart `file`)

Đăng nhập nhân viên: `POST /auth/login` · `GET /auth/me` · `POST /auth/password`

Quản trị (JWT): `GET /admin/batches` · `POST /admin/batches/close-current` · `GET /admin/orders?batchId=&status=&q=` · `GET /admin/orders/{code}` · `GET /admin/batches/{id}/summary` · `POST /admin/orders/{code}/confirm-payment` · `PATCH /admin/orders/{code}/content-review` · `PATCH /admin/orders/{code}/status` · `POST /admin/batches/{id}/assign-keychains` · `GET|PATCH /admin/keychains` · `GET|PATCH /admin/memes` · `GET /admin/reports/summary` · `GET|POST|PUT /admin/staff` · `POST /admin/staff/{id}/reset-password`

## Việc còn lại trước khi bán thật

- Thay số tài khoản ngân hàng thật (`BANK_ID`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME`).
- Google Form thật: kịch bản 1 và 2 đã gắn link (01/11/2026), kịch bản 3 "CLB bình chọn meme" còn thiếu (cột `google_form_copy_url` trong `spy_form_templates`).
- Ảnh meme đang lấy từ template Imgflip (chỉ cho demo môn học); bán thật phải xem lại bản quyền. Ảnh hộp/bao bì là ảnh tham khảo từ Lazada.
- Script migration thay cho script tay `bocbox-full.mongodb.js`, email xác nhận, nhắc dịp tặng.
