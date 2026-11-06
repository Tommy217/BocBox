import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from './api';
import { clearCustomerSession, CUSTOMER_EVENT, getCustomerSession, saveCustomerSession } from './customer';
import type { Customer } from './types';
import { Icon } from '../components/Fun';

type Ctx = {
  /** null = khách vãng lai (guest). */
  customer: Customer | null;
  /** Mở popup đăng nhập; resolve true khi đăng nhập/đăng ký xong, false nếu khách đóng popup. */
  requireLogin: (reason?: string) => Promise<boolean>;
  logout: () => void;
};
const AuthCtx = createContext<Ctx | null>(null);
export const useAuth = () => useContext(AuthCtx)!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => getCustomerSession()?.customer ?? null);
  const [modal, setModal] = useState<{ reason?: string } | null>(null);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    const sync = () => setCustomer(getCustomerSession()?.customer ?? null);
    window.addEventListener(CUSTOMER_EVENT, sync);
    window.addEventListener('storage', sync); // đăng nhập / đăng xuất ở tab khác
    if (getCustomerSession()) api.customer.me().catch(() => undefined); // phiên còn nhưng tài khoản có thể đã bị khóa
    return () => { window.removeEventListener(CUSTOMER_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const requireLogin = useCallback((reason?: string) => {
    if (getCustomerSession()) return Promise.resolve(true);
    pending.current?.(false);
    setModal({ reason });
    return new Promise<boolean>((ok) => { pending.current = ok; });
  }, []);
  const close = (ok: boolean) => { setModal(null); pending.current?.(ok); pending.current = null; };

  return (
    <AuthCtx.Provider value={{ customer, requireLogin, logout: clearCustomerSession }}>
      {children}
      {modal && <AuthModal reason={modal.reason} onDone={() => close(true)} onClose={() => close(false)} />}
    </AuthCtx.Provider>
  );
}

/** Popup đăng nhập / đăng ký tài khoản khách bằng số điện thoại. */
function AuthModal({ reason, onDone, onClose }: { reason?: string; onDone: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ phone: '', password: '', password2: '', fullName: '', email: '' });
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const phone = f.phone.replace(/\s/g, '');
    if (tab === 'register' && f.password !== f.password2) { setErr('Hai lần nhập mật khẩu chưa khớp'); return; }
    setBusy(true);
    try {
      const s = tab === 'login' ? await api.customer.login(phone, f.password)
        : await api.customer.register({ phone, password: f.password, fullName: f.fullName.trim(), email: f.email.trim() });
      saveCustomerSession(s);
      onDone();
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal auth-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" className="modal-x" onClick={onClose} aria-label="Đóng">×</button>
        <div className="auth-head"><Icon name="wrapped-gift" size={34} /><h2 id="auth-title">{tab === 'login' ? 'Đăng nhập BocBox' : 'Tạo tài khoản BocBox'}</h2></div>
        {reason && <p className="callout small">{reason}</p>}
        <div className="auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'on' : ''} onClick={() => { setTab('login'); setErr(''); }}>Đăng nhập</button>
          <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'on' : ''} onClick={() => { setTab('register'); setErr(''); }}>Đăng ký</button>
        </div>
        {tab === 'register' && <label>Họ tên<input required maxLength={100} autoComplete="name" value={f.fullName} onChange={set('fullName')} placeholder="Nguyễn Minh" /></label>}
        <label>Số điện thoại<input required autoFocus inputMode="tel" autoComplete="tel" pattern="0\d{9}" title="10 số, bắt đầu bằng 0" value={f.phone} onChange={set('phone')} placeholder="09xxxxxxxx" /></label>
        <label>Mật khẩu<input required type="password" minLength={tab === 'register' ? 8 : undefined} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} /></label>
        {tab === 'register' && <>
          <label>Nhập lại mật khẩu<input required type="password" minLength={8} autoComplete="new-password" value={f.password2} onChange={set('password2')} /></label>
          <label>Email nhận thông báo (không bắt buộc)<input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></label>
        </>}
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Đang xử lý…' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
        <p className="muted small center">
          {tab === 'login'
            ? <>Chưa có tài khoản? <button type="button" className="link-btn" onClick={() => setTab('register')}>Đăng ký bằng số điện thoại</button></>
            : <>Đã có tài khoản? <button type="button" className="link-btn" onClick={() => setTab('login')}>Đăng nhập</button></>}
        </p>
      </form>
    </div>
  );
}
