import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import SpyForms from './pages/SpyForms';
import Shop from './pages/Shop';
import Builder from './pages/Builder';
import OrderPage from './pages/OrderPage';
import MyOrders from './pages/MyOrders';
import MyDesigns from './pages/MyDesigns';
import AdminApp from './pages/admin/AdminApp';
import { useAuth } from './lib/auth';
import { api } from './lib/api';
import { k, usePricing } from './lib/pricing';
import type { Batch } from './lib/types';
import { Icon } from './components/Fun';
import { Intro } from './components/Intro';
import { dmyhm } from './components/ui';

/** Đi tới một mục của trang chủ (vd. "kho-gau"); App cuộn tới mục đó sau khi trang chủ hiện ra. */
function useGoSection() {
  const nav = useNavigate();
  return (section: string) => nav('/', { state: { section } });
}

/** Menu thả "Hộp quà" (Figma): Áo sẵn có / Thiết kế áo / Khô gấu bí ẩn. Khô gấu không bán riêng nên chỉ dẫn tới phần giới thiệu. */
function GiftMenu() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const btn = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const nav = useNavigate(), goSection = useGoSection();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    // menu đặt "fixed" để không bị thanh menu cuộn ngang (màn nhỏ) cắt mất
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - 268)), top: r.bottom + 8 });
    const away = (e: PointerEvent) => { if (!btn.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node)) setOpen(false); };
    const close = () => setOpen(false);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    window.addEventListener('pointerdown', away); window.addEventListener('resize', close); window.addEventListener('scroll', close); window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('pointerdown', away); window.removeEventListener('resize', close); window.removeEventListener('scroll', close); window.removeEventListener('keydown', esc); };
  }, [open]);
  const go = (fn: () => void) => () => { setOpen(false); fn(); };
  const active = pathname === '/shop' || pathname === '/build' || pathname === '/my-designs';
  return (
    <>
      <button ref={btn} type="button" className={`nav-pill nav-drop ${active ? 'active' : ''}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        <Icon name="wrapped-gift" size={20} /> Hộp quà <span className={`caret ${open ? 'up' : ''}`} aria-hidden>▾</span>
      </button>
      {open && (
        <div ref={menu} className="drop-menu" role="menu" style={{ left: pos.left, top: pos.top }}>
          <button type="button" role="menuitem" onClick={go(() => nav('/shop'))}><Icon name="t-shirt" size={22} /><span><b>Áo sẵn có</b><small>12 hộp shop thiết kế sẵn, sửa được chữ và màu</small></span></button>
          <button type="button" role="menuitem" onClick={go(() => nav('/build'))}><Icon name="artist-palette" size={22} /><span><b>Thiết kế áo</b><small>Tự ghép meme, ảnh và câu đùa trong Xưởng in</small></span></button>
          <button type="button" role="menuitem" onClick={go(() => nav('/my-designs'))}><Icon name="star" size={22} /><span><b>Mẫu của tôi</b><small>Các thiết kế bạn đã lưu, mở lại dùng tiếp</small></span></button>
          <button type="button" role="menuitem" onClick={go(() => goSection('kho-gau'))}><Icon name="question" size={22} /><span><b>Khô gấu bí ẩn</b><small>Có sẵn trong mọi hộp, bốc ngẫu nhiên 1 trong 6 mẫu</small></span></button>
        </div>
      )}
    </>
  );
}

/** Dải thông báo trên cùng: đợt pre-order đang mở, free-ship, khoảng giá. */
function Announce() {
  const [batch, setBatch] = useState<Batch | null>(null);
  const pricing = usePricing();
  useEffect(() => { api.openBatch().then(setBatch).catch(() => undefined); }, []);
  const star = <Icon name="sparkles" size={16} weight="fill" className="announce-star" />;
  return (
    <div className="announce" role="note">
      <span>{batch ? <>Pre-order đợt {batch.code} đang mở · chốt {dmyhm(batch.closeAt)}</> : 'Pre-order mở mỗi thứ Hai, chốt 23:59 Chủ nhật'}</span>
      {star}<span>Free-ship Hoà Lạc</span>
      {star}<span>{k(pricing.base)}–{k(pricing.max)}/Trọn bộ quà</span>
    </div>
  );
}

/** Góc phải thanh trên: khách vãng lai thấy nút Đăng nhập; đã đăng nhập thấy tên + menu. */
function AccountMenu() {
  const { customer, requireLogin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, [open]);
  if (!customer) return (
    <button type="button" className="btn small ghost account-btn" onClick={() => requireLogin()}><Icon name="user" size={20} /> Đăng nhập</button>
  );
  const first = customer.fullName.trim().split(/\s+/).pop() ?? customer.fullName;
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-chip" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        <span className="avatar">{first.charAt(0).toUpperCase()}</span><span className="account-name">{first}</span>
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-who"><b>{customer.fullName}</b><span className="muted small">{customer.phone}</span></div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); nav('/my-orders'); }}><Icon name="orders" size={18} /> Đơn của tôi</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); nav('/my-designs'); }}><Icon name="star" size={18} /> Mẫu của tôi</button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); logout(); }}><Icon name="logout" size={18} /> Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const goSection = useGoSection();
  // đổi trang thì về đầu trang; đi tới một mục của trang chủ thì cuộn tới mục đó (chờ trang chủ dựng xong)
  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (!section) { window.scrollTo(0, 0); return; }
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(section);
      if (el || ++tries > 40) { clearInterval(t); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 50);
    return () => clearInterval(t);
  }, [location.key]);
  // khu quản trị có khung riêng (thanh bên), không dùng đầu/chân trang bán hàng
  if (location.pathname.startsWith('/admin')) return <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>;
  return (
    <div className="theme-shop">
      <Intro />
      <Announce />
      <header className="topbar">
        <NavLink to="/" className="logo" aria-label="BocBox – về trang chủ"><img src={`${import.meta.env.BASE_URL}brand/logo.png`} alt="BocBox" /></NavLink>
        <nav aria-label="Điều hướng chính">
          <button type="button" className="nav-pill nav-marker" onClick={() => goSection('trong-hop')}>Trong hộp có gì?</button>
          <GiftMenu />
          <NavLink to="/spy" className="nav-pill"><Icon name="detective" size={20} /> Phòng điệp viên</NavLink>
          <NavLink to="/my-orders" className="nav-pill"><Icon name="package" size={20} /> Đơn của tôi</NavLink>
          <NavLink to="/build" className="nav-pill nav-cta"><Icon name="artist-palette" size={18} /> Thiết kế ngay</NavLink>
        </nav>
        <AccountMenu />
      </header>
      <main className="paper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/box" element={<Navigate to="/" replace />} />
          <Route path="/spy" element={<SpyForms />} />
          <Route path="/build" element={<Builder />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-designs" element={<MyDesigns />} />
          <Route path="/orders/:code" element={<OrderPage />} />
          <Route path="/lookup" element={<Navigate to="/my-orders" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="foot">
        <div className="foot-brand"><img src={`${import.meta.env.BASE_URL}brand/logo.png`} alt="BocBox" /> Món quà không bao giờ nhạt</div>
        <div className="foot-links">
          <Link to="/build">Thiết kế áo</Link><Link to="/shop">Áo sẵn có</Link><Link to="/spy">Lấy size bí mật</Link><Link to="/my-orders">Đơn của tôi</Link><Link to="/my-designs">Mẫu của tôi</Link>
          <Link to="/admin" className="foot-admin"><Icon name="lock" size={14} /> Nhân viên đăng nhập</Link>
        </div>
        <div className="foot-credit">EXE101 · SE1986 · Icon: Phosphor (MIT) · Ảnh áo: THOR, Wikimedia Commons (CC BY 2.0) · Meme: Imgflip · Ảnh bao bì tham khảo: Lazada</div>
      </footer>
    </div>
  );
}
