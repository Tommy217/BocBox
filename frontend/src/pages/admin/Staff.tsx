import { useState } from 'react';
import { api } from '../../lib/api';
import { clearSession } from '../../lib/session';
import type { NewStaff, StaffRow, StaffUser } from '../../lib/types';
import { dmyhm } from '../../components/ui';
import { AdminHead, ROLE_LABEL, useFlash, useLoad } from './common';

const EMPTY: NewStaff = { username: '', displayName: '', role: 'STAFF', password: '' };

/** Quản lý nhân viên (chỉ ADMIN): thêm, đổi tên/quyền, khóa, đặt lại mật khẩu. Không xóa để giữ lịch sử. */
export function Staff({ me }: { me: StaffUser }) {
  const [rows, reload, err] = useLoad(() => api.admin.staff(), []);
  const [form, setForm] = useState<NewStaff>(EMPTY);
  const [resetFor, setResetFor] = useState<StaffRow | null>(null), [newPw, setNewPw] = useState('');
  const flash = useFlash();
  const update = (r: StaffRow, p: Partial<StaffRow>, ok: string) =>
    flash.run(() => api.admin.updateStaff(r.id, { displayName: r.displayName, role: r.role, active: r.active, ...p }).then(reload), ok);

  return (
    <>
      <AdminHead title="Nhân viên" sub="Nhân viên: xử lý đơn, kho. Quản trị: thêm chốt đợt, báo cáo doanh thu, ẩn meme, quản lý tài khoản." />
      {err && <p className="error">{err}</p>}
      {flash.node}
      <section className="ad-card">
        <div className="table-wrap">
          <table className="ad-table">
            <thead><tr><th>Tài khoản</th><th>Tên hiển thị</th><th>Quyền</th><th>Đăng nhập gần nhất</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{rows?.map((r) => (
              <tr key={r.id} className={r.active ? '' : 'inactive'}>
                <td className="mono">{r.username}{r.username === me.username && <span className="muted small"> (bạn)</span>}</td>
                <td>{r.displayName}</td>
                <td>
                  <select value={r.role} aria-label={`Quyền của ${r.username}`} onChange={(e) => update(r, { role: e.target.value as StaffRow['role'] }, `Đã đổi quyền ${r.username}`)}>
                    <option value="STAFF">{ROLE_LABEL.STAFF}</option><option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
                  </select>
                </td>
                <td className="small">{r.lastLoginAt ? dmyhm(r.lastLoginAt) : <span className="muted">Chưa đăng nhập</span>}</td>
                <td>{r.active ? <span className="badge ct-APPROVED">Hoạt động</span> : <span className="badge st-CANCELLED">Đã khóa</span>}</td>
                <td className="row gap-xs">
                  <button className="btn tiny ghost" onClick={() => update(r, { active: !r.active }, r.active ? `Đã khóa ${r.username}` : `Đã mở khóa ${r.username}`)}>{r.active ? 'Khóa' : 'Mở khóa'}</button>
                  <button className="btn tiny ghost" onClick={() => { setResetFor(r); setNewPw(''); }}>Đặt lại mật khẩu</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {resetFor && (
          <form className="ad-inline-form" onSubmit={(e) => { e.preventDefault(); flash.run(() => api.admin.resetPassword(resetFor.id, newPw), `Đã đặt mật khẩu mới cho ${resetFor.username}. Báo trực tiếp cho người đó.`).then((ok) => ok && setResetFor(null)); }}>
            <label className="grow">Mật khẩu mới cho <b>{resetFor.username}</b><input type="text" minLength={8} required value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="off" /></label>
            <button className="btn small">Lưu</button>
            <button type="button" className="btn small ghost" onClick={() => setResetFor(null)}>Thôi</button>
          </form>
        )}
      </section>

      <section className="ad-card">
        <h2>Thêm nhân viên</h2>
        <form className="ad-form-grid" onSubmit={(e) => { e.preventDefault(); flash.run(() => api.admin.createStaff(form).then(reload), `Đã tạo tài khoản ${form.username}`).then((ok) => ok && setForm(EMPTY)); }}>
          <label>Tên đăng nhập<input required pattern="[a-z0-9._]{3,30}" title="3–30 ký tự: chữ thường, số, dấu chấm, gạch dưới" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} autoComplete="off" /></label>
          <label>Tên hiển thị<input required maxLength={100} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>
          <label>Quyền<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as NewStaff['role'] })}><option value="STAFF">{ROLE_LABEL.STAFF}</option><option value="ADMIN">{ROLE_LABEL.ADMIN}</option></select></label>
          <label>Mật khẩu ban đầu<input required minLength={8} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" /></label>
          <button className="btn small">Tạo tài khoản</button>
        </form>
      </section>
    </>
  );
}

/** Tài khoản của chính mình: đổi mật khẩu, đăng xuất. */
export function Account({ user }: { user: StaffUser }) {
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const flash = useFlash();
  const mismatch = pw.again !== '' && pw.next !== pw.again;
  return (
    <>
      <AdminHead title="Tài khoản" sub={<>{user.displayName} · <span className="mono">{user.username}</span> · {ROLE_LABEL[user.role]} · phiên hết hạn {dmyhm(user.expiresAt)}</>} />
      {flash.node}
      <section className="ad-card narrow-card">
        <h2>Đổi mật khẩu</h2>
        <form className="ad-form-col" onSubmit={(e) => { e.preventDefault(); flash.run(() => api.auth.changePassword(pw.current, pw.next), 'Đã đổi mật khẩu').then((ok) => ok && setPw({ current: '', next: '', again: '' })); }}>
          <label>Mật khẩu hiện tại<input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          <label>Mật khẩu mới (từ 8 ký tự)<input type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          <label>Nhập lại mật khẩu mới<input type="password" required autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} /></label>
          {mismatch && <p className="error small">Hai lần nhập chưa khớp.</p>}
          <div className="row gap-xs"><button className="btn small" disabled={mismatch}>Đổi mật khẩu</button><button type="button" className="btn small ghost" onClick={clearSession}>Đăng xuất</button></div>
        </form>
      </section>
    </>
  );
}
