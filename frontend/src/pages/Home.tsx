import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import type { Batch, Design, Meme } from '../lib/types';
import { KHO_GAU } from '../lib/khoGau';
import { applyTemplate } from '../lib/draft';
import { KhoGauPhoto, MemePhoto, TeePreview } from '../components/Canvases';
import { AuthorTag, GiftCard } from '../components/Cards';
import { Countdown, Icon, SectionTitle } from '../components/Fun';
import { dmy, dmyhm, vnd } from '../components/ui';

const STEPS = [
  { icon: 'detective', title: 'Lấy size bí mật', text: 'Gửi form ngụy trang cho người nhận, BocBox gợi ý size.', to: '/spy' },
  { icon: 'artist-palette', title: 'Thiết kế áo', text: 'Ghép meme, câu đùa, màu áo. Xem trước ngay trên áo thật.', to: '/build' },
  { icon: 'credit-card', title: 'Duyệt rồi trả 350K', text: 'Shop duyệt thiết kế xong, bạn chuyển khoản VietQR (nội dung là mã đơn).', to: '/my-orders' },
  { icon: 'delivery-truck', title: 'Nhận hộp', text: 'Giao thứ Năm – thứ Sáu tuần sau. Theo dõi ở Đơn của tôi.', to: '/my-orders' },
];
const FAQ = [
  ['Làm sao biết size mà không lộ quà?', 'Vào Phòng điệp viên, chọn một kịch bản form ngụy trang (khảo sát bài tập nhóm, gom size áo lớp…) gửi cho người nhận. Có chiều cao, cân nặng là BocBox gợi ý size. Áo form unisex rộng nên dễ mặc.'],
  ['Bao lâu thì nhận được hàng?', 'Mỗi đợt mở từ thứ Hai, chốt 23:59 Chủ nhật. Nhóm in áo thứ Hai đến thứ Tư, đóng hộp thứ Năm và giao thứ Năm – thứ Sáu tuần sau.'],
  ['Có cần tài khoản không?', 'Không cần để xem và thiết kế: cứ vào Xưởng in thử thoải mái. Chỉ lúc bấm đặt hộp mới cần đăng nhập (hoặc đăng ký nhanh bằng số điện thoại) để theo dõi ở mục Đơn của tôi.'],
  ['Thanh toán thế nào?', 'Đặt xong, nhóm duyệt thiết kế (chữ, ảnh, lời nhắn) trước. Duyệt xong bạn mới thấy mã VietQR để trả trước 100%, nội dung chuyển khoản là mã đơn. Cần sửa thì nhóm ghi chú lại, bạn sửa ngay trong Đơn của tôi.'],
  ['Đặt rồi có sửa hay hủy được không?', 'Được, miễn phí cho tới khi đợt chốt (23:59 Chủ nhật). Sau đó áo đã vào in nên không đổi được nữa.'],
  ['In được những gì lên áo?', 'Tối đa bốn meme hoặc ảnh tự tải lên và hai dòng chữ (28 ký tự mỗi dòng), in mặt trước trong vùng A4. Mọi nội dung được nhóm duyệt trước khi in.'],
  ['Khô gấu có chọn được mẫu không?', 'Không, đó là phần bất ngờ: mỗi box bốc ngẫu nhiên trong các mẫu khô gấu của series đang bán. Cả 6 mẫu được công bố trên kệ bên dưới.'],
  ['Muốn thêm món hoặc thiết kế riêng?', 'BocBox chỉ bán một box duy nhất. Yêu cầu ngoài công cụ thiết kế, nhắn Zalo/Messenger của nhóm để được báo giá riêng.'],
];
const HERO_COLORS = ['#FFFFFF', '#E8DCC4', '#BFD7EA', '#1F1F1F'];

// Ảnh tham khảo lấy từ sàn Lazada (chỉ dùng cho demo môn học), trừ ảnh khô gấu do nhóm gửi.
const P = (f: string) => `${import.meta.env.BASE_URL}products/${f}`;
type Ref = { src: string; title: string; note?: string; href?: string };
const LZ = (id: string) => `https://www.lazada.vn/products/pdp-i${id}.html`;

