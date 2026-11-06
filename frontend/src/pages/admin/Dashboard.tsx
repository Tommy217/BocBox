import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { STATUS_LABEL, type OrderStatus, type StaffUser } from '../../lib/types';
import { Icon } from '../../components/Fun';
import { MemePhoto } from '../../components/Canvases';
import { dmy, dmyhm, vnd } from '../../components/ui';
import { AdminHead, BATCH_LABEL, isAdmin, useLoad } from './common';

export default function Dashboard({ user }: { user: StaffUser }) {
  const [data, , err] = useLoad(async () => {
    const batches = await api.admin.batches();
    const open = batches.find((b) => b.status === 'OPEN') ?? batches[0];
    const [orders, summary, keys, report, memes] = await Promise.all([
      api.admin.orders({ batchId: open.id }), api.admin.summary(open.id), api.admin.keychains(),
      isAdmin(user) ? api.admin.report() : Promise.resolve(null), api.memes(),
    ]);
    // đơn của các đợt đã chốt mà chưa bốc khô gấu / chưa giao xong
    const closedTodo = (await Promise.all(batches.filter((b) => b.status !== 'OPEN').slice(0, 3).map((b) => api.admin.orders({ batchId: b.id })))).flat();
    return { open, orders, summary, keys, report, memes, closedTodo };
  }, [user.role]);

  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="muted">Đang tải…</p>;
  const { open, orders, summary, keys, report, memes, closedTodo } = data;
  const count = (st: OrderStatus) => orders.filter((o) => o.status === st).length;
  const needKey = closedTodo.filter((o) => !o.keychainDesign && !['PENDING_APPROVAL', 'PENDING_PAYMENT', 'CANCELLED'].includes(o.status)).length;
  const inProduction = closedTodo.filter((o) => ['PAID', 'PRINTING', 'PACKING', 'REPRINT'].includes(o.status)).length;
  const lowStock = keys.filter((k) => k.stockQty < 5);
  const todo = [
    { n: summary.awaitingReview, text: 'đơn mới chờ duyệt thiết kế (ok mới nhận đơn)', to: '/admin/orders?review=1', icon: 'edit' },
    { n: count('PENDING_PAYMENT'), text: 'đơn đã duyệt, chờ xác nhận chuyển khoản', to: '/admin/orders?status=PENDING_PAYMENT', icon: 'credit-card' },
    { n: inProduction, text: 'đơn đợt trước đang sản xuất', to: '/admin/batches', icon: 'printer' },
    { n: needKey, text: 'đơn đợt trước chưa bốc khô gấu', to: '/admin/batches', icon: 'cube' },
    { n: lowStock.length, text: 'mẫu khô gấu sắp hết (dưới 5)', to: '/admin/stock', icon: 'warning' },
  ];
  const maxRev = Math.max(1, ...(report?.byBatch ?? []).map((b) => b.revenue));
  const topMemes = Object.entries(report?.memePopularity ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <AdminHead title={`Chào ${user.displayName}`} sub={<>Đợt <b>{open.code}</b> · {BATCH_LABEL[open.status] ?? open.status} · chốt {dmyhm(open.closeAt)} · giao {dmy(open.deliveryFrom)}–{dmy(open.deliveryTo)}</>} />
      <div className="ad-kpis">
        <div className="ad-kpi"><span>Đơn trong đợt</span><b>{summary.totalOrders}</b></div>
        <div className="ad-kpi"><span>Đã thanh toán</span><b>{summary.paidOrders}</b></div>
        <div className="ad-kpi"><span>Doanh thu đợt</span><b>{vnd(summary.revenue)}</b></div>
        <div className="ad-kpi"><span>Đã hủy</span><b>{count('CANCELLED')}</b></div>
      </div>

      <div className="ad-grid">
        <section className="ad-card">
          <h2>Việc cần làm</h2>
          <ul className="ad-todo">
            {todo.map((t) => (
              <li key={t.text} className={t.n ? '' : 'done'}>
                <Icon name={t.n ? t.icon : 'check-mark-button'} size={20} />
                <span><b>{t.n}</b> {t.text}</span>
                {t.n > 0 && <Link to={t.to}>Xử lý →</Link>}
              </li>
            ))}
          </ul>
        </section>

        {report ? (
          <section className="ad-card">
            <h2>Doanh thu theo đợt</h2>
            <div className="ad-bars">
              {report.byBatch.slice(0, 6).reverse().map((b) => (
                <div key={b.code} className="ad-bar" title={`${b.code}: ${b.paid}/${b.orders} đơn đã thanh toán · ${vnd(b.revenue)}`}>
                  <span className="ad-bar-val">{b.paid}</span>
                  <i style={{ height: `${(b.revenue / maxRev) * 100}%` }} className={b.status === 'OPEN' ? 'open' : ''} />
                  <span className="ad-bar-label">{b.code}</span>
                </div>
              ))}
            </div>
            <p className="muted small">Cột = doanh thu, số trên cột = hộp đã thanh toán. Cột cam là đợt đang mở.</p>
            <div className="ad-progress">
              <div className="label-row"><span>Hộp đã bán so với mốc hòa vốn tháng</span><b>{report.paidBoxes}/{report.breakEvenBoxes}</b></div>
              <div className="bar"><i style={{ width: `${Math.min(100, (report.paidBoxes / report.breakEvenBoxes) * 100)}%` }} /></div>
              <p className="muted small">Tổng doanh thu {vnd(report.revenue)} · lãi gộp ước tính {vnd(report.grossProfitEstimate)}</p>
            </div>
          </section>
        ) : (
          <section className="ad-card">
            <h2>Trạng thái đơn đợt này</h2>
            <ul className="ad-status-list">
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).filter((s) => count(s)).map((s) => <li key={s}><span>{STATUS_LABEL[s]}</span><b>{count(s)}</b></li>)}
            </ul>
            <p className="muted small">Báo cáo doanh thu nhiều đợt chỉ dành cho tài khoản quản trị.</p>
          </section>
        )}

        {report && (
          <section className="ad-card">
            <h2>Meme bán chạy</h2>
            <ol className="ad-top">
              {topMemes.map(([slug, n]) => (
                <li key={slug}><MemePhoto slug={slug} size={36} /><span>{memes.find((m) => m.slug === slug)?.name ?? slug}</span><b>{n}</b></li>
              ))}
            </ol>
          </section>
        )}

        {report && (
          <section className="ad-card">
            <h2>Tất cả đơn theo trạng thái</h2>
            <ul className="ad-status-list">
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).filter((s) => report.byStatus[s]).map((s) => <li key={s}><span>{STATUS_LABEL[s]}</span><b>{report.byStatus[s]}</b></li>)}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
