import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { designFromOrder } from '../lib/art';
import type { Order, OrderStatus, PaymentQr, SpyForm } from '../lib/types';
import { TeePreview } from '../components/Canvases';
import { AuthorTag, CARD_STYLES, GiftCard } from '../components/Cards';
import { ContentBadge, StatusBadge, dmy, dmyhm, vnd } from '../components/ui';
import { Icon } from '../components/Fun';

const STEPS: OrderStatus[] = ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'PAID', 'PRINTING', 'PACKING', 'SHIPPING', 'DELIVERED'];
const STEP_LABEL = ['Chờ duyệt', 'Thanh toán', 'Đã nhận tiền', 'In áo', 'Đóng hộp', 'Đang giao', 'Đã giao'];
const editable = (o: Order) => ['PENDING_APPROVAL', 'PENDING_PAYMENT'].includes(o.status) && o.batch.status === 'OPEN';
const cancellable = (o: Order) => ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'PAID'].includes(o.status) && o.batch.status === 'OPEN';

/** Lời nhắn cho khách theo trạng thái đơn. */
export function nextHint(o: Order): { tone: 'info' | 'warn' | 'ok'; text: string } | null {
  if (o.status === 'PENDING_APPROVAL') return o.contentStatus === 'NEEDS_EDIT'
    ? { tone: 'warn', text: `Shop cần bạn sửa: ${o.reviewNote ?? 'xem ghi chú'}. Sửa xong đơn được duyệt lại.` }
    : { tone: 'info', text: 'Shop đang duyệt thiết kế (chữ, ảnh, lời nhắn). Duyệt xong bạn sẽ thấy mã VietQR để thanh toán.' };
  if (o.status === 'PENDING_PAYMENT') return { tone: 'ok', text: 'Thiết kế đã được duyệt! Chuyển khoản theo mã VietQR để đơn vào đợt in.' };
  if (o.status === 'PAID') return { tone: 'ok', text: 'Đã nhận tiền. Áo sẽ được in sau khi chốt đợt.' };
  return null;
}

