import type { ContentStatus, OrderStatus } from '../lib/types';
import { CONTENT_LABEL, STATUS_LABEL } from '../lib/types';

export const vnd = (n: number) => n.toLocaleString('vi-VN') + 'đ';
export const dmy = (s: string) => { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; };
export const dmyhm = (s: string) => { const d = new Date(s); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`; };

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge st-${status}`}>{STATUS_LABEL[status]}</span>;
}
export function ContentBadge({ status }: { status: ContentStatus }) {
  return <span className={`badge ct-${status}`}>{CONTENT_LABEL[status]}</span>;
}
