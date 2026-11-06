import { useEffect, useRef } from 'react';
import { ensureFonts, loadImage, memeSrc } from '../lib/art';
import { CARD_RATIO, drawCard, drawLabel, LABEL_RATIO, type CardContent } from '../lib/paper';
import type { CardStyle } from '../lib/types';

/** Vẽ lại canvas theo devicePixelRatio, chờ font tải xong vẽ thêm lần nữa cho đúng chữ. */
function usePaperCanvas(width: number, height: number, paint: (c: CanvasRenderingContext2D) => void | Promise<void>, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const draw = async () => {
      const cv = ref.current; if (!cv || !alive) return;
      const dpr = window.devicePixelRatio || 1, pad = 16; // chừa lề cho bóng đổ
      cv.width = (width + pad * 2) * dpr; cv.height = (height + pad * 2) * dpr;
      const c = cv.getContext('2d')!; c.scale(dpr, dpr); c.translate(pad, pad);
      await paint(c);
    };
    draw().then(() => ensureFonts()).then(draw).catch(() => undefined);
    return () => { alive = false; };
  }, [width, height, ...deps]);
  return <canvas ref={ref} style={{ width: width + 32, height: height + 32, margin: -16, maxWidth: 'calc(100% + 32px)' }} />;
}

/** Author tag vải cotton in mực nâu, giống nhãn may ngoài áo. */
export function AuthorTag({ giver, recipient, width = 220 }: { giver: string; recipient: string; width?: number }) {
  const h = Math.round(width / LABEL_RATIO);
  const canvas = usePaperCanvas(width, h, (c) => drawLabel(c, 0, 0, width, h, giver, recipient), [giver, recipient]);
  return <figure className="paper-item author-tag" aria-label={`Author tag: thiết kế bởi ${giver || '…'} dành cho ${recipient || '…'}`}>{canvas}</figure>;
}

/** Thiệp kraft kèm hộp: điệp viên / meme / trơn, lời nhắn viết tay. */
export function GiftCard({ style, giver, recipient, message, confession, memeSlug, width = 330 }: {
  style: CardStyle; giver: string; recipient: string; message: string; confession?: string; memeSlug?: string; width?: number;
}) {
  const h = Math.round(width / CARD_RATIO);
  const canvas = usePaperCanvas(width, h, async (c) => {
    const meme = style === 'MEME' && memeSlug ? await loadImage(memeSrc(memeSlug)).catch(() => null) : null;
    const card: CardContent = { style, giver, recipient, message, confession, meme };
    c.clearRect(-16, -16, width + 32, h + 32);
    drawCard(c, 0, 0, width, h, card);
  }, [style, giver, recipient, message, confession, memeSlug]);
  return <figure className="paper-item gift-card" aria-label={`Thiệp gửi ${recipient || '…'}: ${message}`}>{canvas}</figure>;
}

export const CARD_STYLES: { id: CardStyle; label: string; note: string }[] = [
  { id: 'SPY', label: 'Thiệp điệp viên', note: 'Dấu TUYỆT MẬT + lời thú tội vụ form ngụy trang' },
  { id: 'MEME', label: 'Thiệp meme', note: 'In meme đầu tiên trên áo, kèm lời nhắn' },
  { id: 'PLAIN', label: 'Thiệp kraft trơn', note: 'Chỉ lời nhắn viết tay, tối giản' },
];
