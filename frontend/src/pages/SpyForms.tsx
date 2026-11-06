import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { SpyForm } from '../lib/types';
import { useIntel } from '../lib/store';
import { Bubble, Icon, SectionTitle } from '../components/Fun';
import { KhoGauPhoto } from '../components/Canvases';

export default function SpyForms() {
  const [forms, setForms] = useState<SpyForm[]>([]);
  const [height, setHeight] = useState(165), [weight, setWeight] = useState(55), [usual, setUsual] = useState('');
  const [result, setResult] = useState<{ sizeCode: string; reason: string } | null>(null);
  const { intel, setIntel } = useIntel();
  const nav = useNavigate();
  useEffect(() => { api.spyForms().then(setForms); }, []);
  const [copied, setCopied] = useState<number | null>(null);
  /** Chép link form để dán vào tin nhắn gửi người nhận; chọn luôn kịch bản này cho thiệp thú tội. */
  async function copyLink(f: SpyForm) {
    setIntel({ spyTemplateId: f.id });
    try { await navigator.clipboard.writeText(f.googleFormCopyUrl!); setCopied(f.id); setTimeout(() => setCopied(null), 2000); }
    catch { window.prompt('Sao chép link này:', f.googleFormCopyUrl!); }
  }

  return (
    <div className="page">
      <div className="page-head"><Icon name="detective" size={64} /><div><h1>Phòng điệp viên</h1>
      <p className="lead">Chọn một kịch bản ngụy trang, sao chép link Google Form rồi gửi cho người nhận (và vài người bạn khác cho tự nhiên). Có chiều cao, cân nặng thì nhập ở bước 2 để ra size.</p></div></div>
      <div className="grid3">
        {forms.map((f) => (
          <div key={f.id} className={`dossier selectable ${intel.spyTemplateId === f.id ? 'on' : ''}`} onClick={() => setIntel({ spyTemplateId: f.id })}>
            <span className="dossier-stamp">TUYỆT MẬT</span>
            <Icon name="file-folder" size={40} />
            <h3>{f.title}</h3>
            <p>{f.scenario}</p>
            <p className="muted small">Thiệp sẽ thú tội: “{f.confessionText}”</p>
            {f.googleFormCopyUrl ? (
              <div className="row gap-xs wrap" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="btn small" onClick={() => copyLink(f)}>{copied === f.id ? 'Đã sao chép!' : 'Sao chép link gửi người nhận'}</button>
                <a className="btn ghost small" href={f.googleFormCopyUrl} target="_blank" rel="noreferrer">Xem form</a>
              </div>
            ) : <span className="muted small">Form của kịch bản này đang chuẩn bị.</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 56 }}><SectionTitle kicker="Bước 2" title="Giải mã size" sub="Có chiều cao, cân nặng “tình báo” được là ra size." /></div>
      <div className="row gap center"><KhoGauPhoto slug="mat-doge" size={84} /><Bubble>Nhập số đo “tình báo” được, tớ đoán size cho!</Bubble></div>
      <form className="card form-row" onSubmit={async (e) => { e.preventDefault(); const r = await api.suggestSize(height, weight, usual); setResult(r); setIntel({ sizeCode: r.sizeCode }); }}>
        <label>Chiều cao (cm)<input type="number" min={120} max={220} value={height} onChange={(e) => setHeight(+e.target.value)} /></label>
        <label>Cân nặng (kg)<input type="number" min={30} max={150} value={weight} onChange={(e) => setWeight(+e.target.value)} /></label>
        <label>Size hay mặc<select value={usual} onChange={(e) => setUsual(e.target.value)}><option value="">Không rõ</option>{['S', 'M', 'L', 'XL', 'XXL'].map((s) => <option key={s}>{s}</option>)}</select></label>
        <button className="btn">Gợi ý size</button>
      </form>
      {result && (
        <div className="callout"><Icon name="check-mark-button" size={26} />
          <b>Gợi ý: size {result.sizeCode}</b> — {result.reason}
          <button className="btn small" onClick={() => nav('/build')}>Dùng size này để thiết kế</button>
        </div>
      )}
    </div>
  );
}
