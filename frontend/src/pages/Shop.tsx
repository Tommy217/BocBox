import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MOODS, READY_BOXES, type ReadyBox } from '../lib/readyBoxes';
import { khoGauSrc } from '../lib/khoGau';
import { applyTemplate } from '../lib/draft';
import { TeePreview } from '../components/Canvases';
import { AuthorTag } from '../components/Cards';
import { Icon, SectionTitle } from '../components/Fun';
import { vnd } from '../components/ui';
import { priceOf, usePricing } from '../lib/pricing';

/** Ảnh hộp dựng bằng CSS: nền màu theo chủ đề, khay kraft lót giấy rơm, áo đã in, khô gấu bí mật, tag. */
function BoxShot({ box }: { box: ReadyBox }) {
  return (
    <div className="box-shot" style={{ background: box.bg }}>
      <span className="box-brand">BOCBOX</span>
      <div className="box-tray">
        <div className="box-tee"><TeePreview width={170} design={box.design} /></div>
        <div className="box-secret" title="Khô gấu bí mật, mở hộp mới biết">
          <img src={khoGauSrc('chien-binh')} alt="" aria-hidden />
          <b>?</b>
        </div>
        <div className="box-tag"><AuthorTag giver="Bạn" recipient="người ấy" width={96} /></div>
      </div>
    </div>
  );
}

export default function Shop() {
  const nav = useNavigate();
  const pricing = usePricing();
  const [mood, setMood] = useState<(typeof MOODS)[number]>('Tất cả');
  const list = mood === 'Tất cả' ? READY_BOXES : READY_BOXES.filter((b) => b.mood === mood);

  /** Chọn hộp: ghi thiết kế vào nháp (hỏi trước nếu đang có bản dở) rồi mở Xưởng in ở bước tag & thiệp. */
  function choose(box: ReadyBox) {
    if (applyTemplate(box.design)) nav('/build', { state: { step: 3 } });
  }

  return (
    <div className="page shop-page">
      <SectionTitle kicker="Kệ hộp có sẵn" title="Chọn một hộp, tặng ngay"
        sub={<>Áo đã được thiết kế sẵn, khô gấu vẫn là bí mật đến lúc mở hộp. Muốn tự làm? <Link to="/build">Vào xưởng in</Link>.</>} />
      <div className="mood-row" role="tablist">
        {MOODS.map((m) => <button key={m} type="button" role="tab" aria-selected={mood === m} className={`choice ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>)}
      </div>
      <div className="box-grid">
        {list.map((b) => (
          <article key={b.id} className="box-card">
            <BoxShot box={b} />
            <div className="box-info">
              <h3>{b.name}</h3>
              <span className="box-price">{vnd(priceOf(pricing, b.design.layers?.length ?? 1, 'SPY'))}</span>
              <button type="button" className="box-buy" onClick={() => choose(b)}>Chọn hộp này <span aria-hidden>→</span></button>
            </div>
          </article>
        ))}
      </div>
      <p className="center muted small" style={{ marginTop: 28 }}>
        <Icon name="sparkles" size={18} /> Mọi hộp gồm 1 áo in sẵn + 1 khô gấu random trong 6 mẫu + author tag + thiệp điệp viên. Đổi sang thiệp meme in màu cộng thêm {vnd(pricing.memeCard)}. <Link to="/">Xem hộp thật trông thế nào</Link>.
      </p>
    </div>
  );
}
