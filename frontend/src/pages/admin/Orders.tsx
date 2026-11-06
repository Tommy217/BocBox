import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { designFromOrder, downloadPrintFile, isUserImage, memeSrc, withLayout } from '../../lib/art';
import { NEXT_STATUS, STATUS_LABEL, type Order, type OrderStatus } from '../../lib/types';
import { MemePhoto, TeePreview } from '../../components/Canvases';
import { AuthorTag, CARD_STYLES, GiftCard } from '../../components/Cards';
import { Icon } from '../../components/Fun';
import { ContentBadge, StatusBadge, dmy, dmyhm, vnd } from '../../components/ui';
import { AdminHead, useFlash, useLoad } from './common';


/** Cần quản trị xem: đơn mới chờ duyệt, hoặc đơn đã trả tiền mà nội dung chưa đạt (vd. in lại). */
const needsReview = (o: Order) => o.status === 'PENDING_APPROVAL' || (o.contentStatus !== 'APPROVED' && ['PAID', 'REPRINT'].includes(o.status));

export function Orders() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const batchId = params.get('batch') ? +params.get('batch')! : undefined;
  const status = params.get('status') ?? '', review = params.get('review') === '1';
  const [q, setQ] = useState(params.get('q') ?? '');
  const [batches] = useLoad(() => api.admin.batches(), []);
  const [orders, reload, err] = useLoad(() => api.admin.orders({ batchId, status, q: params.get('q') ?? '' }), [batchId, status, params.get('q')]);
  const flash = useFlash();
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const list = (orders ?? []).filter((o) => !review || needsReview(o));

  return (
    <>
      <AdminHead title="Đơn hàng" sub={orders ? `${list.length} đơn` : 'Đang tải…'} />
      <form className="ad-filters" onSubmit={(e) => { e.preventDefault(); set('q', q.trim()); }}>
        <label className="grow">Tìm<input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã đơn, tên, số điện thoại…" /></label>
        <label>Đợt<select value={batchId ?? ''} onChange={(e) => set('batch', e.target.value)}>
          <option value="">Tất cả đợt</option>
          {batches?.map((b) => <option key={b.id} value={b.id}>{b.code}{b.status === 'OPEN' ? ' (đang mở)' : ''}</option>)}
        </select></label>
        <label>Trạng thái<select value={status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Tất cả</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select></label>
        <label className="check"><input type="checkbox" checked={review} onChange={(e) => set('review', e.target.checked ? '1' : '')} /> Chỉ đơn cần duyệt</label>
        <button className="btn small">Lọc</button>
      </form>
      {err && <p className="error">{err}</p>}
      {flash.node}
      <div className="table-wrap">
        <table className="ad-table">
          <thead><tr><th>Mã đơn</th><th>Áo</th><th>Người tặng → nhận</th><th>Đợt</th><th>Trạng thái</th><th>Nội dung</th><th /></tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.code} onClick={() => nav(`/admin/orders/${o.code}`)} className="click">
              <td><b className="mono">{o.code}</b><br /><span className="muted small">{dmyhm(o.createdAt)}</span></td>
              <td><div className="row gap-xs"><MemePhoto slug={o.memeSlug} size={36} /><span className="small">{o.colorName} · {o.sizeCode}</span></div></td>
              <td>{o.giverName} → {o.recipientName}<br /><span className="muted small">{o.customerPhone ? `TK ${o.customerPhone}` : o.shippingPhone}</span></td>
              <td className="small">{o.batch.code}</td>
              <td><StatusBadge status={o.status} /></td>
              <td><ContentBadge status={o.contentStatus} /></td>
              <td onClick={(e) => e.stopPropagation()}>
                {o.status === 'PENDING_APPROVAL' && <Link className="btn tiny" to={`/admin/orders/${o.code}`}>Duyệt</Link>}
                {o.status === 'PENDING_PAYMENT' && <button className="btn tiny" onClick={() => flash.run(() => api.admin.confirmPayment(o.code).then(reload), `Đã xác nhận tiền đơn ${o.code}`)}>Đã nhận tiền</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
        {orders && !list.length && <p className="muted">Không có đơn nào khớp bộ lọc.</p>}
      </div>
    </>
  );
}

