-- =====================================================================
-- BocBox - SCRIPT TỔNG: xóa database cũ, tạo lại database, tài khoản SQL, toàn bộ bảng và dữ liệu.
-- Chạy lại bất cứ lúc nào để về trạng thái ban đầu (MẤT HẾT dữ liệu đang có trong bocbox).
--
-- Cách chạy:
--   SSMS: đăng nhập sa (hoặc Windows Authentication), mở file này, sửa @AppPassword ở mục 2, bấm Execute.
--   PowerShell: sqlcmd -S localhost -U sa -P <mật khẩu sa> -C -f 65001 -i sql\bocbox-full.sql
--               (-f 65001 để sqlcmd đọc đúng tiếng Việt UTF-8)
--
-- Backend không tự tạo bảng hay nạp dữ liệu nữa (ddl-auto: none, đã bỏ DataSeeder/DemoDataSeeder):
-- muốn đổi cấu trúc bảng thì sửa entity trong domain/ VÀ sửa mục 3 của file này cho khớp.
-- Tài khoản quản trị sau khi chạy: admin / Bocbox@2026 và nhanvien / Bocbox@2026.
-- Tài khoản khách mẫu (đăng nhập bằng SĐT ở nút "Đăng nhập" góc phải): 0901000001 … 0901000024, mật khẩu Bocbox@2026.
-- =====================================================================

-- 1. DATABASE ---------------------------------------------------------
USE master;
GO
IF DB_ID('bocbox') IS NOT NULL
BEGIN
    ALTER DATABASE bocbox SET SINGLE_USER WITH ROLLBACK IMMEDIATE;  -- ngắt các kết nối đang mở (backend, SSMS)
    DROP DATABASE bocbox;
END
GO
CREATE DATABASE bocbox COLLATE Vietnamese_100_CI_AS;
GO

