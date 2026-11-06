// Vẽ "đồ giấy vải" thật bằng canvas: author tag vải cotton in mực nâu (may ngoài áo) và thiệp kraft.
// Mọi chi tiết ngẫu nhiên (sợi vải, đốm mực) dùng seed theo nội dung nên vẽ lại không bị nhảy.
import type { CardStyle } from './types';

type Ctx = CanvasRenderingContext2D;
const INK = '#5b3826';           // mực nâu in nhãn vải
const PEN = '#2c2620';           // bút bi viết tay trên thiệp
const STAMP_RED = '#b8322a';

/** Số ngẫu nhiên có seed (mulberry32). */
function rng(seedText: string) {
  let a = 0;
  for (const ch of seedText) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) + 1) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Canvas phụ cùng độ phân giải với canvas đích (màn hình retina không bị mờ). */
function layer(w: number, h: number, s = 1) {
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
  const c = cv.getContext('2d')!; c.scale(s, s);
  return [cv, c] as const;
}
const scaleOf = (c: Ctx) => { const m = c.getTransform(); return Math.max(1, Math.hypot(m.a, m.b)); };

/** Làm mực trông như in thật: lỗ chỗ vài đốm, mép hơi loang. */
function inkTexture(c: Ctx, w: number, h: number, rand: () => number, density = 0.0035) {
  c.save();
  c.globalCompositeOperation = 'destination-out';
  const n = Math.round(w * h * density);
  for (let i = 0; i < n; i++) {
    c.globalAlpha = 0.15 + rand() * 0.45;
    c.beginPath(); c.arc(rand() * w, rand() * h, 0.3 + rand() * Math.max(0.6, w / 900), 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** Chữ co lại cho vừa bề rộng. */
function fitFont(c: Ctx, text: string, font: (px: number) => string, px: number, maxW: number) {
  c.font = font(px);
  const w = c.measureText(text).width;
  if (w > maxW) { px *= maxW / w; c.font = font(px); }
  return px;
}

/** Cắt chữ thành các dòng vừa bề rộng. */
function wrap(c: Ctx, text: string, maxW: number) {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${word}` : word;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = word; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

/** Hình vẽ nét: đầu khô gấu kèm hai nhánh lá, giống kiểu hình in trên nhãn vải handmade. */
function bearDoodle(c: Ctx, cx: number, cy: number, s: number) {
  c.save(); c.translate(cx, cy); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s * 0.055;
  // tai
  for (const k of [-1, 1]) { c.beginPath(); c.arc(k * s * 0.3, -s * 0.3, s * 0.13, 0, Math.PI * 2); c.stroke(); }
  // đầu (hơi méo cho giống vẽ tay)
  c.beginPath(); c.ellipse(0, 0, s * 0.42, s * 0.36, -0.05, 0, Math.PI * 2); c.stroke();
  // mõm, mũi, mắt
  c.beginPath(); c.ellipse(0, s * 0.1, s * 0.16, s * 0.12, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(0, s * 0.05, s * 0.05, s * 0.035, 0, 0, Math.PI * 2); c.fill();
  for (const k of [-1, 1]) { c.beginPath(); c.arc(k * s * 0.16, -s * 0.06, s * 0.035, 0, Math.PI * 2); c.fill(); }
  // má hồng gạch chéo
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(k * s * (0.24 + i * 0.03), s * 0.1); c.lineTo(k * s * (0.21 + i * 0.03), s * 0.16); c.stroke();
  }
  // hai nhánh lá
  for (const k of [-1, 1]) {
    c.save(); c.translate(k * s * 0.62, s * 0.18); c.rotate(k * 0.25);
    c.beginPath(); c.moveTo(0, s * 0.3); c.quadraticCurveTo(k * s * 0.05, 0, 0, -s * 0.32); c.stroke();
    for (let i = 0; i < 4; i++) {
      const y = s * (0.18 - i * 0.14);
      for (const side of [-1, 1]) {
        c.beginPath(); c.ellipse(side * s * 0.07, y - s * 0.03, s * 0.07, s * 0.03, side * -0.6, 0, Math.PI * 2); c.stroke();
      }
    }
    c.restore();
  }
  c.restore();
}

/**
 * Nhãn vải cotton kiểu gập hai đầu (end-fold), in mực nâu: hình khô gấu + "Thiết kế bởi … / dành cho …".
 * Vẽ trong khung w×h tại (x, y); tỉ lệ đẹp nhất khoảng 1.7 : 1.
 */
export function drawLabel(c: Ctx, x: number, y: number, w: number, h: number, giver: string, recipient: string) {
  const rand = rng(`tag|${giver}|${recipient}`);
  const fold = w * 0.075, s = scaleOf(c);
  c.save(); c.translate(x, y);

  // bóng đổ dưới nhãn
  c.save(); c.shadowColor = 'rgba(40,30,20,.28)'; c.shadowBlur = h * 0.08; c.shadowOffsetY = h * 0.035;
  c.fillStyle = '#efe5cf'; c.fillRect(0, h * 0.02, w, h * 0.96); c.restore();

  // nền vải: màu mộc + sợi ngang dọc + đốm bông
  const [fc, f] = layer(w, h, s);
  f.fillStyle = '#f2e9d6'; f.fillRect(0, 0, w, h);
  const step = Math.max(1, h / 70);
  for (let yy = 0; yy < h; yy += step) { f.fillStyle = `rgba(120,96,60,${0.03 + rand() * 0.05})`; f.fillRect(0, yy, w, step * 0.45); }
  for (let xx = 0; xx < w; xx += step) { f.fillStyle = `rgba(255,255,255,${0.04 + rand() * 0.06})`; f.fillRect(xx, 0, step * 0.4, h); }
  for (let i = 0; i < w * h * 0.004; i++) { f.fillStyle = `rgba(110,85,50,${rand() * 0.12})`; f.fillRect(rand() * w, rand() * h, 1 + rand() * step, 0.6 + rand()); }
  // hai đầu gập: tối hơn, có nếp gấp và hàng chỉ may
  for (const side of [0, 1]) {
    const gx = side ? w - fold : 0;
    const g = f.createLinearGradient(side ? w : 0, 0, gx + (side ? 0 : fold), 0);
    g.addColorStop(0, 'rgba(90,70,40,.22)'); g.addColorStop(1, 'rgba(90,70,40,0)');
    f.fillStyle = g; f.fillRect(gx, 0, fold, h);
    const crease = side ? w - fold : fold;
    f.fillStyle = 'rgba(80,60,35,.25)'; f.fillRect(crease - 0.6, 0, 1.2, h);
    f.fillStyle = 'rgba(255,255,255,.35)'; f.fillRect(crease + (side ? -2 : 0.8), 0, 1, h);
    f.strokeStyle = 'rgba(105,82,50,.55)'; f.lineWidth = Math.max(0.8, h / 90); f.setLineDash([h / 22, h / 30]);
    f.beginPath(); f.moveTo(side ? w - fold * 0.45 : fold * 0.45, h * 0.04); f.lineTo(side ? w - fold * 0.45 : fold * 0.45, h * 0.96); f.stroke();
    f.setLineDash([]);
  }
  // mép trên dưới hơi tưa sợi
  f.globalCompositeOperation = 'destination-out';
  for (let xx = 0; xx < w; xx += 1.5) {
    f.fillRect(xx, 0, 1.5, rand() * h * 0.012); f.fillRect(xx, h - rand() * h * 0.012, 1.5, h);
  }
  f.globalCompositeOperation = 'source-over';
  c.drawImage(fc, 0, 0, w, h);

  // lớp mực in
  const [ic, k] = layer(w, h, s);
  k.fillStyle = INK; k.strokeStyle = INK;
  const inner = w - fold * 2, left = fold + inner * 0.03;
  // hình vẽ chiếm 1/3 bên trái (cả hai nhánh lá), chữ bắt đầu từ 40% để không đè lên nhau
  const doodleX = left + inner * 0.16;
  bearDoodle(k, doodleX, h * 0.44, Math.min(h * 0.44, inner * 0.18));
  const tx = left + inner * 0.4, tw = inner * 0.55;
  k.textBaseline = 'alphabetic';
  k.font = `${h * 0.1}px "Be Vietnam Pro", sans-serif`;
  if ('letterSpacing' in k) (k as Ctx & { letterSpacing: string }).letterSpacing = `${h * 0.02}px`;
  k.fillText('THIẾT KẾ BỞI', tx, h * 0.26, tw);
  if ('letterSpacing' in k) (k as Ctx & { letterSpacing: string }).letterSpacing = '0px';
  fitFont(k, giver || '…', (px) => `${px}px "Patrick Hand", cursive`, h * 0.23, tw);
  k.fillText(giver || '…', tx, h * 0.47);
  k.font = `${h * 0.12}px "Patrick Hand", cursive`;
  k.fillText('dành cho', tx, h * 0.63);
  fitFont(k, recipient || '…', (px) => `${px}px "Patrick Hand", cursive`, h * 0.23, tw);
  k.fillText(recipient || '…', tx, h * 0.84);
  k.font = `600 ${h * 0.075}px "Be Vietnam Pro", sans-serif`; k.textAlign = 'center';
  k.globalAlpha = 0.85; k.fillText('BOCBOX', doodleX, h * 0.86, inner * 0.3); k.globalAlpha = 1; k.textAlign = 'left';
  inkTexture(k, w, h, rand);
  c.globalAlpha = 0.9; c.globalCompositeOperation = 'multiply'; c.drawImage(ic, 0, 0, w, h);
  c.restore();
}

/** Giấy kraft: nền nâu, sợi giấy sáng tối, viền tối nhẹ. */
function kraft(w: number, h: number, rand: () => number, s: number) {
  const [cv, c] = layer(w, h, s);
  c.fillStyle = '#c8a274'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.0025; i++) {
    const len = 2 + rand() * w * 0.02, a = rand() * Math.PI;
    c.strokeStyle = rand() < 0.5 ? `rgba(255,240,210,${rand() * 0.18})` : `rgba(90,60,30,${rand() * 0.16})`;
    c.lineWidth = 0.5 + rand();
    const px = rand() * w, py = rand() * h;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); c.stroke();
  }
  for (let i = 0; i < w * h * 0.0015; i++) { c.fillStyle = `rgba(70,45,20,${rand() * 0.25})`; c.fillRect(rand() * w, rand() * h, 1, 1); }
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(70,40,15,.22)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  return cv;
}

/** Dấu mộc đỏ hình chữ nhật (thiệp điệp viên). */
function stamp(c: Ctx, text: string, cx: number, cy: number, s: number, rand: () => number) {
  const [sc, k] = layer(s * 4, s * 1.6, scaleOf(c));
  k.strokeStyle = STAMP_RED; k.fillStyle = STAMP_RED; k.lineWidth = s * 0.09;
  k.strokeRect(s * 0.1, s * 0.15, s * 3.8, s * 1.3);
  k.lineWidth = s * 0.03; k.strokeRect(s * 0.22, s * 0.27, s * 3.56, s * 1.06);
  k.font = `800 ${s * 0.62}px "Be Vietnam Pro", sans-serif`; k.textAlign = 'center'; k.textBaseline = 'middle';
  k.fillText(text, s * 2, s * 0.82, s * 3.3);
  inkTexture(k, s * 4, s * 1.6, rand, 0.03);
  c.save(); c.translate(cx, cy); c.rotate(-0.16); c.globalAlpha = 0.82; c.globalCompositeOperation = 'multiply';
  c.drawImage(sc, -s * 2, -s * 0.8, s * 4, s * 1.6); c.restore();
}

export type CardContent = {
  style: CardStyle; giver: string; recipient: string; message: string;
  /** Lời thú tội của form ngụy trang (thiệp điệp viên). */
  confession?: string;
  /** Ảnh meme đầu tiên trên áo (thiệp meme). */
  meme?: HTMLImageElement | null;
};

/** Thiệp kraft khổ 15×10 cm (ngang) theo 3 kiểu, chữ viết tay bằng bút bi. Vẽ trong khung w×h tại (x, y). */
export function drawCard(c: Ctx, x: number, y: number, w: number, h: number, card: CardContent) {
  const rand = rng(`card|${card.style}|${card.giver}|${card.recipient}|${card.message}`);
  c.save(); c.translate(x, y);
  const s = scaleOf(c);
  c.save(); c.shadowColor = 'rgba(40,25,10,.35)'; c.shadowBlur = h * 0.05; c.shadowOffsetY = h * 0.025;
  c.fillStyle = '#c8a274'; c.fillRect(0, 0, w, h); c.restore();
  c.drawImage(kraft(w, h, rand, s), 0, 0, w, h);

  const [pc, p] = layer(w, h, s); // lớp chữ viết tay + mực in
  p.fillStyle = PEN; p.strokeStyle = PEN; p.textBaseline = 'alphabetic';
  const pad = w * 0.07;
  let textLeft = pad, textW = w - pad * 2, top = h * 0.2;
  const hand = (px: number) => `${px}px "Patrick Hand", cursive`;

  if (card.style === 'MEME' && card.meme) {
    // ảnh meme in trên thiệp như một tấm ảnh dán viền trắng
    const mw = w * 0.34, mh = Math.min(h * 0.62, mw * card.meme.naturalHeight / card.meme.naturalWidth), my = h * 0.17;
    c.save(); c.translate(pad + mw / 2, my + mh / 2); c.rotate(-0.04);
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = h * 0.02; c.shadowOffsetY = h * 0.01;
    c.fillStyle = '#fbf8f1'; c.fillRect(-mw / 2 - w * 0.012, -mh / 2 - w * 0.012, mw + w * 0.024, mh + w * 0.05);
    c.shadowColor = 'transparent'; c.drawImage(card.meme, -mw / 2, -mh / 2, mw, mh);
    c.restore();
    textLeft = pad + mw + w * 0.06; textW = w - textLeft - pad;
  }
  if (card.style === 'SPY') {
    stamp(c, 'TUYỆT MẬT', w * 0.8, h * 0.13, h * 0.09, rand);
    p.font = `${h * 0.05}px "Courier New", monospace`;
    p.fillText(`HỒ SƠ ĐIỆP VIÊN · GỬI ${(card.recipient || '…').toUpperCase()}`, pad, h * 0.15, w * 0.6);
    p.fillRect(pad, h * 0.175, w * 0.55, Math.max(1, h * 0.004));
    if (card.confession) {
      p.font = `${h * 0.058}px "Courier New", monospace`;
      const lines = wrap(p, `“${card.confession}”`, textW).slice(0, 3);
      lines.forEach((l, i) => p.fillText(l, pad, h * 0.33 + i * h * 0.075));
      top = h * 0.33 + lines.length * h * 0.075 + h * 0.03;
    } else top = h * 0.3;
  } else {
    p.font = hand(h * 0.1);
    p.fillText(`Gửi ${card.recipient || '…'},`, textLeft, h * 0.24, textW);
    top = h * 0.36;
  }

  // lời nhắn: tự co chữ cho vừa phần còn lại của thiệp
  const msg = card.message.trim() || (card.style === 'SPY' ? '' : 'Chúc cậu luôn vui như meme trên áo!');
  const room = h * 0.8 - top;
  let px = h * (card.style === 'SPY' ? 0.075 : 0.085), lines: string[] = [];
  for (; px > h * 0.04; px *= 0.92) { p.font = hand(px); lines = wrap(p, msg, textW); if (lines.length * px * 1.2 <= room) break; }
  lines.forEach((l, i) => p.fillText(l, textLeft, top + px + i * px * 1.2, textW));
  p.font = hand(h * 0.08);
  const sign = card.style === 'SPY' ? `— Đặc vụ ${card.giver || '…'}` : `— ${card.giver || '…'}`;
  p.textAlign = 'right'; p.fillText(sign, w - pad, h * 0.9, w * 0.6); p.textAlign = 'left';
  if (card.style === 'PLAIN') { p.globalAlpha = 0.7; bearDoodle(p, pad + h * 0.12, h * 0.8, h * 0.18); p.globalAlpha = 1; }
  inkTexture(p, w, h, rand, 0.002);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.92; c.drawImage(pc, 0, 0, w, h);
  c.restore();
}

/** Tỉ lệ khung vẽ (rộng / cao). */
export const LABEL_RATIO = 1.7;
export const CARD_RATIO = 1.5;
