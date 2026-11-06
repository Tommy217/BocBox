import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Keychain, StaffUser } from '../../lib/types';
import { KhoGauPhoto, MemePhoto } from '../../components/Canvases';
import { AdminHead, isAdmin, useFlash, useLoad } from './common';

/** Tồn kho khô gấu: sửa số lượng sau khi nhập hàng hoặc kiểm kho. */
export function Stock() {
  const [keys, reload, err] = useLoad(() => api.admin.keychains(), []);
  const [edit, setEdit] = useState<Record<number, string>>({});
  const flash = useFlash();
  useEffect(() => { if (keys) setEdit(Object.fromEntries(keys.map((k) => [k.id, String(k.stockQty)]))); }, [keys]);
  const total = keys?.reduce((s, k) => s + k.stockQty, 0) ?? 0;
  const save = (k: Keychain) => flash.run(() => api.admin.setStock(k.id, Number(edit[k.id])).then(reload), `Đã lưu tồn kho “${k.name}”`);

  return (
    <>
      <AdminHead title="Kho khô gấu" sub={`${keys?.[0]?.seriesName ?? 'Series'} · còn ${total} cái. Khô gấu được bốc ngẫu nhiên theo tồn kho khi chốt đợt.`} />
      {err && <p className="error">{err}</p>}
      {flash.node}
      <div className="ad-stock">
        {keys?.map((k) => {
          const changed = edit[k.id] !== String(k.stockQty), bad = !/^\d{1,4}$/.test(edit[k.id] ?? '');
          return (
            <div key={k.id} className={`ad-card ad-stock-item ${k.stockQty < 5 ? 'low' : ''}`}>
              <KhoGauPhoto slug={k.slug} size={88} alt={k.name} />
              <div className="grow">
                <b>{k.name}</b>
                <span className="muted small">{k.stockQty < 5 ? 'Sắp hết, cần nhập thêm' : 'Đủ hàng'}</span>
                <div className="row gap-xs">
                  <input type="number" min={0} max={9999} value={edit[k.id] ?? ''} aria-label={`Tồn kho ${k.name}`} onChange={(e) => setEdit({ ...edit, [k.id]: e.target.value })} />
                  <button className="btn tiny" disabled={!changed || bad} onClick={() => save(k)}>Lưu</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Thư viện meme: xem toàn bộ, ADMIN ẩn/hiện meme trong Xưởng in. */
export function Memes({ user }: { user: StaffUser }) {
  const [memes, reload, err] = useLoad(() => api.admin.memes(), []);
  const [report] = useLoad(() => (isAdmin(user) ? api.admin.report() : Promise.resolve(null)), [user.role]);
  const flash = useFlash();
  const shown = memes?.filter((m) => m.status === 'APPROVED').length ?? 0;
  return (
    <>
      <AdminHead title="Thư viện meme" sub={`${shown}/${memes?.length ?? 0} meme đang hiện trong Xưởng in. Ẩn meme không ảnh hưởng đơn đã đặt.`} />
      {err && <p className="error">{err}</p>}
      {flash.node}
      <div className="ad-memes">
        {memes?.map((m) => {
          const on = m.status === 'APPROVED';
          return (
            <div key={m.id} className={`ad-card ad-meme ${on ? '' : 'off'}`}>
              <MemePhoto slug={m.slug} size={120} alt={m.name} />
              <b>{m.name}</b>
              <span className="muted small">{m.tags}{report && <> · đã bán {report.memePopularity[m.slug] ?? 0}</>}</span>
              <div className="row gap-xs">
                {m.sourceUrl && <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="small">Nguồn</a>}
                {isAdmin(user)
                  ? <button className={`btn tiny ${on ? 'ghost' : ''}`} onClick={() => flash.run(() => api.admin.setMemeStatus(m.id, on ? 'REJECTED' : 'APPROVED').then(reload), on ? `Đã ẩn “${m.name}”` : `Đã hiện lại “${m.name}”`)}>{on ? 'Ẩn' : 'Hiện lại'}</button>
                  : <span className="small muted">{on ? 'Đang hiện' : 'Đã ẩn'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
