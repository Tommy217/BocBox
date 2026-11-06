import type { Batch, BatchSummary, CreateOrder, Customer, CustomerLoginResponse, Keychain, LoginResponse, NewCustomer, UploadResult, Meme, MemeStatus, NewStaff, Order, OrderStatus, PaymentQr, Report, ShirtColor, SizeChart, SpyForm, StaffRow, StaffUser } from './types';
import { clearSession, getSession } from './session';
import { clearCustomerSession, getCustomerSession } from './customer';

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';
const BASE = API_BASE;

/** Khớp danh sách cần đăng nhập trong SecurityConfig. Nhân viên: /admin/**, /auth/me, /auth/password. Khách: /customer/** trừ đăng ký, đăng nhập. */
const isStaffPath = (p: string) => p.startsWith('/admin') || p === '/auth/me' || p === '/auth/password';
const isCustomerPath = (p: string) => p.startsWith('/customer/') && p !== '/customer/login' && p !== '/customer/register';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(init?.body instanceof FormData)) headers['Content-Type'] = 'application/json'; // FormData tự đặt boundary
  const staff = isStaffPath(path), customer = isCustomerPath(path);
  const token = staff ? getSession()?.token : customer ? getCustomerSession()?.token : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...init, headers }).catch(() => { throw new Error('Không kết nối được máy chủ BocBox'); });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) { // token hết hạn hoặc tài khoản bị khóa → đăng xuất phía máy khách
      if (staff) clearSession();
      if (customer) clearCustomerSession();
    }
    throw new Error(body.message ?? `Lỗi ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
const post = <T,>(p: string, body?: unknown) => http<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const put = <T,>(p: string, body: unknown) => http<T>(p, { method: 'PUT', body: JSON.stringify(body) });

const realApi = {
  memes: () => http<Meme[]>('/memes'),
  colors: () => http<ShirtColor[]>('/shirt-colors'),
  sizes: () => http<SizeChart[]>('/sizes'),
  spyForms: () => http<SpyForm[]>('/spy-forms'),
  keychainSeries: () => http<string[]>('/keychain-series/current'),
  suggestSize: (heightCm: number, weightKg: number, usualSize: string) =>
    post<{ sizeCode: string; reason: string }>('/size-suggestions', { heightCm, weightKg, usualSize }),
  openBatch: () => http<Batch>('/batches/open'),
  /** Tài khoản khách: khách vãng lai xem/thiết kế tự do, đặt đơn mới cần đăng nhập. */
  customer: {
    register: (c: NewCustomer) => post<CustomerLoginResponse>('/customer/register', c),
    login: (phone: string, password: string) => post<CustomerLoginResponse>('/customer/login', { phone, password }),
    me: () => http<Customer>('/customer/me'),
    orders: () => http<Order[]>('/customer/orders'),
    order: (code: string) => http<Order>(`/customer/orders/${encodeURIComponent(code)}`),
    createOrder: (o: CreateOrder) => post<Order>('/customer/orders', o),
    updateOrder: (code: string, o: CreateOrder) => put<Order>(`/customer/orders/${encodeURIComponent(code)}`, o),
    cancelOrder: (code: string) => post<Order>(`/customer/orders/${encodeURIComponent(code)}/cancel`),
    paymentQr: (code: string) => http<PaymentQr>(`/customer/orders/${encodeURIComponent(code)}/payment-qr`),
    upload: (file: Blob, name: string) => { const f = new FormData(); f.append('file', file, name); return http<UploadResult>('/customer/uploads', { method: 'POST', body: f }); },
  },
  auth: {
    login: (username: string, password: string) => post<LoginResponse>('/auth/login', { username, password }),
    me: () => http<StaffUser>('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) => post<void>('/auth/password', { currentPassword, newPassword }),
  },
  admin: {
    batches: () => http<Batch[]>('/admin/batches'),
    closeCurrent: () => post<Batch>('/admin/batches/close-current'),
    orders: (f: { batchId?: number; status?: string; q?: string } = {}) => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
      return http<Order[]>('/admin/orders' + (qs ? `?${qs}` : ''));
    },
    order: (code: string) => http<Order>(`/admin/orders/${encodeURIComponent(code)}`),
    summary: (batchId: number) => http<BatchSummary>(`/admin/batches/${batchId}/summary`),
    confirmPayment: (code: string) => post<Order>(`/admin/orders/${code}/confirm-payment`),
    review: (code: string, approve: boolean, note: string) =>
      http<Order>(`/admin/orders/${code}/content-review`, { method: 'PATCH', body: JSON.stringify({ approve, note }) }),
    setStatus: (code: string, status: OrderStatus, carrier?: string, trackingCode?: string, note?: string) =>
      http<Order>(`/admin/orders/${code}/status`, { method: 'PATCH', body: JSON.stringify({ status, carrier, trackingCode, note }) }),
    assignKeychains: (batchId: number) => post<Order[]>(`/admin/batches/${batchId}/assign-keychains`),
    keychains: () => http<Keychain[]>('/admin/keychains'),
    setStock: (id: number, stockQty: number) => http<Keychain>(`/admin/keychains/${id}`, { method: 'PATCH', body: JSON.stringify({ stockQty }) }),
    memes: () => http<Meme[]>('/admin/memes'),
    setMemeStatus: (id: number, status: MemeStatus) => http<Meme>(`/admin/memes/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    report: () => http<Report>('/admin/reports/summary'),
    staff: () => http<StaffRow[]>('/admin/staff'),
    createStaff: (s: NewStaff) => post<StaffRow>('/admin/staff', s),
    updateStaff: (id: number, s: { displayName: string; role: 'STAFF' | 'ADMIN'; active: boolean }) =>
      http<StaffRow>(`/admin/staff/${id}`, { method: 'PUT', body: JSON.stringify(s) }),
    resetPassword: (id: number, password: string) => post<void>(`/admin/staff/${id}/reset-password`, { password }),
  },
};

export type Api = typeof realApi;
export const api: Api = realApi;