export function OrderDetail() {
  const { code = '' } = useParams();
  const [o, reload, err] = useLoad(() => api.admin.order(code), [code]);
  const [forms] = useLoad(() => api.spyForms(), []);
  const flash = useFlash();
  const [note, setNote] = useState('');
  const [reject, setReject] = useState('');
  const [ship, setShip] = useState({ carrier: 'GHTK', tracking: '' });
  if (err) return <><Link to="/admin/orders">← Đơn hàng</Link><p className="error">{err}</p></>;
  if (!o) return <p className="muted">Đang tải…</p>;

  const design = designFromOrder(o);
  const confession = forms?.find((f) => f.id === o.spyTemplateId)?.confessionText ?? '';
  const tag = { giver: o.giverName, recipient: o.recipientName };
  const act = (fn: () => Promise<unknown>, ok: string) => flash.run(async () => { await fn(); await reload(); }, ok);
  const next = NEXT_STATUS[o.status];
  const uploads = withLayout(design).layers.filter((l) => isUserImage(l.slug));

  return (
    <>
      <Link to="/admin/orders" className="small">← Đơn hàng</Link>
      <AdminHead title={`Đơn ${o.code}`} sub={<>Đặt {dmyhm(o.createdAt)} · đợt {o.batch.code} · giao {dmy(o.batch.deliveryFrom)}–{dmy(o.batch.deliveryTo)}</>}>
        <StatusBadge status={o.status} /><ContentBadge status={o.contentStatus} />
      </AdminHead>
      {flash.node}
      <div className="ad-detail">
        <div className="ad-card ad-visual">
          <TeePreview design={design} width={300} tag={tag} />
          <div className="flatlay small">
            <GiftCard style={o.cardStyle ?? 'SPY'} giver={o.giverName} recipient={o.recipientName} message={o.cardMessage ?? ''} confession={confession} memeSlug={design.layers?.[0]?.slug ?? o.memeSlug ?? undefined} width={280} />
            <AuthorTag giver={o.giverName} recipient={o.recipientName} width={150} />
          </div>
          <button className="btn ghost small" onClick={() => downloadPrintFile(design, `${o.code}_${o.colorName}_${o.sizeCode}.png`)}><Icon name="download" size={18} /> File in PNG (A4, 300 dpi)</button>
        </div>

        <div className="ad-stack">
          <section className="ad-card">
            <h2>Xử lý</h2>
            {o.status === 'PENDING_PAYMENT' && (
              <div className="ad-action">
                <p>Kiểm tra sao kê có khoản <b>{vnd(o.price)}</b> nội dung <b className="mono">{o.code}</b>.</p>
                <button className="btn small" onClick={() => act(() => api.admin.confirmPayment(o.code), 'Đã xác nhận thanh toán')}>Đã nhận tiền</button>
              </div>
            )}
            {needsReview(o) && (
              <div className="ad-action">
                <p>{o.status === 'PENDING_APPROVAL' ? <b>Đơn mới chờ duyệt.</b> : <b>Nội dung chưa đạt.</b>} Kiểm tra thiết kế bên trái:</p>
                <ul className="small review-list">
                  <li>Chữ in áo: <b>“{[o.textLine1, o.textLine2].filter(Boolean).join(' / ') || 'không có'}”</b></li>
                  {o.cardMessage && <li>Lời nhắn thiệp: “{o.cardMessage}”</li>}
                  {uploads.length > 0 && <li>{uploads.length} ảnh khách tự tải lên: kiểm tra độ nét, bản quyền, nội dung
                    <div className="row gap-xs wrap" style={{ marginTop: 6 }}>{uploads.map((l, i) => <a key={i} href={memeSrc(l.slug)} target="_blank" rel="noreferrer"><MemePhoto slug={l.slug} size={64} /></a>)}</div></li>}
                  {o.contentStatus === 'FLAGGED' && <li className="error">Bộ lọc gắn cờ từ nghi vi phạm</li>}
                </ul>
                <div className="row gap-xs wrap">
                  <button className="btn small" onClick={() => act(() => api.admin.review(o.code, true, ''), o.status === 'PENDING_APPROVAL' ? 'Đã duyệt: khách giờ thấy mã VietQR để thanh toán' : 'Đã duyệt nội dung')}>
                    <Icon name="check-mark-button" size={18} /> {o.status === 'PENDING_APPROVAL' ? 'Duyệt, nhận đơn' : 'Duyệt'}</button>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do cần sửa (khách sẽ thấy)" className="grow" />
                  <button className="btn ghost small" disabled={!note.trim()} onClick={() => act(() => api.admin.review(o.code, false, note.trim()), 'Đã báo khách sửa')}>Cần sửa</button>
                </div>
                {o.status === 'PENDING_APPROVAL' && (
                  <div className="row gap-xs wrap">
                    <input value={reject} onChange={(e) => setReject(e.target.value)} placeholder="Lý do từ chối hẳn (vd. ảnh vi phạm bản quyền)" className="grow" />
                    <button className="btn ghost small danger" disabled={!reject.trim()} onClick={() => {
                      if (confirm(`Từ chối và hủy đơn ${o.code}?`)) act(() => api.admin.setStatus(o.code, 'CANCELLED', undefined, undefined, reject.trim()), 'Đã từ chối đơn');
                    }}>Từ chối đơn</button>
                  </div>
                )}
              </div>
            )}
            {o.status !== 'PENDING_PAYMENT' && o.status !== 'PENDING_APPROVAL' && next.length > 0 && (
              <div className="ad-action">
                <p>Chuyển trạng thái</p>
                {next.includes('SHIPPING') && (
                  <div className="row gap-xs wrap">
                    <select value={ship.carrier} onChange={(e) => setShip({ ...ship, carrier: e.target.value })}><option>GHTK</option><option>GHN</option><option>Viettel Post</option></select>
                    <input value={ship.tracking} onChange={(e) => setShip({ ...ship, tracking: e.target.value })} placeholder="Mã vận đơn" className="grow" />
                  </div>
                )}
                <div className="row gap-xs wrap">
                  {next.map((s) => (
                    <button key={s} className={`btn small ${s === 'CANCELLED' || s === 'REPRINT' ? 'ghost' : ''}`}
                      disabled={s === 'SHIPPING' && !ship.tracking.trim()}
                      onClick={() => {
                        if (s === 'CANCELLED' && !confirm(`Hủy đơn ${o.code}?`)) return;
                        act(() => api.admin.setStatus(o.code, s, s === 'SHIPPING' ? ship.carrier : undefined, s === 'SHIPPING' ? ship.tracking.trim() : undefined), `Đã chuyển sang “${STATUS_LABEL[s]}”`);
                      }}>{STATUS_LABEL[s]}</button>
                  ))}
                </div>
              </div>
            )}
            {o.status === 'CANCELLED' && <p className="muted">Đơn đã hủy.</p>}
            {o.reviewNote && <p className="small error">Ghi chú: {o.reviewNote}</p>}
          </section>

          <section className="ad-card">
            <h2>Thông tin</h2>
            <dl className="info-list">
              <div><dt>Tài khoản đặt</dt><dd>{o.customerName ? `${o.customerName} · ${o.customerPhone}` : 'Đơn cũ (không có tài khoản)'}</dd></div>
              <div><dt>Người tặng → nhận</dt><dd>{o.giverName} → {o.recipientName}</dd></div>
              <div><dt>Áo</dt><dd>{o.colorName}, size {o.sizeCode}, font {o.font}</dd></div>
              <div><dt>Chữ in</dt><dd>{[o.textLine1, o.textLine2].filter(Boolean).join(' / ') || 'Không in chữ'}</dd></div>
              <div><dt>Thiệp</dt><dd>{CARD_STYLES.find((c) => c.id === o.cardStyle)?.label ?? 'Thiệp điệp viên'}{o.cardMessage && <> · “{o.cardMessage}”</>}</dd></div>
              <div><dt>Form ngụy trang</dt><dd>{forms?.find((f) => f.id === o.spyTemplateId)?.title ?? 'Không dùng'}</dd></div>
              <div><dt>Khô gấu</dt><dd>{o.keychainDesign ?? 'Chưa bốc (bốc sau khi chốt đợt)'}</dd></div>
              <div><dt>Giao tới</dt><dd>{o.shippingName} · {o.shippingPhone}<br />{o.shippingAddress}</dd></div>
              {o.email && <div><dt>Email</dt><dd>{o.email}</dd></div>}
              {o.trackingCode && <div><dt>Vận đơn</dt><dd>{o.carrier} {o.trackingCode}</dd></div>}
              <div><dt>Thanh toán</dt><dd>{vnd(o.price)}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
