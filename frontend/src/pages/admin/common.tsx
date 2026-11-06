import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { StaffUser } from '../../lib/types';

/** Tải dữ liệu cho một màn quản trị; trả về [dữ liệu, tải lại, lỗi]. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): [T | null, () => Promise<void>, string] {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState('');
  const reload = useCallback(async () => {
    try { setData(await fn()); setErr(''); } catch (e) { setErr((e as Error).message); }
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [data, reload, err];
}

/** Thông báo ngắn sau một thao tác (thành công hoặc lỗi). */
export function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, okText?: string) => {
    setMsg(null);
    try { await fn(); if (okText) setMsg({ ok: true, text: okText }); return true; }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); return false; }
  };
  const node = msg && <p className={`flash ${msg.ok ? 'ok' : 'error'}`} role="status">{msg.text}</p>;
  return { run, node, setMsg };
}

export function AdminHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ad-head">
      <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      {children && <div className="ad-head-actions">{children}</div>}
    </header>
  );
}

export const isAdmin = (u: StaffUser) => u.role === 'ADMIN';
export const ROLE_LABEL = { ADMIN: 'Quản trị', STAFF: 'Nhân viên' } as const;
export const BATCH_LABEL: Record<string, string> = { OPEN: 'Đang nhận đơn', CLOSED: 'Đã chốt', PRINTING: 'Đang sản xuất', SHIPPED: 'Đã giao xong' };
