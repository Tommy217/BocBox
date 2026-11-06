import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api } from '../../lib/api';
import { clearSession, getSession, LOGOUT_EVENT, saveSession } from '../../lib/session';
import type { StaffUser } from '../../lib/types';
import { Icon } from '../../components/Fun';
import { dmyhm } from '../../components/ui';
import { isAdmin, ROLE_LABEL } from './common';
import Dashboard from './Dashboard';
import { OrderDetail, Orders } from './Orders';
import Batches from './Batches';
import { Memes, Stock } from './Catalog';
import { Account, Staff } from './Staff';

/** Khu quản trị (#/admin): đăng nhập JWT, thanh bên trái, mỗi mục một màn. */
export default function AdminApp() {
  const [user, setUser] = useState<StaffUser | null>(() => getSession()?.user ?? null);
  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener(LOGOUT_EVENT, out);
    // phiên còn trong máy nhưng tài khoản có thể đã bị khóa: hỏi lại server
    if (user) api.auth.me().catch(() => undefined);
    return () => window.removeEventListener(LOGOUT_EVENT, out);
  }, []);
  if (!user) return <AdminLogin onLogin={setUser} />;

  const nav = [
    { to: '/admin', end: true, icon: 'chart', label: 'Tổng quan' },
    { to: '/admin/orders', icon: 'orders', label: 'Đơn hàng' },
    { to: '/admin/batches', icon: 'printer', label: 'Đợt & xưởng in' },
    { to: '/admin/stock', icon: 'cube', label: 'Kho khô gấu' },
    { to: '/admin/memes', icon: 'image', label: 'Thư viện meme' },
    ...(isAdmin(user) ? [{ to: '/admin/staff', icon: 'users', label: 'Nhân viên' }] : []),
    { to: '/admin/account', icon: 'key', label: 'Tài khoản' },
  ];
  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <Link to="/admin" className="ad-brand"><Icon name="wrapped-gift" size={26} /> BocBox <span>quản trị</span></Link>
        <nav aria-label="Quản trị">
          {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className="ad-link"><Icon name={n.icon} size={20} />{n.label}</NavLink>)}
        </nav>
        <div className="ad-user">
          <Icon name="user" size={30} />
          <div><b>{user.displayName}</b><span>{ROLE_LABEL[user.role]} · hết phiên {dmyhm(user.expiresAt)}</span></div>
          <button className="ad-icon-btn" onClick={clearSession} title="Đăng xuất" aria-label="Đăng xuất"><Icon name="logout" size={20} /></button>
        </div>
        <Link to="/" className="ad-back small">← Về trang bán hàng</Link>
      </aside>
      <main className="ad-main">
        <Routes>
          <Route index element={<Dashboard user={user} />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:code" element={<OrderDetail />} />
          <Route path="batches" element={<Batches user={user} />} />
          <Route path="stock" element={<Stock />} />
          <Route path="memes" element={<Memes user={user} />} />
          <Route path="staff" element={isAdmin(user) ? <Staff me={user} /> : <Navigate to="/admin" replace />} />
          <Route path="account" element={<Account user={user} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (u: StaffUser) => void }) {
  const [username, setUsername] = useState(''), [password, setPassword] = useState('');
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const expired = useState(() => { try { return !!localStorage.getItem('bocbox:session'); } catch { return false; } })[0];
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const s = await api.auth.login(username, password); saveSession(s); onLogin(s.user); }
    catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="ad-login">
      <form className="ad-login-card" onSubmit={submit}>
        <div className="ad-brand"><Icon name="wrapped-gift" size={30} /> BocBox <span>quản trị</span></div>
        <h1>Đăng nhập nhân viên</h1>
        {expired && !err && <p className="muted small">Phiên đăng nhập đã hết hạn, đăng nhập lại nhé.</p>}
        <label>Tên đăng nhập<input required autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Đăng nhập'}</button>
        <p className="muted small">Sai mật khẩu 5 lần liên tiếp sẽ bị khóa đăng nhập 15 phút. Quên mật khẩu: nhờ quản trị đặt lại.</p>
        <Link to="/" className="small">← Về trang bán hàng</Link>
      </form>
    </div>
  );
}
