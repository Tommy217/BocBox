import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { designFromOrder, withLayout } from '../lib/art';
import { applyTemplate } from '../lib/draft';
import { k, priceOf, usePricing } from '../lib/pricing';
import type { SavedDesign } from '../lib/types';
import { TeePreview } from '../components/Canvases';
import { dmyhm } from '../components/ui';
import { Icon } from '../components/Fun';

/** "Mẫu của tôi": thiết kế áo khách đã lưu trong Xưởng in; bấm "Dùng mẫu này" để mở lại và đặt tiếp. */
export default function MyDesigns() {
  const { customer, requireLogin } = useAuth();
  const nav = useNavigate();
  const pricing = usePricing();
  const [list, setList] = useState<SavedDesign[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!customer) { setList(null); return; }
    api.customer.designs().then(setList).catch((e) => setErr(e.message));
  }, [customer?.id]);

  const use = (d: SavedDesign) => { if (applyTemplate(designFromOrder(d))) nav('/build'); };
  async function remove(d: SavedDesign) {
    if (!confirm(`Xóa mẫu "${d.name}"? Đơn đã đặt bằng mẫu này không bị ảnh hưởng.`)) return;
    try { await api.customer.deleteDesign(d.id); setList((l) => (l ?? []).filter((x) => x.id !== d.id)); }
    catch (e) { setErr((e as Error).message); }
  }

  const head = (sub: string) => (
    <div className="page-head"><Icon name="star" size={56} /><div><h1>Mẫu của tôi</h1><p className="muted">{sub}</p></div></div>
  );
  if (!customer) return (
    <div className="page narrow">
      {head('Lưu những thiết kế áo bạn ưng để lần sau tặng người khác chỉ cần sửa tên.')}
      <div className="card center">
        <p>Đăng nhập để xem các mẫu đã lưu. Trong Xưởng in, bấm “Lưu vào Mẫu của tôi” để thêm mẫu mới.</p>
        <div className="row gap center wrap">
          <button className="btn" onClick={() => requireLogin()}><Icon name="user" size={20} /> Đăng nhập / Đăng ký</button>
          <Link to="/build" className="btn ghost">Vào xưởng in</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {head('Mở lại một mẫu đã lưu, sửa chữ, màu, size rồi bỏ vào hộp. Mẫu lưu không cần shop duyệt, chỉ duyệt khi đặt đơn.')}
      {err && <p className="error">{err}</p>}
      {!list && !err && <p className="muted">Đang tải…</p>}
      {list && !list.length && (
        <div className="card center"><p>Chưa có mẫu nào. Thiết kế một chiếc áo ưng ý rồi bấm “Lưu vào Mẫu của tôi” trong Xưởng in.</p><Link to="/build" className="btn">Vào xưởng in</Link></div>
      )}
      {list && list.length > 0 && (
        <div className="design-grid">
          {list.map((d) => {
            const design = designFromOrder(d);
            return (
              <article key={d.id} className="design-card">
                <button type="button" className="design-shot" onClick={() => use(d)} title="Mở mẫu này trong Xưởng in">
                  <TeePreview width={230} design={design} />
                </button>
                <div className="design-info">
                  <h3>{d.name}</h3>
                  <span className="muted small">Lưu {dmyhm(d.createdAt)} · từ {k(priceOf(pricing, withLayout(design).layers.length, 'SPY'))}</span>
                </div>
                <div className="row gap-xs wrap">
                  <button type="button" className="btn small" onClick={() => use(d)}><Icon name="artist-palette" size={18} /> Dùng mẫu này</button>
                  <button type="button" className="btn small ghost danger" onClick={() => remove(d)}><Icon name="trash" size={18} /> Xóa</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