const KHO_GAU_REFS: Ref[] = KHO_GAU.map((k) => ({ src: k.refSrc, title: k.name, note: k.note, href: k.href }));
const PACKAGING: Ref[] = [
  { src: P('hop-kraft-no.jpg'), title: 'Hộp kraft thắt nơ', note: 'Hộp chính, in logo BocBox lên nắp', href: LZ('13442702377') },
  { src: P('giay-rom.jpg'), title: 'Giấy rơm kraft', note: 'Lót đáy, giữ áo và khô gấu không xô lệch', href: LZ('2038258372') },
  { src: P('thiep-kraft.jpg'), title: 'Thiệp kraft', note: 'In thiệp điệp viên thú tội', href: LZ('13485510091') },
  { src: P('hop-keo-kraft.jpg'), title: 'Hộp kéo kraft', note: 'Phương án rẻ hơn, nhỏ gọn', href: LZ('2814959104') },
];
const MARKET: Ref[] = [
  { src: P('ao-ref-hampter.jpg'), title: 'Hampter is calling', href: LZ('2636415657') },
  { src: P('ao-ref-i-eat-cement.jpg'), title: 'I eat cement', href: LZ('13472003839') },
  { src: P('ao-ref-meo-den.jpg'), title: 'Mèo meme áo đen', href: LZ('2666800524') },
  { src: P('ao-ref-lactose.jpg'), title: 'Lactose intolerant', href: LZ('13472409119') },
];
/** Mẫu áo do shop thiết kế sẵn: bấm là mở Xưởng in với thiết kế này. */
const SHOP_DESIGNS: { name: string; design: Design }[] = [
  { name: 'Deadline', design: { memeSlug: 'surprised-pikachu', colorHex: '#FFFFFF', textLine1: 'Khi thấy deadline', textLine2: 'là hôm nay', font: 'Baloo 2', position: 'CENTER' } },
  { name: 'Vẫn ổn', design: { memeSlug: 'this-is-fine', colorHex: '#E8DCC4', textLine1: 'Mọi thứ vẫn ổn', textLine2: '(không ổn)', font: 'Patrick Hand', position: 'CENTER' } },
  { name: 'Cãi nhau', design: { memeSlug: 'woman-yelling-at-cat', colorHex: '#BFD7EA', textLine1: 'Tớ đúng', textLine2: 'cậu sai', font: 'Baloo 2', position: 'CENTER' } },
  { name: 'Năm cuối', design: { memeSlug: 'hide-the-pain-harold', colorHex: '#1F1F1F', textLine1: 'Sinh viên năm cuối', textLine2: '', font: 'Be Vietnam Pro', position: 'CENTER' } },
];

function Photo({ r, className = '' }: { r: Ref; className?: string }) {
  return (
    <figure className={`photo ${className}`}>
      <img src={r.src} alt={r.title} loading="lazy" />
      <figcaption><b>{r.title}</b>{r.note && <span>{r.note}</span>}{r.href && <a href={r.href} target="_blank" rel="noreferrer">Nguồn ảnh</a>}</figcaption>
    </figure>
  );
}

