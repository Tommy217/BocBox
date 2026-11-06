import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { designFromOrder } from '../lib/art';
import type { Order } from '../lib/types';
import { TeePreview } from '../components/Canvases';
import { StatusBadge, dmy, dmyhm, vnd } from '../components/ui';
import { Icon } from '../components/Fun';
import { nextHint } from './OrderPage';

const ACTIVE = ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'PAID', 'PRINTING', 'PACKING', 'SHIPPING', 'REPRINT'];

/** Đơn của tôi: mọi đơn của tài khoản đang đăng nhập, thay cho việc tra bằng mã đơn + số điện thoại. */
export default function MyOrders() {
  const { customer, requireLogin } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!customer) { setOrders(null); return; }
    api.customer.orders().then(setOrders).catch((e) => setErr(e.message));
  }, [customer?.id]);

  if (!customer) return (
    <div className="page narrow">
      <div className="page-head"><Icon name="orders" size={56} /><div><h1>Đơn của tôi</h1><p className="muted">Đăng nhập để xem, sửa và thanh toán các hộp quà đã đặt.</p></div></div>
      <div className="card center">
        <p>Bạn đang xem với tư cách khách. Thiết kế áo không cần tài khoản, chỉ lúc đặt hộp mới cần đăng nhập.</p>
        <div className="row gap center wrap">
          <button className="btn" onClick={() => requireLogin()}><Icon name="user" size={20} /> Đăng nhập / Đăng ký</button>
          <Link to="/build" className="btn ghost">Vào xưởng in</Link>
        </div>
      </div>
    </div>
  );

  const active = (orders ?? []).filter((o) => ACTIVE.includes(o.status));
  const done = (orders ?? []).filter((o) => !ACTIVE.includes(o.status));
  return (
    <div className="page">
      <div className="page-head"><Icon name="orders" size={56} /><div><h1>Đơn của tôi</h1><p className="muted">Xin chào {customer.fullName} · {customer.phone}</p></div></div>
      {err && <p className="error">{err}</p>}
      {!orders && !err && <p className="muted">Đang tải…</p>}
      {orders && !orders.length && (
        <div className="card center"><p>Bạn chưa đặt hộp nào.</p><Link to="/build" className="btn">Thiết kế hộp đầu tiên</Link></div>
      )}
      {active.length > 0 && <OrderList title="Đang xử lý" list={active} />}
      {done.length > 0 && <OrderList title="Đã giao / đã hủy" list={done} />}
    </div>
  );
}

function OrderList({ title, list }: { title: string; list: Order[] }) {
  return (
    <section className="my-orders">
      <h2>{title} <span className="muted small">({list.length})</span></h2>
      <div className="my-order-grid">
        {list.map((o) => {
          const hint = nextHint(o);
          return (
            <Link key={o.code} to={`/orders/${o.code}`} className="my-order">
              <TeePreview design={designFromOrder(o)} width={110} />
              <div className="my-order-info">
                <div className="row gap-xs wrap"><b className="mono">{o.code}</b><StatusBadge status={o.status} /></div>
                <span>{o.giverName} → {o.recipientName} · {o.colorName}, size {o.sizeCode}</span>
                <span className="muted small">Đặt {dmyhm(o.createdAt)} · đợt {o.batch.code} · giao {dmy(o.batch.deliveryFrom)}–{dmy(o.batch.deliveryTo)} · {vnd(o.price)}</span>
                {hint && <span className={`hint hint-${hint.tone} small`}>{hint.text}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
