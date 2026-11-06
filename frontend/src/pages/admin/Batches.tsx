import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { designFromOrder, downloadPrintFile } from '../../lib/art';
import type { StaffUser } from '../../lib/types';
import { MemePhoto } from '../../components/Canvases';
import { AuthorTag, GiftCard } from '../../components/Cards';
import { Icon } from '../../components/Fun';
import { StatusBadge, dmy, dmyhm, vnd } from '../../components/ui';
import { AdminHead, BATCH_LABEL, isAdmin, useFlash, useLoad } from './common';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const isPaid = (s: string) => !['PENDING_APPROVAL', 'PENDING_PAYMENT', 'CANCELLED'].includes(s);

/** Đợt pre-order: bảng gửi xưởng (màu × size), bốc khô gấu, file in, tag & thiệp để in, đóng đợt. */
export default function Batches({ user }: { user: StaffUser }) {
  const [batches, reloadBatches] = useLoad(() => api.admin.batches(), []);
  const [batchId, setBatchId] = useState<number | null>(null);
  useEffect(() => { if (batches && batchId == null) setBatchId(batches.find((b) => b.status !== 'OPEN')?.id ?? batches[0]?.id ?? null); }, [batches]);
  const [data, reload] = useLoad(async () => batchId == null ? null
    : { orders: await api.admin.orders({ batchId }), summary: await api.admin.summary(batchId) }, [batchId]);
  const [forms] = useLoad(() => api.spyForms(), []);
  const [printing, setPrinting] = useState(false);
  const flash = useFlash();
  const batch = batches?.find((b) => b.id === batchId);
  const paid = data?.orders.filter((o) => isPaid(o.status)) ?? [];
  const missingKey = paid.filter((o) => !o.keychainDesign).length;

  return (
    <>
      <AdminHead title="Đợt & xưởng in" sub="Chốt đợt Chủ nhật 23:59 → gửi xưởng in T2–T4 → đóng hộp T5 → giao T5–T6.">
        <select value={batchId ?? ''} onChange={(e) => setBatchId(+e.target.value)} aria-label="Chọn đợt">
          {batches?.map((b) => <option key={b.id} value={b.id}>{b.code} · {BATCH_LABEL[b.status] ?? b.status}</option>)}
        </select>
      </AdminHead>
      {flash.node}
      {batch && data && <>
        <div className="ad-kpis">
          <div className="ad-kpi"><span>Mở → chốt</span><b className="small-b">{dmy(batch.openAt)} → {dmyhm(batch.closeAt)}</b></div>
          <div className="ad-kpi"><span>Giao dự kiến</span><b className="small-b">{dmy(batch.deliveryFrom)}–{dmy(batch.deliveryTo)}</b></div>
          <div className="ad-kpi"><span>Đơn đã thanh toán</span><b>{data.summary.paidOrders}/{data.summary.totalOrders}</b></div>
          <div className="ad-kpi"><span>Doanh thu</span><b>{vnd(data.summary.revenue)}</b></div>
        </div>

        <div className="ad-toolbar">
          <button className="btn small" disabled={batch.status === 'OPEN' || !missingKey}
            title={batch.status === 'OPEN' ? 'Bốc sau khi chốt đợt' : ''}
            onClick={() => flash.run(() => api.admin.assignKeychains(batch.id).then(reload), 'Đã bốc khô gấu cho các đơn đã thanh toán')}>
            <Icon name="cube" size={18} /> Bốc khô gấu ({missingKey} đơn chưa có)
          </button>
          <button className="btn ghost small" onClick={() => setPrinting(!printing)}><Icon name="printer" size={18} /> {printing ? 'Ẩn' : 'Xem'} tag & thiệp để in</button>
          {isAdmin(user) && batch.status === 'OPEN' && (
            <button className="btn ghost small danger" onClick={() => {
              if (!confirm(`Chốt đợt ${batch.code} ngay bây giờ? Khách sẽ không sửa/hủy được đơn của đợt này nữa.`)) return;
              flash.run(async () => { const n = await api.admin.closeCurrent(); await reloadBatches(); setBatchId(batch.id); return n; }, 'Đã chốt đợt và mở đợt tuần sau');
            }}><Icon name="lock" size={18} /> Chốt đợt ngay</button>
          )}
        </div>

        <section className="ad-card">
          <h2>Bảng gửi xưởng in (màu × size, đơn đã thanh toán)</h2>
          <div className="table-wrap">
            <table className="ad-table compact">
              <thead><tr><th>Màu áo</th>{SIZES.map((s) => <th key={s}>{s}</th>)}<th>Tổng</th></tr></thead>
              <tbody>{Object.entries(data.summary.colorBySize).map(([color, m]) => (
                <tr key={color}><td>{color}</td>{SIZES.map((s) => <td key={s}>{m[s] ?? ''}</td>)}<td><b>{Object.values(m).reduce((a, b) => a + b, 0)}</b></td></tr>
              ))}</tbody>
            </table>
          </div>
          {!paid.length && <p className="muted">Chưa có đơn đã thanh toán.</p>}
        </section>

        <section className="ad-card">
          <h2>Đơn trong đợt</h2>
          <div className="table-wrap">
            <table className="ad-table">
              <thead><tr><th>Mã</th><th>Áo</th><th>Tag</th><th>Khô gấu</th><th>Trạng thái</th><th>File in</th></tr></thead>
              <tbody>{data.orders.map((o) => (
                <tr key={o.code}>
                  <td><Link to={`/admin/orders/${o.code}`} className="mono">{o.code}</Link></td>
                  <td><div className="row gap-xs"><MemePhoto slug={o.memeSlug} size={32} /><span className="small">{o.colorName} · {o.sizeCode}</span></div></td>
                  <td className="small">{o.giverName} → {o.recipientName}</td>
                  <td className="small">{o.keychainDesign ?? <span className="muted">—</span>}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{isPaid(o.status) && <button className="btn tiny ghost" onClick={() => downloadPrintFile(designFromOrder(o), `${o.code}_${o.colorName}_${o.sizeCode}.png`)}>PNG</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        {printing && (
          <section className="print-area">
            <div className="row gap"><h2>Tag & thiệp đợt {batch.code}</h2><button className="btn small" onClick={() => window.print()}><Icon name="printer" size={18} /> In</button></div>
            <div className="cards-grid">{paid.map((o) => (
              <div key={o.code} className="print-pair">
                <span className="small muted">{o.code}</span>
                <AuthorTag giver={o.giverName} recipient={o.recipientName} width={170} />
                <GiftCard style={o.cardStyle ?? 'SPY'} giver={o.giverName} recipient={o.recipientName} message={o.cardMessage ?? ''}
                  confession={forms?.find((f) => f.id === o.spyTemplateId)?.confessionText ?? ''} memeSlug={designFromOrder(o).layers?.[0]?.slug ?? o.memeSlug ?? undefined} width={270} />
              </div>
            ))}</div>
          </section>
        )}
      </>}
    </>
  );
}
