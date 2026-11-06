// Phiên đăng nhập của khách (trang bán hàng): token JWT + thông tin tài khoản, lưu trong localStorage.
// Tách riêng với phiên nhân viên (lib/session.ts) để một máy vừa mở trang khách vừa mở trang quản trị không lẫn nhau.
import type { Customer } from './types';

export type CustomerSession = { token: string; customer: Customer };
const KEY = 'bocbox:customer';
export const CUSTOMER_EVENT = 'bocbox:customer-changed';

export function getCustomerSession(): CustomerSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as CustomerSession | null;
    if (s && new Date(s.customer.expiresAt) > new Date()) return s;
  } catch { /* localStorage bị chặn hoặc dữ liệu hỏng */ }
  return null;
}
export function saveCustomerSession(s: CustomerSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
  window.dispatchEvent(new Event(CUSTOMER_EVENT));
}
export function clearCustomerSession() {
  try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
  window.dispatchEvent(new Event(CUSTOMER_EVENT));
}