export default function OrderPage() {
  const { code = '' } = useParams();
  const { customer, requireLogin } = useAuth();
  const nav = useNavigate();
  const [o, setO] = useState<Order | null>(null);
  const [qr, setQr] = useState<PaymentQr | null>(null);
  const [forms, setForms] = useState<SpyForm[]>([]);
  const [err, setErr] = useState('');
  const state = useLocation().state as { fresh?: boolean; edited?: boolean } | null;
  useEffect(() => {
    if (!customer) return;
    setErr(''); setQr(null);
    api.customer.order(code).then((x) => {
      setO(x);
      if (x.status === 'PENDING_PAYMENT') api.customer.paymentQr(code).then(setQr).catch(() => undefined);
    }).catch((e) => setErr(e.message));
  }, [code, customer?.id]);
  useEffect(() => { api.spyForms().then(setForms).catch(() => undefined); }, []);

  if (!customer) return (
    <div className="page narrow">
      <div className="page-head"><Icon name="lock" size={56} /><div><h1>Hộp quà {code}</h1><p className="muted">Đăng nhập bằng tài khoản đã đặt đơn để xem.</p></div></div>
      <button className="btn" onClick={() => requireLogin('Đăng nhập để xem đơn ' + code)}>Đăng nhập</button>
    </div>
  );
  if (err && !o) return <div className="page narrow"><h1>Hộp quà {code}</h1><p className="error">{err}</p><p><Link to="/my-orders">← Đơn của tôi</Link></p></div>;
  if (!o) return <div className="page">Đang tải…</div>;
  const step = STEPS.indexOf(o.status);
  const confession = forms.find((f) => f.id === o.spyTemplateId)?.confessionText ?? '';
  const design = designFromOrder(o);
  const hint = nextHint(o);

  return (
    <div className="page">
      <p className="small"><Link to="/my-orders">← Đơn của tôi</Link></p>
      {state?.fresh && <div className="callout big-callout"><Icon name="party-popper" size={40} /> Đã bỏ vào hộp! Shop sẽ duyệt thiết kế sớm, duyệt xong bạn mới cần thanh toán.</div>}
      {state?.edited && <div className="callout big-callout"><Icon name="check-mark-button" size={40} /> Đã lưu thay đổi, đơn được gửi duyệt lại.</div>}
      <div className="order-title"><h1>Hộp quà {o.code}</h1><StatusBadge status={o.status} /><ContentBadge status={o.contentStatus} /></div>
      {err && <p className="error">{err}</p>}
      {o.status !== 'CANCELLED' && (
        <ol className="steps">{STEP_LABEL.map((s, i) => <li key={s} className={i <= step ? 'done' : ''}>{i === step && <Icon name="package" size={26} className="moving-box" />}{s}</li>)}</ol>
      )}
      {hint && <p className={`hint hint-${hint.tone}`}>{hint.text}</p>}
      <div className="two-col">
        <div className="order-visual">
          <TeePreview design={design} width={320} tag={{ giver: o.giverName, recipient: o.recipientName }} />
          <div className="flatlay">
            <GiftCard style={o.cardStyle ?? 'SPY'} giver={o.giverName} recipient={o.recipientName} message={o.cardMessage ?? ''}
              confession={confession} memeSlug={design.layers?.[0]?.slug ?? o.memeSlug ?? undefined} width={300} />
            <AuthorTag giver={o.giverName} recipient={o.recipientName} width={170} />
          </div>
        </div>
        <div>
          {qr && o.status === 'PENDING_PAYMENT' && (
            <div className="receipt">
              <div className="receipt-head">BOCBOX · HÓA ĐƠN</div>
              <div className="receipt-line"><span>1 box quà meme</span><span>{vnd(qr.amount)}</span></div>
              <div className="receipt-line"><span>Thiết kế áo</span><span>0đ</span></div>
              <div className="receipt-line total"><span>TỔNG</span><span>{vnd(qr.amount)}</span></div>
              <img className="qr" src={qr.qrImageUrl} alt="Mã VietQR" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <p>Chuyển khoản tới <b>{qr.accountName}</b> · STK <b>{qr.accountNo}</b> (ngân hàng mã {qr.bankId})</p>
              <p>Nội dung chuyển khoản: <b className="mono">{qr.transferContent}</b></p>
              <p className="muted small">Nhóm xác nhận thủ công. Đơn chỉ vào sản xuất sau khi đã thanh toán. Hạn chót: {dmyhm(o.batch.closeAt)}.</p>
            </div>
          )}
          <div className="card">
            <h3>Thông tin đơn</h3>
            <dl className="info-list">
              <div><dt>Áo</dt><dd>{o.colorName}, size {o.sizeCode}, font {o.font}</dd></div>
              <div><dt>Chữ in</dt><dd>{[o.textLine1, o.textLine2].filter(Boolean).join(' / ') || 'Không in chữ'}</dd></div>
              <div><dt>Thiệp</dt><dd>{CARD_STYLES.find((c) => c.id === o.cardStyle)?.label ?? 'Thiệp điệp viên'}{o.cardMessage && <> · “{o.cardMessage}”</>}</dd></div>
              <div><dt>Đợt</dt><dd>{o.batch.code} · giao dự kiến {dmy(o.batch.deliveryFrom)}–{dmy(o.batch.deliveryTo)}</dd></div>
              <div><dt>Giao tới</dt><dd>{o.shippingName}, {o.shippingPhone}, {o.shippingAddress}</dd></div>
              {o.keychainDesign && <div><dt>Khô gấu</dt><dd>Đã bốc, bí mật tới lúc mở hộp</dd></div>}
              {o.trackingCode && <div><dt>Vận đơn</dt><dd>{o.carrier} {o.trackingCode}</dd></div>}
            </dl>
            {o.reviewNote && o.status === 'CANCELLED' && <p className="error">Lý do: {o.reviewNote}</p>}
            <div className="row gap-xs wrap" style={{ marginTop: 14 }}>
              {editable(o) && <button className="btn small" onClick={() => nav(`/build?edit=${o.code}`)}><Icon name="edit" size={18} /> Sửa thiết kế</button>}
              {cancellable(o) && (
                <button className="btn ghost small" onClick={() => {
                  if (confirm(`Hủy đơn ${o.code}? Không hoàn tác được.${o.status === 'PAID' ? ' Shop sẽ liên hệ hoàn tiền.' : ''}`))
                    api.customer.cancelOrder(o.code).then(setO).catch((e) => setErr(e.message));
                }}>Hủy đơn</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