export default function Home() {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    api.openBatch().then(setBatch).catch(() => undefined);
    api.memes().then(setMemes).catch(() => undefined);
    const t = setInterval(() => setTick((n) => n + 1), 2600);
    return () => clearInterval(t);
  }, []);
  const heroMeme = memes.length ? memes[tick % memes.length].slug : 'surprised-pikachu';
  const heroColor = HERO_COLORS[tick % HERO_COLORS.length];
  const nav = useNavigate();
  const pickShopDesign = (design: Design) => { if (applyTemplate(design)) nav('/build'); };

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-copy">
          {batch && <span className="kicker"><Icon name="hourglass-not-done" size={18} /> Đợt {batch.code} đang nhận đơn</span>}
          <h1>Món quà <em>không bao giờ nhạt</em></h1>
          <p className="lead">Tự thiết kế áo meme cho đứa bạn thân, kèm một bé khô gấu bí ẩn. Đúng size, đúng meme, đúng người.</p>
          <div className="hero-price">
            <span className="price-tag">{vnd(350000)}</span>
            <span className="muted">1 áo meme + 1 khô gấu random + tag + thiệp</span>
          </div>
          <div className="row gap wrap">
            <Link to="/build" className="btn big-cta"><Icon name="artist-palette" size={24} /> Thiết kế áo ngay</Link>
            <Link to="/spy" className="btn ghost"><Icon name="detective" size={22} /> Lấy size bí mật trước</Link>
          </div>
          {batch && (
            <div className="hero-batch">
              <span>Chốt đơn sau</span>
              <Countdown to={batch.closeAt} />
              <span className="small muted">Hạn {dmyhm(batch.closeAt)} · giao {dmy(batch.deliveryFrom)}–{dmy(batch.deliveryTo)}</span>
            </div>
          )}
        </div>
        <div className="hero-visual">
          <div className="hero-blob" aria-hidden />
          <span className="hero-sticker">Bản duy nhất</span>
          <TeePreview width={330} tag={{ giver: 'Minh', recipient: 'Lan' }} design={{ memeSlug: heroMeme, colorHex: heroColor, textLine1: 'Tôi ổn', textLine2: '(không ổn)', font: 'Baloo 2', position: 'CENTER' }} />
          <div className="hero-tag"><AuthorTag giver="Minh" recipient="Lan" width={170} /></div>
          <motion.div className="hero-mascot" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
            <KhoGauPhoto slug="chien-binh" size={96} alt="Khô gấu Doge chiến binh" />
          </motion.div>
        </div>
      </section>

      {memes.length > 0 && (
        <div className="marquee" aria-label="Meme có sẵn để in">
          <div className="marquee-track">
            {[...memes, ...memes].map((m, i) => <figure key={i}><MemePhoto slug={m.slug} size={92} alt={m.name} /><figcaption>{m.name}</figcaption></figure>)}
          </div>
        </div>
      )}

      <section className="box-hero" id="trong-hop">
        <div className="box-hero-copy">
          <span className="kicker"><Icon name="wrapped-gift" size={18} /> Mở hộp ra là thấy</span>
          <h2>Một hộp, <em>hai món</em> và cả một vụ điệp viên</h2>
          <p className="lead">Hộp kraft thắt nơ, lót giấy rơm. Bên trong là 1 áo meme và 1 bé khô gấu, kèm author tag và thiệp thú tội.</p>
          <ul className="box-list">
            <li><Icon name="t-shirt" size={26} /><div><b>1 áo meme</b><span>Tự custom hoặc chọn mẫu shop thiết kế sẵn</span></div></li>
            <li><Icon name="sparkles" size={26} /><div><b>1 khô gấu</b><span>Móc khóa thú bông dẹt in ảnh meme, bốc ngẫu nhiên 1 trong 6 mẫu</span></div></li>
            <li><Icon name="label" size={26} /><div><b>Author tag + thiệp điệp viên</b><span>“Thiết kế bởi … dành cho …” và lời thú tội</span></div></li>
          </ul>
          <div className="row gap wrap">
            <span className="price-tag">{vnd(350000)}</span>
            <Link to="/build" className="btn big-cta">Đặt hộp này</Link>
          </div>
        </div>
        <div className="box-hero-visual">
          <img className="box-hero-main" src={P('hop-mo-qua.jpg')} alt="Hộp quà mở nắp có giấy rơm và thú bông" />
          <img className="box-hero-kho" src={P('kho-gau-nhom.webp')} alt="Khô gấu Doge chiến binh nhóm chọn" />
          <span className="hero-sticker">Ảnh tham khảo</span>
          <a className="box-hero-src small" href={LZ('13373604308')} target="_blank" rel="noreferrer">Nguồn ảnh hộp</a>
        </div>
      </section>

      <section>
        <SectionTitle kicker="Món 1" title="Áo meme: tự làm hay lấy mẫu shop?" sub="Cùng giá, cùng hộp. In mặt trước trong vùng A4, chọn màu áo và size." />
        <div className="tee-options">
          <div className="tee-option">
            <h3><Icon name="artist-palette" size={28} /> Tự custom</h3>
            <p className="muted">Chọn meme, viết 2 dòng câu đùa của riêng hai đứa, chọn font và vị trí in. Xem trước ngay trên áo thật.</p>
            <div className="tee-option-visual"><TeePreview width={220} design={{ memeSlug: 'monkey-puppet', colorHex: '#FFFFFF', textLine1: 'Lan khi nghe', textLine2: 'chữ “quà”', font: 'Baloo 2', position: 'CENTER' }} /></div>
            <Link to="/build" className="btn">Vào xưởng in</Link>
          </div>
          <div className="tee-option">
            <h3><Icon name="star" size={28} /> Mẫu shop thiết kế sẵn</h3>
            <p className="muted">Lười nghĩ câu đùa? Chọn một mẫu dưới đây, vẫn sửa được chữ và màu trước khi đặt. Xem đủ 12 hộp ở <Link to="/shop">kệ hộp có sẵn</Link>.</p>
            <div className="shop-designs">
              {SHOP_DESIGNS.map((s) => (
                <button type="button" key={s.name} className="shop-design" onClick={() => pickShopDesign(s.design)}>
                  <TeePreview width={130} design={s.design} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle kicker="Món 2" title="Khô gấu bí ẩn" sub="Thú bông dẹt in ảnh meme, có xích treo balo. Mỗi hộp bốc ngẫu nhiên 1 trong 6 mẫu của series." />
        <div className="kho-feature">
          <figure className="photo photo-big">
            <img src={P('kho-gau-nhom.webp')} alt="Khô gấu Doge chiến binh" />
            <figcaption><b>Mẫu nhóm chọn: Doge chiến binh</b><span>Ảnh nhóm BocBox gửi. Vải nhung in 2 mặt, khoảng 10–12 cm.</span></figcaption>
          </figure>
          <div className="kho-grid">{KHO_GAU_REFS.map((r) => <Photo key={r.title} r={r} />)}</div>
        </div>
      </section>

      <section>
        <SectionTitle kicker="Bao bì" title="Hộp, giấy rơm và thiệp" sub="Mở nắp là thấy giấy rơm, áo gấp gọn, khô gấu nằm trên cùng, tag và thiệp kẹp bên cạnh." />
        <div className="pack-grid">{PACKAGING.map((r) => <Photo key={r.title} r={r} />)}</div>
        <div className="tag-feature">
          <div className="tag-on-tee">
            <TeePreview width={300} tag={{ giver: 'Minh', recipient: 'Lan' }} design={{ memeSlug: 'kermit-tea', colorHex: '#E8DCC4', textLine1: 'Chuyện của cậu', textLine2: 'tớ chỉ uống trà', font: 'Baloo 2', position: 'CENTER' }} />
          </div>
          <div className="tag-copy">
            <h3>Author tag may ngoài áo</h3>
            <p className="muted">Nhãn vải cotton mộc, in mực nâu “Thiết kế bởi … dành cho …”, gập hai đầu và may cố định ở gấu áo phía trước. Giặt máy thoải mái, không bong như tem dán.</p>
            <AuthorTag giver="Minh" recipient="Lan" width={240} />
          </div>
        </div>
        <div className="flatlay wide" aria-label="Ba kiểu thiệp">
          <GiftCard style="SPY" giver="Minh" recipient="Lan" message="Quà sinh nhật muộn nhưng tâm huyết. Mặc đi học thứ Hai nhé!" confession="Cái khảo sát bài tập nhóm hôm trước là tớ bịa ra để hỏi size cậu đấy!" width={300} />
          <GiftCard style="MEME" giver="Huy" recipient="Trang" memeSlug="leo-cheers" message="Nâng ly chúc cậu tuổi mới ăn không béo, ngủ đủ 8 tiếng." width={300} />
          <GiftCard style="PLAIN" giver="Ngọc" recipient="Bảo" message="Cảm ơn vì đã là nhân vật chính trong mọi câu chuyện của nhóm mình." width={300} />
        </div>
        <p className="muted small center">Thiệp kraft 15×10 cm: thiệp điệp viên, thiệp meme hoặc thiệp trơn. Lời nhắn tự viết hoặc chọn gợi ý của shop.</p>
      </section>

      <section>
        <SectionTitle kicker="4 bước" title="Tặng quà kiểu điệp viên" />
        <ol className="steps-road">
          {STEPS.map((s, i) => (
            <li key={s.title}><Link to={s.to} className="road-stop">
              <span className="road-num">{i + 1}</span><Icon name={s.icon} size={42} /><b>{s.title}</b><span>{s.text}</span>
            </Link></li>
          ))}
        </ol>
        {batch && (
          <div className="week">
            <h3><Icon name="hourglass-not-done" size={22} /> Lịch đợt {batch.code}</h3>
            <div className="week-line">
              <div><b>{dmy(batch.openAt)}</b><span>Mở đợt</span></div>
              <div className="hot"><b>{dmyhm(batch.closeAt)}</b><span>Chốt đơn</span></div>
              <div><b>T2–T4</b><span>In áo</span></div>
              <div><b>T5</b><span>Đóng hộp, bốc khô gấu</span></div>
              <div className="done"><b>{dmy(batch.deliveryFrom)}–{dmy(batch.deliveryTo)}</b><span>Giao tới tay</span></div>
            </div>
          </div>
        )}
      </section>

      <section className="faq-wrap">
        <SectionTitle kicker="Hỏi nhanh" title="Câu hỏi thường gặp" />
        <div className="faq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section>
        <SectionTitle kicker="Tham khảo thị trường" title="Áo meme người ta đang bán" sub="Ảnh từ các shop trên Lazada, để so chất lượng in và cách phối màu. Không phải sản phẩm BocBox." />
        <div className="market-grid">{MARKET.map((r) => <Photo key={r.title} r={r} />)}</div>
      </section>

      <p className="muted small center refs-note">Ảnh tham khảo lấy từ Lazada và thuộc về người bán, chỉ dùng minh họa cho dự án môn học EXE101.</p>
      <section className="cta-band">
        <KhoGauPhoto slug="mat-doge" size={96} />
        <div>
          <h2>Đừng để quà nhạt thêm tuần nữa</h2>
          <p>{batch ? <>Đợt {batch.code} chốt lúc <b>{dmyhm(batch.closeAt)}</b>.</> : 'Mỗi đợt chốt 23:59 Chủ nhật.'} Thiết kế chỉ mất 3 phút.</p>
        </div>
        <Link to="/build" className="btn big-cta">Vào xưởng in</Link>
      </section>
    </div>
  );
}
