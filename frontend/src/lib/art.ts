// Mockup áo từ ảnh áo trắng thật + ảnh meme trong public/, xuất file in A4 300 dpi.
// Khô gấu và mascot dùng ảnh thật (lib/khoGau.ts), không còn vẽ bằng canvas.
import type { Design, MemeLayer, TextBlock } from './types';
import { drawLabel, LABEL_RATIO } from './paper';
import { API_BASE } from './api';

const BASE = import.meta.env.BASE_URL;

/**
 * Ảnh của một lớp trên áo theo slug:
 * - "u:{uuid}": ảnh khách đã tải lên server (đơn đã đặt), lấy từ API.
 * - "local:{id}": ảnh khách vừa chọn trên máy, chưa gửi lên (khách vãng lai / chưa bấm đặt); giữ dạng data URL trong nháp.
 * - còn lại: meme có sẵn trong public/memes.
 */
export const UPLOAD_PREFIX = 'u:', LOCAL_PREFIX = 'local:';
const localImages = new Map<string, string>();
export const registerLocalImage = (id: string, dataUrl: string) => { localImages.set(id, dataUrl); };
export const isUserImage = (slug: string) => slug.startsWith(UPLOAD_PREFIX) || slug.startsWith(LOCAL_PREFIX);
export const memeSrc = (slug: string) =>
  slug.startsWith(UPLOAD_PREFIX) ? `${API_BASE}/uploads/${slug.slice(UPLOAD_PREFIX.length)}`
  : slug.startsWith(LOCAL_PREFIX) ? localImages.get(slug.slice(LOCAL_PREFIX.length)) ?? ''
  : `${BASE}memes/${slug}.jpg`;
/**
 * Ảnh áo phông trơn dáng boxy oversize, trải phẳng, nền trong suốt (1100 × 943). Tách nền từ ảnh sản phẩm tham khảo
 * và chuyển sang áo trắng để nhuộm màu; CHỈ DÙNG DEMO MÔN HỌC, bán thật thì thay bằng ảnh áo phôi nhóm tự chụp.
 */
export const TEE_SRC = `${BASE}mockup/tee-boxy.png`;
const TEE_W = 1100, TEE_H = 943;
export const TEE_RATIO = TEE_H / TEE_W;

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  if (!images.has(src)) {
    images.set(src, new Promise((ok, fail) => {
      const img = new Image();
      // ảnh tải lên nằm ở máy chủ API (khác cổng): xin CORS để canvas không bị "tainted" khi xuất file in
      if (/^https?:/.test(src) && !src.startsWith(window.location.origin)) img.crossOrigin = 'anonymous';
      img.onload = () => ok(img); img.onerror = () => { images.delete(src); fail(new Error(`Không tải được ảnh ${src}`)); }; img.src = src;
    }));
  }
  return images.get(src)!;
}

type Ctx = CanvasRenderingContext2D;
const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};
export const textColorFor = (shirtHex: string) => (isDark(shirtHex) ? '#FFFFFF' : '#2B2118');

/**
 * Vùng in A4 giữa ngực, theo tỉ lệ ảnh áo: [trái, trên, rộng, cao] (350 × 495 px trên ảnh 1100 × 943).
 * Bố cục thiết kế lưu theo tỉ lệ vùng in, nên đổi ảnh áo không làm lệch thiết kế đã lưu.
 */
export const PRINT_BOX = [371 / TEE_W, 165 / TEE_H, 350 / TEE_W, 495 / TEE_H] as const;
/** Rộng / cao của vùng in tính bằng pixel ảnh áo (≈ tỉ lệ A4). */
export const PRINT_RATIO = (PRINT_BOX[2] * TEE_W) / (PRINT_BOX[3] * TEE_H);
export const MAX_LAYERS = 4;
export const DEFAULT_TEXT: TextBlock = { x: 0.5, y: 0.82, s: 0.075 };
/** Áo trơn để bắt đầu thiết kế khi khách chưa chọn mẫu nào. */
export const BLANK_DESIGN: Design = { memeSlug: '', colorHex: '#FFFFFF', textLine1: '', textLine2: '', font: 'Baloo 2', position: 'CENTER', layers: [], text: DEFAULT_TEXT };
export const isBlankDesign = (d: Design) => !withLayout(d).layers.length && !d.textLine1.trim() && !d.textLine2.trim();

