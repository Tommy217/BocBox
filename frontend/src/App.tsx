import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import SpyForms from './pages/SpyForms';
import Shop from './pages/Shop';
import Builder from './pages/Builder';
import OrderPage from './pages/OrderPage';
import MyOrders from './pages/MyOrders';
import AdminApp from './pages/admin/AdminApp';
import { useAuth } from './lib/auth';
import { Icon, LoadingScreen } from './components/Fun';

// Trang chủ đã gộp phần "Trong hộp"; "Thiết kế ngay" là mục nổi bật cuối menu, tài khoản nằm góc phải.
const NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/shop', label: 'Hộp có sẵn' },
  { to: '/spy', label: 'Phòng điệp viên' },
  { to: '/my-orders', label: 'Đơn của tôi' },
];

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
          <button type="button" role="menuitem" onClick={() => { setOpen(false); logout(); }}><Icon name="logout" size={18} /> Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  // khu quản trị có khung riêng (thanh bên), không dùng đầu/chân trang bán hàng
  if (pathname.startsWith('/admin')) return <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>;
  return (
    <div className="theme-shop">
      <LoadingScreen />
      <header className="topbar">
        <NavLink to="/" className="logo"><Icon name="wrapped-gift" size={30} /><span className="logo-word">Boc<span>Box</span></span></NavLink>
        <nav aria-label="Điều hướng chính">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className="nav-pill">{n.label}</NavLink>)}
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
          <Route path="/orders/:code" element={<OrderPage />} />
          <Route path="/lookup" element={<Navigate to="/my-orders" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="foot">
        <div className="foot-brand"><Icon name="wrapped-gift" size={20} /> <b>BocBox</b> · Món quà không bao giờ nhạt</div>
        <div className="foot-links">
          <Link to="/build">Thiết kế áo</Link><Link to="/spy">Lấy size bí mật</Link><Link to="/my-orders">Đơn của tôi</Link>
          <Link to="/admin" className="foot-admin"><Icon name="lock" size={14} /> Nhân viên đăng nhập</Link>
        </div>
        <div className="foot-credit">EXE101 · SE1986 · Icon: Phosphor (MIT) · Ảnh áo: THOR, Wikimedia Commons (CC BY 2.0) · Meme: Imgflip · Ảnh bao bì tham khảo: Lazada</div>
      </footer>
    </div>
  );
}
