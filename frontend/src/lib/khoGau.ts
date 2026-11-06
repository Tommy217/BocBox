// Series khô gấu (móc khóa thú bông dẹt in ảnh meme). Slug phải giống bảng keychain_designs trong backend/sql/bocbox-full.sql.
// Ảnh tham khảo lấy từ Lazada (có link nguồn), riêng Doge chiến binh dùng ảnh nhóm BocBox gửi.
const P = (f: string) => `${import.meta.env.BASE_URL}products/${f}`;
const LZ = (id: string) => `https://www.lazada.vn/products/pdp-i${id}.html`;

export type KhoGau = { slug: string; name: string; note: string; src: string; refSrc: string; href: string };
export const KHO_GAU: KhoGau[] = [
  { slug: 'chien-binh', name: 'Doge chiến binh', note: 'Cầm kiếm và khiên', src: P('kho-gau-nhom.webp'), refSrc: P('kho-gau-chien-binh-ref.jpg'), href: LZ('13470901199') },
  { slug: 'mat-doge', name: 'Mặt Doge', note: 'Dẹt, in ảnh 2 mặt', src: P('kho-gau-mat-doge.jpg'), refSrc: P('kho-gau-mat-doge.jpg'), href: LZ('13464255903') },
  { slug: 'meo-banh-mi', name: 'Mèo bánh mì', note: 'Mèo nằm ổ bánh', src: P('kho-gau-meo-banh-mi.jpg'), refSrc: P('kho-gau-meo-banh-mi.jpg'), href: LZ('13487693177') },
  { slug: 'meo-meme', name: 'Mèo meme kêu', note: 'Bóp có tiếng', src: P('kho-gau-meo-meme.jpg'), refSrc: P('kho-gau-meo-meme.jpg'), href: LZ('13464229708') },
  { slug: 'sinh-vat-nguyen', name: 'Sinh vật bị nguyền', note: 'Bóp chút chít', src: P('kho-gau-sinh-vat-nguyen.jpg'), refSrc: P('kho-gau-sinh-vat-nguyen.jpg'), href: LZ('13453968151') },
  { slug: 'bo-dong-co', name: 'Bò đồng cỏ', note: 'Meme trừu tượng', src: P('kho-gau-bo-dong-co.jpg'), refSrc: P('kho-gau-bo-dong-co.jpg'), href: LZ('13482217545') },
];
export const khoGauSrc = (slug: string) => KHO_GAU.find((k) => k.slug === slug)?.src ?? P('kho-gau-nhom.webp');