/** Bố cục đầy đủ của thiết kế; thiết kế cũ (chỉ có memeSlug + position) được đổi sang lớp tương đương. */
export function withLayout(d: Design): { layers: MemeLayer[]; text: TextBlock } {
  if (d.layers) return { layers: d.layers, text: d.text ?? DEFAULT_TEXT }; // có thể là áo trống (0 lớp)
  if (!d.memeSlug) return { layers: [], text: d.text ?? DEFAULT_TEXT };
  if (d.position === 'CHEST') return { layers: [{ slug: d.memeSlug, x: 0.78, y: 0.12, w: 0.3 }], text: { x: 0.78, y: 0.28, s: 0.03 } };
  return { layers: [{ slug: d.memeSlug, x: 0.5, y: 0.36, w: 0.95 }], text: DEFAULT_TEXT };
}

/** Chiều cao lớp meme theo tỉ lệ chiều cao vùng in, khi biết tỉ lệ cao/rộng của ảnh. */
export const layerHeight = (l: MemeLayer, aspect: number) => l.w * aspect * PRINT_RATIO;

/** Vẽ phần in (các lớp meme + khối chữ) trong khung w×h tại (x, y). Dùng chung cho mockup và file in. */
export function drawPrint(c: Ctx, d: Design, imgs: Map<string, HTMLImageElement>, x: number, y: number, w: number, h: number) {
  const { layers, text } = withLayout(d);
  for (const l of layers) {
    const img = imgs.get(l.slug); if (!img) continue;
    const dw = l.w * w, dh = dw * img.naturalHeight / img.naturalWidth;
    c.drawImage(img, x + l.x * w - dw / 2, y + l.y * h - dh / 2, dw, dh);
  }
  const fs = text.s * h, cx = x + text.x * w, cy = y + text.y * h, both = !!(d.textLine1 && d.textLine2);
  c.save();
  c.fillStyle = textColorFor(d.colorHex); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `800 ${fs}px "${d.font}", sans-serif`;
  if (d.textLine1) c.fillText(d.textLine1, cx, both ? cy - fs * 0.55 : cy, w);
  c.font = `600 ${fs * 0.8}px "${d.font}", sans-serif`;
  if (d.textLine2) c.fillText(d.textLine2, cx, d.textLine1 ? cy + fs * 0.6 : cy, w);
  c.restore();
}

/** Tải ảnh của mọi lớp meme trong thiết kế (ảnh lỗi thì bỏ qua). */
export async function loadLayerImages(d: Design) {
  const slugs = [...new Set(withLayout(d).layers.map((l) => l.slug))];
  const imgs = await Promise.all(slugs.map((s) => loadImage(memeSrc(s)).catch(() => null)));
  return new Map(slugs.flatMap((s, i) => (imgs[i] ? [[s, imgs[i]!] as const] : [])));
}

/** Author tag may ngoài áo, gấu áo bên trái phía trước: tâm (x, y) và bề rộng theo tỉ lệ ảnh áo. */
export const TAG_SPOT = { x: 0.275, y: 0.9, w: 0.12, angle: -0.05 };
export type TagNames = { giver: string; recipient: string };