-- 2. TÀI KHOẢN SQL CHO BACKEND ------------------------------------------
-- Mật khẩu phải trùng spring.datasource.password trong backend/config/bocbox-local.yml.
DECLARE @AppPassword nvarchar(128) = N'DoiMatKhauNay@123';
DECLARE @sql nvarchar(max);
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'bocbox_app')
    SET @sql = N'CREATE LOGIN bocbox_app WITH PASSWORD = ' + QUOTENAME(@AppPassword, '''') + N', DEFAULT_DATABASE = bocbox, CHECK_POLICY = OFF;';
ELSE
    SET @sql = N'ALTER LOGIN bocbox_app WITH PASSWORD = ' + QUOTENAME(@AppPassword, '''') + N', DEFAULT_DATABASE = bocbox, CHECK_POLICY = OFF;';
EXEC (@sql);
GO
USE bocbox;
GO
CREATE USER bocbox_app FOR LOGIN bocbox_app;
ALTER ROLE db_owner ADD MEMBER bocbox_app;
GO

-- 3. BẢNG (khớp entity trong backend/src/main/java/com/bocbox/demo/domain) ----
-- Chuỗi dùng nvarchar để giữ dấu tiếng Việt; enum lưu dạng chữ (EnumType.STRING).

CREATE TABLE memes (
    id              bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_memes PRIMARY KEY,
    slug            nvarchar(50)  NOT NULL CONSTRAINT uk_memes_slug UNIQUE,
    name            nvarchar(100) NOT NULL,
    tags            nvarchar(200) NULL,
    screening_note  nvarchar(300) NULL,
    source_url      nvarchar(300) NULL,
    status          nvarchar(20)  NULL CONSTRAINT ck_memes_status CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED')),
    popularity      int           NOT NULL CONSTRAINT df_memes_popularity DEFAULT 0
);

CREATE TABLE shirt_colors (
    id      bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_shirt_colors PRIMARY KEY,
    name    nvarchar(50) NOT NULL,
    hex     nvarchar(7)  NOT NULL,
    active  bit          NOT NULL CONSTRAINT df_shirt_colors_active DEFAULT 1
);

CREATE TABLE sizes (
    id          bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_sizes PRIMARY KEY,
    code        nvarchar(5) NOT NULL,
    min_height  int NOT NULL,
    max_height  int NOT NULL,
    min_weight  int NOT NULL,
    max_weight  int NOT NULL,
    sort_order  int NOT NULL
);

CREATE TABLE spy_form_templates (
    id                    bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_spy_form_templates PRIMARY KEY,
    title                 nvarchar(150) NOT NULL,
    scenario              nvarchar(500) NULL,
    google_form_copy_url  nvarchar(500) NULL,
    confession_text       nvarchar(300) NULL
);

CREATE TABLE keychain_designs (
    id           bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_keychain_designs PRIMARY KEY,
    series_name  nvarchar(100) NOT NULL,
    name         nvarchar(100) NOT NULL,
    slug         nvarchar(50)  NOT NULL,
    stock_qty    int           NOT NULL CONSTRAINT df_keychain_designs_stock DEFAULT 0
);

CREATE TABLE staff_users (
    id             bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_staff_users PRIMARY KEY,
    username       nvarchar(50)  NOT NULL CONSTRAINT uk_staff_users_username UNIQUE,
    password_hash  nvarchar(100) NOT NULL,          -- BCrypt
    display_name   nvarchar(100) NULL,
    role           nvarchar(10)  NOT NULL CONSTRAINT ck_staff_users_role CHECK (role IN ('STAFF', 'ADMIN')),
    active         bit           NOT NULL CONSTRAINT df_staff_users_active DEFAULT 1,
    created_at     datetime2(6)  NULL,
    last_login_at  datetime2(6)  NULL
);

CREATE TABLE customers (
    id             bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_customers PRIMARY KEY,
    phone          nvarchar(15)  NOT NULL CONSTRAINT uk_customers_phone UNIQUE,   -- đăng nhập bằng SĐT
    password_hash  nvarchar(100) NOT NULL,          -- BCrypt
    full_name      nvarchar(100) NOT NULL,
    email          nvarchar(120) NULL,
    active         bit           NOT NULL CONSTRAINT df_customers_active DEFAULT 1,
    created_at     datetime2(6)  NULL,
    last_login_at  datetime2(6)  NULL
);

-- Ảnh khách tự tải lên để in áo; trên áo lớp ảnh có slug "u:{uuid}"
CREATE TABLE custom_images (
    id            bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_custom_images PRIMARY KEY,
    uuid          nvarchar(36)   NOT NULL CONSTRAINT uk_custom_images_uuid UNIQUE,
    customer_id   bigint         NOT NULL CONSTRAINT fk_custom_images_customer REFERENCES customers(id),
    content_type  nvarchar(30)   NOT NULL,
    size_bytes    int            NOT NULL,
    data          varbinary(max) NOT NULL,
    created_at    datetime2(6)   NULL
);

CREATE TABLE batches (
    id             bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_batches PRIMARY KEY,
    code           nvarchar(20) NOT NULL CONSTRAINT uk_batches_code UNIQUE,
    open_at        datetime2(6) NULL,
    close_at       datetime2(6) NULL,
    delivery_from  date         NULL,
    delivery_to    date         NULL,
    status         nvarchar(20) NULL CONSTRAINT ck_batches_status CHECK (status IN ('OPEN', 'CLOSED', 'PRINTING', 'SHIPPED'))
);

CREATE TABLE orders (
    id                bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_orders PRIMARY KEY,
    code              nvarchar(20)   NOT NULL CONSTRAINT uk_orders_code UNIQUE,
    created_at        datetime2(6)   NULL,
    status            nvarchar(30)   NULL CONSTRAINT ck_orders_status
                          CHECK (status IN ('PENDING_APPROVAL', 'PENDING_PAYMENT', 'PAID', 'PRINTING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REPRINT')),
    content_status    nvarchar(20)   NULL CONSTRAINT ck_orders_content_status
                          CHECK (content_status IN ('PENDING_REVIEW', 'FLAGGED', 'APPROVED', 'NEEDS_EDIT')),
    price             numeric(12,0)  NULL,
    giver_name        nvarchar(100)  NULL,
    recipient_name    nvarchar(100)  NULL,
    spy_template_id   bigint         NULL,          -- id trong spy_form_templates (không ràng buộc khóa ngoại, giống entity)
    meme_slug         nvarchar(50)   NULL,          -- lớp đầu tiên: slug meme hoặc u:{uuid} ảnh tải lên; NULL = áo chỉ có chữ
    color_name        nvarchar(50)   NULL,
    color_hex         nvarchar(7)    NULL,
    size_code         nvarchar(5)    NULL,
    text_line1        nvarchar(40)   NULL,
    text_line2        nvarchar(40)   NULL,
    font              nvarchar(40)   NULL,
    print_position    nvarchar(10)   NULL,          -- CHEST | CENTER
    layout_json       nvarchar(2000) NULL,          -- {"layers":[{slug,x,y,w}],"text":{x,y,s}}
    card_style        nvarchar(10)   NULL,          -- SPY | MEME | PLAIN
    card_message      nvarchar(400)  NULL,
    shipping_name     nvarchar(100)  NULL,
    shipping_phone    nvarchar(20)   NULL,
    shipping_address  nvarchar(300)  NULL,
    email             nvarchar(120)  NULL,
    batch_id          bigint         NULL CONSTRAINT fk_orders_batch REFERENCES batches(id),
    customer_id       bigint         NULL CONSTRAINT fk_orders_customer REFERENCES customers(id),
    keychain_design   nvarchar(100)  NULL,          -- tên mẫu khô gấu đã bốc
    carrier           nvarchar(30)   NULL,
    tracking_code     nvarchar(50)   NULL,
    review_note       nvarchar(300)  NULL
);
CREATE INDEX ix_orders_batch ON orders(batch_id, created_at);
CREATE INDEX ix_orders_customer ON orders(customer_id, created_at);
GO


USE bocbox;
GO

-- =====================================================================
-- 4. DỮ LIỆU
-- Ngày giờ tính theo thứ Hai của tuần đang chạy script, nên đợt cuối luôn là đợt đang mở.
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;
DECLARE @Now datetime2(6) = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time' AS datetime2(6));
DECLARE @Mon datetime2(6) = DATEADD(day, -(DATEDIFF(day, '19000101', CAST(@Now AS date)) % 7), CAST(CAST(@Now AS date) AS datetime2(6)));  -- 01/01/1900 là thứ Hai

-- 4.1 Meme (ảnh ở frontend/public/memes/{slug}.jpg)
INSERT INTO memes (slug, name, tags, popularity, source_url, screening_note, status) VALUES
  (N'surprised-pikachu', N'Pikachu ngạc nhiên', N'sốc', 95, N'https://imgflip.com/meme/Surprised-Pikachu', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'this-is-fine', N'This is fine', N'ổn,cháy', 90, N'https://imgflip.com/meme/This-Is-Fine', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'woman-yelling-at-cat', N'Chị la, mèo cãi', N'cãi,mèo', 88, N'https://imgflip.com/meme/Woman-Yelling-At-Cat', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'hide-the-pain-harold', N'Harold giấu nỗi đau', N'ổn,gượng', 85, N'https://imgflip.com/meme/Hide-the-Pain-Harold', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'monkey-puppet', N'Khỉ liếc ngang', N'ngại', 80, N'https://imgflip.com/meme/Monkey-Puppet', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'mocking-spongebob', N'SpongeBob nhại', N'cà khịa', 75, N'https://imgflip.com/meme/Mocking-Spongebob', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'roll-safe', N'Nghĩ thông minh', N'khôn', 70, N'https://imgflip.com/meme/Roll-Safe-Think-About-It', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'laughing-leo', N'Leo cười', N'cười', 65, N'https://imgflip.com/meme/Laughing-Leo', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'disaster-girl', N'Bé cháy nhà', N'cháy,cà khịa', 64, N'https://imgflip.com/meme/Disaster-Girl', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'leo-cheers', N'Leo nâng ly', N'chúc mừng', 63, N'https://imgflip.com/meme/Leonardo-Dicaprio-Cheers', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'kermit-tea', N'Kermit uống trà', N'kệ', 62, N'https://imgflip.com/meme/But-Thats-None-Of-My-Business', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'megamind-peeking', N'Megamind ngó', N'ngó', 61, N'https://imgflip.com/meme/Megamind-peeking', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'absolute-cinema', N'Absolute cinema', N'đỉnh', 60, N'https://imgflip.com/meme/Absolute-Cinema', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'they-dont-know', N'Họ đâu có biết', N'cô đơn', 59, N'https://imgflip.com/meme/They-dont-know', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'change-my-mind', N'Cãi đi', N'tranh luận', 58, N'https://imgflip.com/meme/Change-My-Mind', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'waiting-skeleton', N'Bộ xương chờ', N'chờ', 57, N'https://imgflip.com/meme/Waiting-Skeleton', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'ancient-aliens', N'Người ngoài hành tinh', N'giải thích', 56, N'https://imgflip.com/meme/Ancient-Aliens', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'futurama-fry', N'Fry nghi ngờ', N'nghi', 55, N'https://imgflip.com/meme/Futurama-Fry', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'squidward-window', N'Squidward nhìn trộm', N'ghen tị', 54, N'https://imgflip.com/meme/Squidward-window', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED'),
  (N'grandma-internet', N'Bà dùng mạng', N'ngơ', 53, N'https://imgflip.com/meme/Grandma-Finds-The-Internet', N'Ảnh meme gốc từ Imgflip, chỉ dùng cho demo môn học', N'APPROVED');

-- 4.2 Màu áo
INSERT INTO shirt_colors (name, hex, active) VALUES
  (N'Trắng', N'#FFFFFF', 1),
  (N'Đen', N'#1F1F1F', 1),
  (N'Be', N'#E8DCC4', 1),
  (N'Xanh pastel', N'#BFD7EA', 1);

-- 4.3 Bảng size (chiều cao cm, cân nặng kg)
INSERT INTO sizes (code, min_height, max_height, min_weight, max_weight, sort_order) VALUES
  (N'S', 0, 160, 0, 50, 1),
  (N'M', 160, 168, 50, 60, 2),
  (N'L', 168, 175, 60, 70, 3),
  (N'XL', 175, 182, 70, 82, 4),
  (N'XXL', 182, 220, 82, 150, 5);

-- 4.4 Google Form ngụy trang (id 1..3)
INSERT INTO spy_form_templates (title, scenario, confession_text, google_form_copy_url) VALUES
  (N'Khảo sát bài tập nhóm: thói quen ăn mặc của sinh viên', N'Hỏi size áo hay mặc, chiều cao, cân nặng, màu áo yêu thích, có treo móc khóa balo không. Gửi cho cả vài bạn khác để tự nhiên.', N'Cái khảo sát bài tập nhóm hôm trước là tớ bịa ra để hỏi size cậu đấy!', N'https://docs.google.com/forms/d/e/1FAIpQLSce6RaFC22XYvTwZ2-R6fYBmbFEdZaBvA6CaO8idicGJOdYlw/viewform'),
  (N'Đặt áo lớp / áo nhóm', N'Hỏi size và form (vừa/rộng) như đang gom size đặt áo nhóm.', N'Không có áo lớp nào đâu, áo này là của riêng cậu!', N'https://docs.google.com/forms/d/e/1FAIpQLSfAlfufsX5kdKTANW5k1rOm_AtEHHOl-glE1Au44UNm9RM3Yg/viewform'),
  (N'CLB bình chọn nhân vật meme cho sự kiện', N'Cho chọn meme con vật yêu thích trong 5 lựa chọn, hỏi kiểu hài thích nhất.', N'CLB không bình chọn gì cả, tớ chỉ muốn biết cậu thích meme nào thôi!', N'https://docs.google.com/forms/d/e/1FAIpQLScQJLj7dOP2IDVCl3UEDX8_FRjtsgPcF5u1du7iDJwoHoybTw/viewform');

-- 4.5 Khô gấu: tồn kho = 20 mỗi mẫu trừ số đã bốc cho các đơn mẫu bên dưới
INSERT INTO keychain_designs (series_name, name, slug, stock_qty) VALUES
  (N'Series 01 – Khô gấu meme', N'Doge chiến binh', N'chien-binh', 14),
  (N'Series 01 – Khô gấu meme', N'Mặt Doge', N'mat-doge', 13),
  (N'Series 01 – Khô gấu meme', N'Mèo bánh mì', N'meo-banh-mi', 15),
  (N'Series 01 – Khô gấu meme', N'Mèo meme kêu', N'meo-meme', 12),
  (N'Series 01 – Khô gấu meme', N'Sinh vật bị nguyền', N'sinh-vat-nguyen', 11),
  (N'Series 01 – Khô gấu meme', N'Bò đồng cỏ', N'bo-dong-co', 13);

-- 4.6 Tài khoản nhân viên. Mật khẩu ban đầu của cả hai: Bocbox@2026 (BCrypt). Đăng nhập xong đổi ngay.
INSERT INTO staff_users (username, password_hash, display_name, role, active, created_at) VALUES
  (N'admin', N'$2a$10$Ksolj.Xrz3hc5mLyZi9LZeFEeAfhU1k7RGBgQhLbQdV6HDWGuSwsK', N'Quản trị BocBox', N'ADMIN', 1, @Now),
  (N'nhanvien', N'$2a$10$6p/NPgpNq/GLbQwsZ.JOruxAVFozkbxEXBOKuQGK2bNXbrAlOTIHG', N'Nhân viên BocBox', N'STAFF', 1, @Now);

-- 4.6b Tài khoản khách mẫu: SĐT 0901000001…0901000024, mật khẩu chung Bocbox@2026. Mỗi tài khoản là một người tặng trong đơn mẫu.
DECLARE @CustomerHash nvarchar(100) = N'$2a$10$IwjZQzgSzlsX992BVP0Nae7Km8GkuH0I99pOPJe07HIT7iDmx6eU6';
INSERT INTO customers (phone, password_hash, full_name, email, active, created_at) VALUES
  (N'0901000001', @CustomerHash, N'Nguyễn Minh', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000002', @CustomerHash, N'Trần Huy', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000003', @CustomerHash, N'Lê Ngọc', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000004', @CustomerHash, N'Phạm Khoa', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000005', @CustomerHash, N'Hoàng Thảo', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000006', @CustomerHash, N'Vũ Phương', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000007', @CustomerHash, N'Nguyễn Tú', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000008', @CustomerHash, N'Trần Quân', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000009', @CustomerHash, N'Lê Mai', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000010', @CustomerHash, N'Phạm Hiếu', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000011', @CustomerHash, N'Hoàng An', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000012', @CustomerHash, N'Vũ Duy', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000013', @CustomerHash, N'Nguyễn Hoa', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000014', @CustomerHash, N'Trần Long', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000015', @CustomerHash, N'Lê Yến', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000016', @CustomerHash, N'Phạm Đạt', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000017', @CustomerHash, N'Hoàng Nhi', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000018', @CustomerHash, N'Vũ Trung', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000019', @CustomerHash, N'Nguyễn Giang', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000020', @CustomerHash, N'Trần Chi', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000021', @CustomerHash, N'Lê Vân', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000022', @CustomerHash, N'Phạm Bình', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000023', @CustomerHash, N'Hoàng Hùng', NULL, 1, DATEADD(week, -5, @Mon)),
  (N'0901000024', @CustomerHash, N'Vũ Lam', NULL, 1, DATEADD(week, -5, @Mon));

-- 4.7 Đợt pre-order: 4 tuần trước + tuần hiện tại (đang mở). Mở thứ Hai 00:00, đóng Chủ nhật 23:59:59, giao thứ Năm–Sáu tuần sau.
SET IDENTITY_INSERT batches ON;
INSERT INTO batches (id, code, open_at, close_at, delivery_from, delivery_to, status)
SELECT v.id, N'W' + FORMAT(o.open_at, 'yy') + RIGHT('0' + CAST(DATEPART(ISO_WEEK, o.open_at) AS varchar(2)), 2),
       o.open_at, DATEADD(second, -1, DATEADD(day, 7, o.open_at)),
       CAST(DATEADD(day, 10, o.open_at) AS date), CAST(DATEADD(day, 11, o.open_at) AS date), v.status
FROM (VALUES (1, -4, N'SHIPPED'), (2, -3, N'SHIPPED'), (3, -2, N'SHIPPED'), (4, -1, N'PRINTING'), (5, 0, N'OPEN')) v(id, wk, status)
CROSS APPLY (SELECT DATEADD(week, v.wk, @Mon) AS open_at) o;
SET IDENTITY_INSERT batches OFF;

-- 4.8 Đơn mẫu (55 đơn). code = BB + yyMMdd(ngày đặt) + 4 ký tự; created_at = giờ mở đợt + số phút.
-- Trạng thái chụp theo lịch tuần: đợt đang mở có đơn chờ duyệt / chờ thanh toán (đã duyệt) / đã thanh toán / đã hủy; đợt cũ đang in, đã giao.
DECLARE @o TABLE (batch_id bigint, mins int, suffix varchar(4), status nvarchar(30), content_status nvarchar(20), giver_name nvarchar(100), recipient_name nvarchar(100),
  spy_template_id bigint, meme_slug nvarchar(50), color_name nvarchar(50), color_hex nvarchar(7), size_code nvarchar(5), text_line1 nvarchar(40), text_line2 nvarchar(40),
  font nvarchar(40), layout_json nvarchar(2000), card_style nvarchar(10), card_message nvarchar(400), shipping_name nvarchar(100), shipping_phone nvarchar(20),
  shipping_address nvarchar(300), email nvarchar(120), keychain_design nvarchar(100), carrier nvarchar(30), tracking_code nvarchar(50), review_note nvarchar(300),
  customer_id bigint);
INSERT INTO @o VALUES
  -- đợt 1 (tuần -4)
  (1, 5731, 'HCZV', N'DELIVERED', N'APPROVED', N'Minh', N'Lan', NULL, N'surprised-pikachu', N'Trắng', N'#FFFFFF', N'L', N'Deadline là hôm nay', N'(tớ vẫn ổn)', N'Baloo 2', N'{"layers":[{"slug":"surprised-pikachu","x":0.32,"y":0.27,"w":0.6},{"slug":"waiting-skeleton","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Chúc cậu qua môn nhẹ nhàng, deadline nào cũng kịp!', N'Nguyễn Thị Lan', N'0318585266', N'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', NULL, N'Mặt Doge', N'GHTK', N'S726352171', NULL, 1),
  (1, 2883, 'T64G', N'DELIVERED', N'APPROVED', N'Huy', N'Trang', 1, N'this-is-fine', N'Be', N'#E8DCC4', N'M', N'Mọi thứ vẫn ổn', N'(không ổn)', N'Patrick Hand', N'{"layers":[{"slug":"this-is-fine","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Phạm Thu Trang', N'0336789504', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', N'huy67@gmail.com', N'Mặt Doge', N'GHTK', N'S430656502', NULL, 2),
  (1, 7979, 'AW98', N'DELIVERED', N'APPROVED', N'Ngọc', N'Bảo', NULL, N'woman-yelling-at-cat', N'Xanh pastel', N'#BFD7EA', N'XL', N'Tớ đúng', N'cậu sai', N'Baloo 2', N'{"layers":[{"slug":"woman-yelling-at-cat","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cãi nhau cả năm nhưng vẫn quý cậu nhất. Mặc áo này đi cãi tiếp nhé!', N'Lê Gia Bảo', N'0812692159', N'Lô E2a-7 Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh', NULL, N'Sinh vật bị nguyền', N'GHTK', N'S260659571', NULL, 3),
  (1, 9706, 'W3YG', N'DELIVERED', N'APPROVED', N'Khoa', N'Vy', NULL, N'hide-the-pain-harold', N'Đen', N'#1F1F1F', N'L', N'Sinh viên năm cuối', NULL, N'Be Vietnam Pro', N'{"layers":[{"slug":"hide-the-pain-harold","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Năm cuối rồi, cố lên! Tốt nghiệp xong tớ bao trà sữa.', N'Khoa (người tặng)', N'0360576651', N'Số 600 Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ', N'khoa39@gmail.com', N'Doge chiến binh', N'GHTK', N'S787529951', NULL, 4),
  (1, 1366, '7U65', N'DELIVERED', N'APPROVED', N'Thảo', N'Nam', 2, N'kermit-tea', N'Trắng', N'#FFFFFF', N'S', N'Chuyện của cậu', N'tớ chỉ uống trà', N'Baloo 2', N'{"layers":[{"slug":"kermit-tea","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Đỗ Hoài Nam', N'0358484890', N'Lô E2a-7 Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh', N'thao14@gmail.com', N'Mặt Doge', N'GHTK', N'S689009862', NULL, 5),
  (1, 3650, 'CK3H', N'DELIVERED', N'APPROVED', N'Phương', N'Đức', NULL, N'disaster-girl', N'Be', N'#E8DCC4', N'L', N'Tớ không làm gì cả', NULL, N'Baloo 2', N'{"layers":[{"slug":"disaster-girl","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Sinh nhật vui vẻ nha đồ phá hoại!', N'Vũ Minh Đức', N'0783436100', N'Số 9 Lê Lợi, Vĩnh Ninh, TP. Huế', NULL, N'Bò đồng cỏ', N'GHTK', N'S443878992', NULL, 6),
  (1, 8419, 'R8VE', N'DELIVERED', N'APPROVED', N'Tú', N'Linh', NULL, N'leo-cheers', N'Đen', N'#1F1F1F', N'M', N'Chúc mừng', N'cậu già thêm 1 tuổi', N'Baloo 2', N'{"layers":[{"slug":"leo-cheers","x":0.32,"y":0.27,"w":0.6},{"slug":"laughing-leo","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Tuổi mới chúc cậu ăn không béo, ngủ đủ 8 tiếng và mãi là bạn thân của tớ.', N'Hoàng Khánh Linh', N'0758570218', N'Số 7 Tạ Quang Bửu, Bách Khoa, Hai Bà Trưng, Hà Nội', N'tu83@gmail.com', N'Mèo meme kêu', N'GHTK', N'S729599833', NULL, 7),
  (1, 6208, '5X3M', N'DELIVERED', N'APPROVED', N'Quân', N'Hà', NULL, N'ancient-aliens', N'Trắng', N'#FFFFFF', N'L', N'Không giải thích được', N'do người ngoài hành tinh', N'Be Vietnam Pro', N'{"layers":[{"slug":"ancient-aliens","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Bùi Thanh Hà', N'0977918927', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', N'quan88@gmail.com', N'Mèo meme kêu', N'GHN', N'GH524780084', NULL, 8),
  (1, 278, 'V2D9', N'DELIVERED', N'APPROVED', N'Mai', N'Tuấn', 1, N'futurama-fry', N'Xanh pastel', N'#BFD7EA', N'XL', N'Không chắc là', N'cậu đang đùa', N'Baloo 2', N'{"layers":[{"slug":"futurama-fry","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', N'Mặc áo này đi học thứ Hai nhé, cả lớp sẽ biết là của tớ tặng.', N'Đặng Anh Tuấn', N'0360729031', N'Tòa B2 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội', N'mai32@gmail.com', N'Bò đồng cỏ', N'GHTK', N'S130313088', NULL, 9),
  -- đợt 2 (tuần -3)
  (2, 6562, '63XC', N'DELIVERED', N'APPROVED', N'Hiếu', N'My', 1, N'megamind-peeking', N'Trắng', N'#FFFFFF', N'M', N'Không quà à?', NULL, N'Baloo 2', N'{"layers":[{"slug":"megamind-peeking","x":0.32,"y":0.27,"w":0.6},{"slug":"squidward-window","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Có quà đây rồi, đừng ngó nữa!', N'Hiếu (người tặng)', N'0392134010', N'Số 25 Lạch Tray, Ngô Quyền, Hải Phòng', N'hieu79@gmail.com', N'Mèo bánh mì', N'GHTK', N'S159081508', NULL, 10),
  (2, 7320, '8RZG', N'DELIVERED', N'APPROVED', N'An', N'Khánh', 1, N'they-dont-know', N'Be', N'#E8DCC4', N'L', N'Họ đâu có biết', N'tớ có quà cho cậu', N'Patrick Hand', N'{"layers":[{"slug":"they-dont-know","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'An (người tặng)', N'0831285356', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', NULL, N'Mèo meme kêu', N'GHTK', N'S516840068', NULL, 11),
  (2, 6225, 'BRQX', N'DELIVERED', N'APPROVED', N'Duy', N'Thư', 1, N'absolute-cinema', N'Trắng', N'#FFFFFF', N'S', N'Cậu là', N'absolute cinema', N'Baloo 2', N'{"layers":[{"slug":"absolute-cinema","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cảm ơn vì đã là nhân vật chính trong mọi câu chuyện của nhóm mình.', N'Duy (người tặng)', N'0900751969', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', NULL, N'Sinh vật bị nguyền', N'GHTK', N'S199127624', NULL, 12),
  (2, 2081, '32NH', N'DELIVERED', N'APPROVED', N'Hoa', N'Sơn', 3, N'monkey-puppet', N'Trắng', N'#FFFFFF', N'L', N'Khi nghe chữ', N'“quà”', N'Baloo 2', N'{"layers":[{"slug":"monkey-puppet","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Lý Trường Sơn', N'0845453108', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', NULL, N'Mặt Doge', N'GHN', N'GH364550640', NULL, 13),
  (2, 727, '5KS8', N'DELIVERED', N'APPROVED', N'Long', N'Ngân', NULL, N'mocking-spongebob', N'Xanh pastel', N'#BFD7EA', N'L', N'tỚ kHôNg Có', N'dỖi ĐâU', N'Patrick Hand', N'{"layers":[{"slug":"mocking-spongebob","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Hết dỗi chưa? Hết rồi thì mặc áo vào đi ăn lẩu.', N'Dương Kim Ngân', N'0704661357', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', NULL, N'Sinh vật bị nguyền', N'GHN', N'GH397988459', NULL, 14),
  (2, 8282, '5ZB8', N'DELIVERED', N'APPROVED', N'Yến', N'Phúc', NULL, N'roll-safe', N'Be', N'#E8DCC4', N'L', N'Không thể trễ hạn', N'nếu không nộp bài', N'Be Vietnam Pro', N'{"layers":[{"slug":"roll-safe","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Hồ Hữu Phúc', N'0358859699', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', N'yen94@gmail.com', N'Mèo meme kêu', N'GHTK', N'S609475791', NULL, 15),
  (2, 7154, 'X6U9', N'DELIVERED', N'APPROVED', N'Đạt', N'Quỳnh', NULL, N'change-my-mind', N'Trắng', N'#FFFFFF', N'L', N'Trà sữa là chân ái', NULL, N'Baloo 2', N'{"layers":[{"slug":"change-my-mind","x":0.32,"y":0.27,"w":0.6},{"slug":"grandma-internet","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Một năm 365 ly trà sữa, tớ bao 1 ly kèm áo này.', N'Đạt (người tặng)', N'0785396582', N'Số 42 Nguyễn Văn Cừ, Phường 1, Quận 5, TP. Hồ Chí Minh', N'dat93@gmail.com', N'Bò đồng cỏ', N'GHTK', N'S968135534', NULL, 16),
  (2, 6144, 'NYTG', N'DELIVERED', N'APPROVED', N'Nhi', N'Kiên', NULL, N'surprised-pikachu', N'Trắng', N'#FFFFFF', N'S', N'Deadline là hôm nay', N'(tớ vẫn ổn)', N'Baloo 2', N'{"layers":[{"slug":"surprised-pikachu","x":0.32,"y":0.27,"w":0.6},{"slug":"waiting-skeleton","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Chúc cậu qua môn nhẹ nhàng, deadline nào cũng kịp!', N'Tạ Trung Kiên', N'0838749411', N'Lô E2a-7 Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh', NULL, N'Bò đồng cỏ', N'GHTK', N'S783745704', NULL, 17),
  (2, 4287, 'VMWY', N'DELIVERED', N'APPROVED', N'Trung', N'Hương', 2, N'this-is-fine', N'Be', N'#E8DCC4', N'XL', N'Mọi thứ vẫn ổn', N'(không ổn)', N'Patrick Hand', N'{"layers":[{"slug":"this-is-fine","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Cao Thu Hương', N'0800322988', N'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', N'trung80@gmail.com', N'Mèo bánh mì', N'GHTK', N'S402034514', NULL, 18),
  (2, 4837, '66NR', N'DELIVERED', N'APPROVED', N'Giang', N'Việt', 1, N'woman-yelling-at-cat', N'Xanh pastel', N'#BFD7EA', N'L', N'Tớ đúng', N'cậu sai', N'Baloo 2', N'{"layers":[{"slug":"woman-yelling-at-cat","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cãi nhau cả năm nhưng vẫn quý cậu nhất. Mặc áo này đi cãi tiếp nhé!', N'Lương Quốc Việt', N'0360652324', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', N'giang49@gmail.com', N'Doge chiến binh', N'GHN', N'GH510118754', NULL, 19),
  (2, 5870, 'QG9X', N'DELIVERED', N'APPROVED', N'Chi', N'Hải', NULL, N'hide-the-pain-harold', N'Đen', N'#1F1F1F', N'S', N'Sinh viên năm cuối', NULL, N'Be Vietnam Pro', N'{"layers":[{"slug":"hide-the-pain-harold","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Năm cuối rồi, cố lên! Tốt nghiệp xong tớ bao trà sữa.', N'Đinh Văn Hải', N'0832728791', N'Số 42 Nguyễn Văn Cừ, Phường 1, Quận 5, TP. Hồ Chí Minh', NULL, N'Doge chiến binh', N'GHN', N'GH857986518', NULL, 20),
  -- đợt 3 (tuần -2)
  (3, 6201, 'KA7Z', N'DELIVERED', N'APPROVED', N'Vân', N'Thắng', 2, N'kermit-tea', N'Trắng', N'#FFFFFF', N'S', N'Chuyện của cậu', N'tớ chỉ uống trà', N'Baloo 2', N'{"layers":[{"slug":"kermit-tea","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Kiều Đức Thắng', N'0837708874', N'Số 600 Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ', N'van31@gmail.com', N'Mèo bánh mì', N'GHN', N'GH550573763', NULL, 21),
  (3, 2464, '7SU7', N'DELIVERED', N'APPROVED', N'Bình', N'Uyên', 3, N'disaster-girl', N'Be', N'#E8DCC4', N'M', N'Tớ không làm gì cả', NULL, N'Baloo 2', N'{"layers":[{"slug":"disaster-girl","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Sinh nhật vui vẻ nha đồ phá hoại!', N'Tô Phương Uyên', N'0761484763', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', NULL, N'Mèo meme kêu', N'GHTK', N'S779257256', NULL, 22),
  (3, 9213, 'QF5S', N'DELIVERED', N'APPROVED', N'Hùng', N'Hạnh', NULL, N'leo-cheers', N'Đen', N'#1F1F1F', N'L', N'Chúc mừng', N'cậu già thêm 1 tuổi', N'Baloo 2', N'{"layers":[{"slug":"leo-cheers","x":0.32,"y":0.27,"w":0.6},{"slug":"laughing-leo","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Tuổi mới chúc cậu ăn không béo, ngủ đủ 8 tiếng và mãi là bạn thân của tớ.', N'Hùng (người tặng)', N'0823821677', N'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', N'hung26@gmail.com', N'Mặt Doge', N'GHN', N'GH892962165', NULL, 23),
  (3, 4258, 'EECW', N'DELIVERED', N'APPROVED', N'Lam', N'Toàn', 3, N'ancient-aliens', N'Trắng', N'#FFFFFF', N'M', N'Không giải thích được', N'do người ngoài hành tinh', N'Be Vietnam Pro', N'{"layers":[{"slug":"ancient-aliens","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Võ Minh Toàn', N'0345698299', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', N'lam66@gmail.com', N'Sinh vật bị nguyền', N'GHTK', N'S773362694', NULL, 24),
  (3, 3688, '8R39', N'DELIVERED', N'APPROVED', N'Minh', N'Lan', 1, N'futurama-fry', N'Xanh pastel', N'#BFD7EA', N'L', N'Không chắc là', N'cậu đang đùa', N'Baloo 2', N'{"layers":[{"slug":"futurama-fry","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', N'Mặc áo này đi học thứ Hai nhé, cả lớp sẽ biết là của tớ tặng.', N'Nguyễn Thị Lan', N'0886852143', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', N'minh82@gmail.com', N'Sinh vật bị nguyền', N'GHTK', N'S632101434', NULL, 1),
  (3, 5067, 'WBYA', N'DELIVERED', N'APPROVED', N'Huy', N'Trang', NULL, N'megamind-peeking', N'Trắng', N'#FFFFFF', N'L', N'Không quà à?', NULL, N'Baloo 2', N'{"layers":[{"slug":"megamind-peeking","x":0.32,"y":0.27,"w":0.6},{"slug":"squidward-window","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Có quà đây rồi, đừng ngó nữa!', N'Phạm Thu Trang', N'0995694263', N'Số 600 Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ', NULL, N'Doge chiến binh', N'GHN', N'GH823881788', NULL, 2),
  (3, 6182, 'DRGT', N'DELIVERED', N'APPROVED', N'Ngọc', N'Bảo', 1, N'they-dont-know', N'Be', N'#E8DCC4', N'M', N'Họ đâu có biết', N'tớ có quà cho cậu', N'Patrick Hand', N'{"layers":[{"slug":"they-dont-know","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Lê Gia Bảo', N'0311491350', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', N'ngoc57@gmail.com', N'Sinh vật bị nguyền', N'GHTK', N'S319628490', NULL, 3),
  (3, 4176, '2RDB', N'DELIVERED', N'APPROVED', N'Khoa', N'Vy', 2, N'absolute-cinema', N'Trắng', N'#FFFFFF', N'M', N'Cậu là', N'absolute cinema', N'Baloo 2', N'{"layers":[{"slug":"absolute-cinema","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cảm ơn vì đã là nhân vật chính trong mọi câu chuyện của nhóm mình.', N'Trần Tường Vy', N'0713369047', N'Lô E2a-7 Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh', N'khoa20@gmail.com', N'Bò đồng cỏ', N'GHTK', N'S506106129', NULL, 4),
  (3, 7839, 'E5Z2', N'DELIVERED', N'APPROVED', N'Thảo', N'Nam', 3, N'monkey-puppet', N'Trắng', N'#FFFFFF', N'M', N'Khi nghe chữ', N'“quà”', N'Baloo 2', N'{"layers":[{"slug":"monkey-puppet","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Đỗ Hoài Nam', N'0936474039', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', NULL, N'Mèo meme kêu', N'GHN', N'GH422149138', NULL, 5),
  (3, 5959, '4339', N'DELIVERED', N'APPROVED', N'Phương', N'Đức', NULL, N'mocking-spongebob', N'Xanh pastel', N'#BFD7EA', N'L', N'tỚ kHôNg Có', N'dỖi ĐâU', N'Patrick Hand', N'{"layers":[{"slug":"mocking-spongebob","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Hết dỗi chưa? Hết rồi thì mặc áo vào đi ăn lẩu.', N'Phương (người tặng)', N'0317807624', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', N'phuong88@gmail.com', N'Sinh vật bị nguyền', N'GHN', N'GH195085626', NULL, 6),
  (3, 7621, 'NKE3', N'DELIVERED', N'APPROVED', N'Tú', N'Linh', 3, N'roll-safe', N'Be', N'#E8DCC4', N'M', N'Không thể trễ hạn', N'nếu không nộp bài', N'Be Vietnam Pro', N'{"layers":[{"slug":"roll-safe","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Hoàng Khánh Linh', N'0994471981', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', N'tu58@gmail.com', N'Sinh vật bị nguyền', N'GHN', N'GH117948563', NULL, 7),
  (3, 7910, 'QTH2', N'DELIVERED', N'APPROVED', N'Quân', N'Hà', 2, N'change-my-mind', N'Trắng', N'#FFFFFF', N'XL', N'Trà sữa là chân ái', NULL, N'Baloo 2', N'{"layers":[{"slug":"change-my-mind","x":0.32,"y":0.27,"w":0.6},{"slug":"grandma-internet","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Một năm 365 ly trà sữa, tớ bao 1 ly kèm áo này.', N'Bùi Thanh Hà', N'0915378738', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', N'quan47@gmail.com', N'Mặt Doge', N'GHN', N'GH542803846', NULL, 8),
  -- đợt 4 (tuần -1)
  (4, 9492, '9VWX', N'PRINTING', N'APPROVED', N'Mai', N'Tuấn', 1, N'surprised-pikachu', N'Trắng', N'#FFFFFF', N'M', N'Deadline là hôm nay', N'(tớ vẫn ổn)', N'Baloo 2', N'{"layers":[{"slug":"surprised-pikachu","x":0.32,"y":0.27,"w":0.6},{"slug":"waiting-skeleton","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Chúc cậu qua môn nhẹ nhàng, deadline nào cũng kịp!', N'Đặng Anh Tuấn', N'0746876828', N'Số 7 Tạ Quang Bửu, Bách Khoa, Hai Bà Trưng, Hà Nội', NULL, N'Mèo bánh mì', NULL, NULL, NULL, 9),
  (4, 9787, 'NP5U', N'PRINTING', N'APPROVED', N'Hiếu', N'My', 3, N'this-is-fine', N'Be', N'#E8DCC4', N'M', N'Mọi thứ vẫn ổn', N'(không ổn)', N'Patrick Hand', N'{"layers":[{"slug":"this-is-fine","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Ngô Trà My', N'0985453875', N'Số 7 Tạ Quang Bửu, Bách Khoa, Hai Bà Trưng, Hà Nội', N'hieu69@gmail.com', N'Bò đồng cỏ', NULL, NULL, NULL, 10),
  (4, 9555, 'HPAW', N'PRINTING', N'APPROVED', N'An', N'Khánh', NULL, N'woman-yelling-at-cat', N'Xanh pastel', N'#BFD7EA', N'M', N'Tớ đúng', N'cậu sai', N'Baloo 2', N'{"layers":[{"slug":"woman-yelling-at-cat","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cãi nhau cả năm nhưng vẫn quý cậu nhất. Mặc áo này đi cãi tiếp nhé!', N'An (người tặng)', N'0324588352', N'Lô E2a-7 Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh', N'an33@gmail.com', N'Mèo bánh mì', NULL, NULL, NULL, 11),
  (4, 5738, 'HWGG', N'PRINTING', N'APPROVED', N'Duy', N'Thư', NULL, N'hide-the-pain-harold', N'Đen', N'#1F1F1F', N'L', N'Sinh viên năm cuối', NULL, N'Be Vietnam Pro', N'{"layers":[{"slug":"hide-the-pain-harold","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Năm cuối rồi, cố lên! Tốt nghiệp xong tớ bao trà sữa.', N'Duy (người tặng)', N'0903086573', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', NULL, N'Bò đồng cỏ', NULL, NULL, NULL, 12),
  (4, 5316, 'KZX2', N'PRINTING', N'APPROVED', N'Hoa', N'Sơn', 2, N'kermit-tea', N'Trắng', N'#FFFFFF', N'XL', N'Chuyện của cậu', N'tớ chỉ uống trà', N'Baloo 2', N'{"layers":[{"slug":"kermit-tea","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Lý Trường Sơn', N'0873600671', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', NULL, N'Doge chiến binh', NULL, NULL, NULL, 13),
  (4, 6138, '84JH', N'PRINTING', N'APPROVED', N'Long', N'Ngân', NULL, N'disaster-girl', N'Be', N'#E8DCC4', N'S', N'Tớ không làm gì cả', NULL, N'Baloo 2', N'{"layers":[{"slug":"disaster-girl","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Sinh nhật vui vẻ nha đồ phá hoại!', N'Dương Kim Ngân', N'0902192541', N'Số 42 Nguyễn Văn Cừ, Phường 1, Quận 5, TP. Hồ Chí Minh', N'long93@gmail.com', N'Mèo meme kêu', NULL, NULL, NULL, 14),
  (4, 2896, 'JBY3', N'PRINTING', N'APPROVED', N'Yến', N'Phúc', NULL, N'leo-cheers', N'Đen', N'#1F1F1F', N'M', N'Chúc mừng', N'cậu già thêm 1 tuổi', N'Baloo 2', N'{"layers":[{"slug":"leo-cheers","x":0.32,"y":0.27,"w":0.6},{"slug":"laughing-leo","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Tuổi mới chúc cậu ăn không béo, ngủ đủ 8 tiếng và mãi là bạn thân của tớ.', N'Hồ Hữu Phúc', N'0980239944', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', NULL, N'Mèo meme kêu', NULL, NULL, NULL, 15),
  (4, 5009, 'P8KF', N'PRINTING', N'APPROVED', N'Đạt', N'Quỳnh', 2, N'ancient-aliens', N'Trắng', N'#FFFFFF', N'M', N'Không giải thích được', N'do người ngoài hành tinh', N'Be Vietnam Pro', N'{"layers":[{"slug":"ancient-aliens","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Đạt (người tặng)', N'0331998340', N'Số 9 Lê Lợi, Vĩnh Ninh, TP. Huế', NULL, N'Sinh vật bị nguyền', NULL, NULL, NULL, 16),
  (4, 3484, 'BPYD', N'PRINTING', N'APPROVED', N'Nhi', N'Kiên', 1, N'futurama-fry', N'Xanh pastel', N'#BFD7EA', N'M', N'Không chắc là', N'cậu đang đùa', N'Baloo 2', N'{"layers":[{"slug":"futurama-fry","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', N'Mặc áo này đi học thứ Hai nhé, cả lớp sẽ biết là của tớ tặng.', N'Tạ Trung Kiên', N'0986176671', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', N'nhi21@gmail.com', N'Doge chiến binh', NULL, NULL, NULL, 17),
  (4, 4890, 'R8HW', N'PRINTING', N'APPROVED', N'Trung', N'Hương', 3, N'megamind-peeking', N'Trắng', N'#FFFFFF', N'L', N'Không quà à?', NULL, N'Baloo 2', N'{"layers":[{"slug":"megamind-peeking","x":0.32,"y":0.27,"w":0.6},{"slug":"squidward-window","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Có quà đây rồi, đừng ngó nữa!', N'Cao Thu Hương', N'0377460762', N'Số 7 Tạ Quang Bửu, Bách Khoa, Hai Bà Trưng, Hà Nội', NULL, N'Mặt Doge', NULL, NULL, NULL, 18),
  -- đợt 5 (tuần +0)
  (5, 968, '4YWX', N'CANCELLED', N'APPROVED', N'Giang', N'Việt', 3, N'they-dont-know', N'Be', N'#E8DCC4', N'S', N'Họ đâu có biết', N'tớ có quà cho cậu', N'Patrick Hand', N'{"layers":[{"slug":"they-dont-know","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Lương Quốc Việt', N'0812146589', N'Phòng 312 KTX ĐH FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', N'giang94@gmail.com', NULL, NULL, NULL, NULL, 19),
  (5, 508, '3AT4', N'PENDING_APPROVAL', N'NEEDS_EDIT', N'Chi', N'Hải', NULL, N'absolute-cinema', N'Trắng', N'#FFFFFF', N'L', N'Cậu là', N'absolute cinema', N'Baloo 2', N'{"layers":[{"slug":"absolute-cinema","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cảm ơn vì đã là nhân vật chính trong mọi câu chuyện của nhóm mình.', N'Chi (người tặng)', N'0994769622', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', N'chi27@gmail.com', NULL, NULL, NULL, N'Dòng 2 dài quá vùng in, bạn rút gọn giúp shop nhé', 20),
  (5, 1879, 'UR42', N'PAID', N'APPROVED', N'Vân', N'Thắng', 3, N'monkey-puppet', N'Trắng', N'#FFFFFF', N'M', N'Khi nghe chữ', N'“quà”', N'Baloo 2', N'{"layers":[{"slug":"monkey-puppet","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Kiều Đức Thắng', N'0875072709', N'Số 25 Lạch Tray, Ngô Quyền, Hải Phòng', NULL, NULL, NULL, NULL, NULL, 21),
  (5, 1905, 'ZGZ3', N'PAID', N'APPROVED', N'Bình', N'Uyên', 1, N'mocking-spongebob', N'Xanh pastel', N'#BFD7EA', N'L', N'tỚ kHôNg Có', N'dỖi ĐâU', N'Patrick Hand', N'{"layers":[{"slug":"mocking-spongebob","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Hết dỗi chưa? Hết rồi thì mặc áo vào đi ăn lẩu.', N'Tô Phương Uyên', N'0350623309', N'Tòa B2 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội', NULL, NULL, NULL, NULL, NULL, 22),
  (5, 1100, '7GCH', N'PENDING_PAYMENT', N'APPROVED', N'Hùng', N'Hạnh', NULL, N'roll-safe', N'Be', N'#E8DCC4', N'S', N'Không thể trễ hạn', N'nếu không nộp bài', N'Be Vietnam Pro', N'{"layers":[{"slug":"roll-safe","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', NULL, N'Châu Mỹ Hạnh', N'0953813408', N'Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng', N'hung37@gmail.com', NULL, NULL, NULL, NULL, 23),
  (5, 1495, '2W3C', N'CANCELLED', N'APPROVED', N'Lam', N'Toàn', 2, N'change-my-mind', N'Trắng', N'#FFFFFF', N'M', N'Trà sữa là chân ái', NULL, N'Baloo 2', N'{"layers":[{"slug":"change-my-mind","x":0.32,"y":0.27,"w":0.6},{"slug":"grandma-internet","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Một năm 365 ly trà sữa, tớ bao 1 ly kèm áo này.', N'Võ Minh Toàn', N'0724974843', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', NULL, NULL, NULL, NULL, NULL, 24),
  (5, 979, 'HGG8', N'CANCELLED', N'APPROVED', N'Minh', N'Lan', NULL, N'surprised-pikachu', N'Trắng', N'#FFFFFF', N'L', N'Deadline là hôm nay', N'(tớ vẫn ổn)', N'Baloo 2', N'{"layers":[{"slug":"surprised-pikachu","x":0.32,"y":0.27,"w":0.6},{"slug":"waiting-skeleton","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Chúc cậu qua môn nhẹ nhàng, deadline nào cũng kịp!', N'Nguyễn Thị Lan', N'0307297450', N'Số 120 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', NULL, NULL, NULL, NULL, NULL, 1),
  (5, 1013, 'P3CG', N'PENDING_PAYMENT', N'APPROVED', N'Huy', N'Trang', 2, N'this-is-fine', N'Be', N'#E8DCC4', N'S', N'Mọi thứ vẫn ổn', N'(không ổn)', N'Patrick Hand', N'{"layers":[{"slug":"this-is-fine","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Phạm Thu Trang', N'0395331962', N'Tòa B2 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội', N'huy77@gmail.com', NULL, NULL, NULL, NULL, 2),
  (5, 2416, 'UAU8', N'PENDING_APPROVAL', N'PENDING_REVIEW', N'Ngọc', N'Bảo', 2, N'woman-yelling-at-cat', N'Xanh pastel', N'#BFD7EA', N'M', N'Tớ đúng', N'cậu sai', N'Baloo 2', N'{"layers":[{"slug":"woman-yelling-at-cat","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'PLAIN', N'Cãi nhau cả năm nhưng vẫn quý cậu nhất. Mặc áo này đi cãi tiếp nhé!', N'Lê Gia Bảo', N'0759192724', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', N'ngoc20@gmail.com', NULL, NULL, NULL, NULL, 3),
  (5, 325, 'BQFU', N'PENDING_APPROVAL', N'FLAGGED', N'Khoa', N'Vy', NULL, N'hide-the-pain-harold', N'Đen', N'#1F1F1F', N'S', N'Đồ ngu ngơ', N'dễ thương nhất lớp', N'Be Vietnam Pro', N'{"layers":[{"slug":"hide-the-pain-harold","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Năm cuối rồi, cố lên! Tốt nghiệp xong tớ bao trà sữa.', N'Trần Tường Vy', N'0757553882', N'Hẻm 51 Ba Tháng Hai, Phường 11, Quận 10, TP. Hồ Chí Minh', NULL, NULL, NULL, NULL, NULL, 4),
  (5, 1454, 'NSPC', N'PENDING_APPROVAL', N'PENDING_REVIEW', N'Thảo', N'Nam', 2, N'kermit-tea', N'Trắng', N'#FFFFFF', N'L', N'Chuyện của cậu', N'tớ chỉ uống trà', N'Baloo 2', N'{"layers":[{"slug":"kermit-tea","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'SPY', NULL, N'Thảo (người tặng)', N'0345570706', N'Số 600 Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ', NULL, NULL, NULL, NULL, NULL, 5),
  (5, 823, 'F94V', N'PAID', N'APPROVED', N'Phương', N'Đức', 2, N'disaster-girl', N'Be', N'#E8DCC4', N'XL', N'Tớ không làm gì cả', NULL, N'Baloo 2', N'{"layers":[{"slug":"disaster-girl","x":0.5,"y":0.36,"w":0.9}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Sinh nhật vui vẻ nha đồ phá hoại!', N'Phương (người tặng)', N'0358536491', N'Tòa B2 Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội', N'phuong96@gmail.com', NULL, NULL, NULL, NULL, 6),
  (5, 286, 'HEF8', N'CANCELLED', N'APPROVED', N'Tú', N'Linh', 3, N'leo-cheers', N'Đen', N'#1F1F1F', N'L', N'Chúc mừng', N'cậu già thêm 1 tuổi', N'Baloo 2', N'{"layers":[{"slug":"leo-cheers","x":0.32,"y":0.27,"w":0.6},{"slug":"laughing-leo","x":0.68,"y":0.56,"w":0.6}],"text":{"x":0.5,"y":0.86,"s":0.068}}', N'MEME', N'Tuổi mới chúc cậu ăn không béo, ngủ đủ 8 tiếng và mãi là bạn thân của tớ.', N'Hoàng Khánh Linh', N'0926887465', N'Số 18 ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', N'tu84@gmail.com', NULL, NULL, NULL, NULL, 7);

INSERT INTO orders (code, created_at, status, content_status, price, giver_name, recipient_name, spy_template_id, meme_slug, color_name, color_hex,
  size_code, text_line1, text_line2, font, print_position, layout_json, card_style, card_message, shipping_name, shipping_phone, shipping_address,
  email, batch_id, keychain_design, carrier, tracking_code, review_note, customer_id)
SELECT N'BB' + FORMAT(t.created_at, 'yyMMdd') + o.suffix, t.created_at, o.status, o.content_status, 350000, o.giver_name, o.recipient_name,
  o.spy_template_id, o.meme_slug, o.color_name, o.color_hex, o.size_code, o.text_line1, o.text_line2, o.font, N'CENTER', o.layout_json, o.card_style,
  o.card_message, o.shipping_name, o.shipping_phone, o.shipping_address, o.email, o.batch_id, o.keychain_design, o.carrier, o.tracking_code, o.review_note, o.customer_id
FROM @o o JOIN batches b ON b.id = o.batch_id
-- đơn của đợt đang mở không được nằm sau thời điểm chạy script (chạy sáng thứ Hai chẳng hạn)
CROSS APPLY (SELECT CASE WHEN DATEADD(minute, o.mins, b.open_at) > @Now
                         THEN DATEADD(minute, -(o.mins % 50) - 1, @Now) ELSE DATEADD(minute, o.mins, b.open_at) END AS created_at) t
ORDER BY t.created_at;

COMMIT;
GO

-- Kiểm tra nhanh
SELECT 'memes' AS bang, COUNT(*) AS so_dong FROM memes UNION ALL SELECT 'shirt_colors', COUNT(*) FROM shirt_colors
UNION ALL SELECT 'sizes', COUNT(*) FROM sizes UNION ALL SELECT 'spy_form_templates', COUNT(*) FROM spy_form_templates
UNION ALL SELECT 'keychain_designs', COUNT(*) FROM keychain_designs UNION ALL SELECT 'staff_users', COUNT(*) FROM staff_users
UNION ALL SELECT 'customers', COUNT(*) FROM customers UNION ALL SELECT 'custom_images', COUNT(*) FROM custom_images
UNION ALL SELECT 'batches', COUNT(*) FROM batches UNION ALL SELECT 'orders', COUNT(*) FROM orders;
GO
