// Phiên đăng nhập trang quản trị: token JWT + thông tin nhân viên, lưu trong localStorage.
import type { StaffUser } from './types';

export type Session = { token: string; user: StaffUser };
const KEY = 'bocbox:session';
export const LOGOUT_EVENT = 'bocbox:logout';

export function getSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
    if (s && new Date(s.user.expiresAt) > new Date()) return s;
  } catch { /* localStorage bị chặn hoặc dữ liệu hỏng */ }
  return null;
}
export function saveSession(s: Session) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ } }
/** Xóa phiên và báo cho trang Admin quay về màn đăng nhập. */
export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}
