// Nháp thiết kế lưu trên máy (localStorage) để chuyển trang, tải lại trang hay đăng nhập giữa chừng không mất bài.
// Không lưu thông tin giao hàng. Ảnh khách tự tải lên (chưa gửi server) nằm trong `uploads` dạng data URL.
import { BLANK_DESIGN, isBlankDesign, registerLocalImage } from './art';
import type { CardStyle, Design } from './types';

export type Draft = {
  design: Design; size: string; giver: string; recipient: string; spyId: number | null;
  cardStyle?: CardStyle; cardMessage?: string;
  /** id ảnh "local:{id}" → data URL */
  uploads?: Record<string, string>;
};
const KEY = 'bocbox:draft';

export function loadDraft(): Partial<Draft> {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Draft>;
    Object.entries(d.uploads ?? {}).forEach(([id, url]) => registerLocalImage(id, url));
    return d;
  } catch { return {}; }
}

/** Lưu nháp; trả false nếu bộ nhớ trình duyệt đầy (thường do ảnh tải lên quá lớn). */
export function saveDraft(d: Draft): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; }
}
export function clearDraft() { try { localStorage.removeItem(KEY); } catch { /* bỏ qua */ } }

/** Nháp hiện tại đã có gì trên áo chưa (để hỏi trước khi thay bằng mẫu khác). */
export function hasDraftWork() {
  const d = loadDraft().design;
  return !!d && !isBlankDesign({ ...BLANK_DESIGN, ...d });
}

/**
 * Khách chọn một mẫu của shop: nếu đang có bản thiết kế dở thì hỏi trước, đồng ý mới thay.
 * Giữ lại tên người tặng/nhận, size, kiểu thiệp đã nhập. Trả về false nếu khách giữ bản cũ.
 */
export function applyTemplate(design: Design): boolean {
  if (hasDraftWork() && !window.confirm('Bạn đang có một bản thiết kế dở trong Xưởng in. Thay bằng mẫu này?')) return false;
  const old = loadDraft();
  saveDraft({ size: 'M', giver: '', recipient: '', spyId: null, ...old, design, uploads: undefined });
  return true;
}