/** Mockup áo: ảnh áo trơn nhuộm theo màu đã chọn + phần in + author tag (nếu có). */
export function drawTee(c: Ctx, d: Design, W: number, H: number, tee: HTMLImageElement, imgs: Map<string, HTMLImageElement>, tag?: TagNames) {
  c.clearRect(0, 0, W, H);
  c.drawImage(tee, 0, 0, W, H);
  const white = d.colorHex.toUpperCase() === '#FFFFFF';
  if (!white) {
    // nhuộm: nhân màu lên ảnh để giữ nếp vải, rồi cắt lại theo hình áo
    c.save();
    c.globalCompositeOperation = 'multiply'; c.fillStyle = d.colorHex; c.fillRect(0, 0, W, H);
    if (isDark(d.colorHex)) { // áo tối: phủ lại ảnh gốc kiểu overlay để còn thấy nếp vải
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; c.drawImage(tee, 0, 0, W, H); c.globalAlpha = 1;
    }
    c.globalCompositeOperation = 'destination-in'; c.drawImage(tee, 0, 0, W, H);
    c.restore();
  }
  // vẽ phần in ra canvas riêng (các lớp đè nhau như in thật), rồi mới trộn lên vải
  const [bx, by, bw, bh] = PRINT_BOX;
  const off = document.createElement('canvas'); off.width = c.canvas.width; off.height = c.canvas.height;
  const oc = off.getContext('2d')!; oc.setTransform(c.getTransform());
  drawPrint(oc, d, imgs, bx * W, by * H, bw * W, bh * H);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (!isDark(d.colorHex)) c.globalCompositeOperation = 'multiply'; // mực ăn vào vải, thấy được nếp áo
  c.drawImage(off, 0, 0);
  c.restore();
  if (tag) {
    const w = TAG_SPOT.w * W, h = w / LABEL_RATIO;
    c.save(); c.translate(TAG_SPOT.x * W, TAG_SPOT.y * H); c.rotate(TAG_SPOT.angle);
    drawLabel(c, -w / 2, -h / 2, w, h, tag.giver, tag.recipient);
    c.restore();
  }
}

export async function ensureFonts() {
  if (!('fonts' in document)) return;
  await Promise.all(['Baloo 2', 'Be Vietnam Pro', 'Patrick Hand'].flatMap((f) => [
    document.fonts.load(`800 40px "${f}"`), document.fonts.load(`600 40px "${f}"`), document.fonts.load(`400 40px "${f}"`)])).catch(() => undefined);
}

/** Xuất file in PNG A4 300 dpi (2480 × 3508), nền trong suốt, để gửi xưởng DTF. */
export async function downloadPrintFile(d: Design, fileName: string) {
  await ensureFonts();
  const imgs = await loadLayerImages(d);
  const cv = document.createElement('canvas'); cv.width = 2480; cv.height = 3508;
  const c = cv.getContext('2d')!;
  drawPrint(c, d, imgs, 120, 175, 2240, 3158); // lề 120 px, vùng in giữ tỉ lệ A4
  const url = cv.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
}

/** Thiết kế dạng gửi lên API: bố cục đi trong layoutJson, memeSlug = lớp đầu tiên. */
export function toOrderDesign(d: Design) {
  const { layers, text } = withLayout(d);
  const { layers: _l, text: _t, ...rest } = d;
  return { ...rest, memeSlug: layers[0]?.slug ?? '', position: 'CENTER' as const, layoutJson: JSON.stringify({ layers, text }) };
}

/** Thiết kế dựng lại từ đơn đã lưu (đơn cũ không có layoutJson vẫn hiển thị được). */
export function designFromOrder(o: { memeSlug: string | null; colorHex: string; textLine1: string | null; textLine2: string | null; font: string; position: 'CHEST' | 'CENTER'; layoutJson?: string | null }): Design {
  let layout: { layers?: MemeLayer[]; text?: TextBlock } = {};
  try { layout = o.layoutJson ? JSON.parse(o.layoutJson) : {}; } catch { /* bố cục hỏng → dùng mặc định */ }
  return { memeSlug: o.memeSlug ?? '', colorHex: o.colorHex, textLine1: o.textLine1 ?? '', textLine2: o.textLine2 ?? '', font: o.font, position: o.position, ...layout };
}
