import { useEffect, useState } from 'react';
import { api } from './api';
import type { CardStyle } from './types';

/**
 * Bảng giá box theo tùy chọn in. Số chuẩn nằm ở backend (bocbox.pricing, GET /pricing) và giá ghi vào đơn
 * luôn do backend tính; số dưới đây chỉ là dự phòng khi chưa tải được bảng giá.
 */
export type Pricing = { base: number; extraMemes: number; memeCard: number; max: number };
export const DEFAULT_PRICING: Pricing = { base: 275000, extraMemes: 15000, memeCard: 9000, max: 299000 };

let cached: Pricing | null = null;
let pending: Promise<Pricing> | null = null;
function loadPricing(): Promise<Pricing> {
  if (cached) return Promise.resolve(cached);
  pending ??= api.pricing().then((p) => (cached = p)).catch(() => { pending = null; return DEFAULT_PRICING; });
  return pending;
}

/** Bảng giá dùng chung cho các trang (tải một lần). */
export function usePricing(): Pricing {
  const [p, setP] = useState<Pricing>(cached ?? DEFAULT_PRICING);
  useEffect(() => { let alive = true; loadPricing().then((x) => alive && setP(x)); return () => { alive = false; }; }, []);
  return p;
}

export type PriceLine = { label: string; amount: number };

/** Các dòng giá của một box: giá gốc, +nhiều meme (2–4 meme/ảnh), +thiệp meme (chỉ khi áo có meme). Khớp service/PriceCalculator. */
export function priceLines(p: Pricing, layerCount: number, cardStyle: CardStyle): PriceLine[] {
  const lines: PriceLine[] = [{ label: 'Hộp quà (áo 1 meme, khô gấu, tag, thiệp)', amount: p.base }];
  if (layerCount >= 2) lines.push({ label: `Áo ${layerCount} meme/ảnh`, amount: p.extraMemes });
  if (cardStyle === 'MEME' && layerCount >= 1) lines.push({ label: 'Thiệp meme in màu', amount: p.memeCard });
  return lines;
}
export const priceOf = (p: Pricing, layerCount: number, cardStyle: CardStyle) =>
  priceLines(p, layerCount, cardStyle).reduce((s, l) => s + l.amount, 0);

/** "275K", "299K": cách viết giá ngắn trên băng rôn, hero. */
export const k = (n: number) => `${Math.round(n / 1000)}K`;
