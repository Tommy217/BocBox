import { useEffect, useRef, useState } from 'react';
import { drawTee, ensureFonts, layerHeight, loadImage, loadLayerImages, memeSrc, PRINT_BOX, PRINT_RATIO, TEE_RATIO, TEE_SRC, withLayout, type TagNames } from '../lib/art';
import { khoGauSrc } from '../lib/khoGau';
import type { Design, MemeLayer, TextBlock } from '../lib/types';

/** Ảnh khô gấu (móc khóa thú bông) theo slug, dùng cho kệ, tồn kho và mascot. */
export function KhoGauPhoto({ slug, size = 72, alt = '' }: { slug: string; size?: number; alt?: string }) {
  return <img className="kho-photo" src={khoGauSrc(slug)} alt={alt} loading="lazy" style={{ width: size, height: size }} />;
}

/** Ảnh meme (hoặc ảnh khách tải lên) in lên áo; slug null = áo chỉ có chữ. */
export function MemePhoto({ slug, size = 72, alt = '' }: { slug: string | null; size?: number; alt?: string }) {
  if (!slug) return <span className="meme-photo meme-empty" style={{ width: size, height: size }} title="Áo chỉ in chữ">Aa</span>;
  return <img className="meme-photo" src={memeSrc(slug)} alt={alt} loading="lazy" style={{ width: size, height: size }} />;
}

/** Mockup áo; truyền tag để thấy author tag vải may ở gấu áo. */
export function TeePreview({ design, width = 360, tag }: { design: Design; width?: number; tag?: TagNames }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * TEE_RATIO);
  useEffect(() => {
    let alive = true;
    const tee = loadImage(TEE_SRC);
    const imgs = loadLayerImages(design);
    const draw = async () => {
      const [t, m] = await Promise.all([tee, imgs]);
      if (!alive || !ref.current) return;
      const cv = ref.current; const dpr = window.devicePixelRatio || 1;
      cv.width = width * dpr; cv.height = height * dpr;
      const c = cv.getContext('2d')!; c.scale(dpr, dpr); drawTee(c, design, width, height, t, m, tag);
    };
    draw().then(() => ensureFonts()).then(draw).catch(() => undefined);
    return () => { alive = false; };
  }, [design, width, height, tag?.giver, tag?.recipient]);
  return <canvas ref={ref} style={{ width, height, maxWidth: '100%' }} aria-label="Mockup áo" />;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pct = (v: number) => `${v * 100}%`;
type Sel = number | 'text' | null;

/**
 * Áo xem trước có thể kéo thả: mỗi meme và khối chữ là một ô trong suốt phủ lên vùng in A4,
 * kéo để di chuyển, kéo góc dưới phải để đổi cỡ meme. Mọi vị trí tính theo tỉ lệ vùng in nên
 * đúng ở mọi cỡ màn hình và khớp file in.
 */
export function TeeEditor({ design, width, onChange, selected, onSelect, tag }: {
  design: Design; width: number; tag?: TagNames; onChange: (p: { layers: MemeLayer[]; text: TextBlock }) => void;
  selected: Sel; onSelect: (s: Sel) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const { layers, text } = withLayout(design);
  // tỉ lệ cao/rộng của từng ảnh meme, để biết khung của lớp cao bao nhiêu
  const [aspects, setAspects] = useState<Record<string, number>>({});
  useEffect(() => {
    layers.forEach((l) => {
      if (aspects[l.slug]) return;
      loadImage(memeSrc(l.slug)).then((img) => setAspects((a) => ({ ...a, [l.slug]: img.naturalHeight / img.naturalWidth }))).catch(() => undefined);
    });
  }, [layers.map((l) => l.slug).join()]);
  const hOf = (l: MemeLayer) => layerHeight(l, aspects[l.slug] ?? 1);

  // lớp nào tràn ra ngoài vùng in (vd. vừa phóng to bằng thanh trượt, hoặc thay ảnh cao hơn) thì kéo về trong
  useEffect(() => {
    if (layers.some((l) => !aspects[l.slug])) return;
    const fitted = layers.map((l) => {
      const k = aspects[l.slug] * PRINT_RATIO, w = Math.min(l.w, 1, 1 / k), h = w * k;
      return { ...l, w, x: clamp(l.x, w / 2, 1 - w / 2), y: clamp(l.y, h / 2, 1 - h / 2) };
    });
    if (fitted.some((f, i) => Math.abs(f.x - layers[i].x) + Math.abs(f.y - layers[i].y) + Math.abs(f.w - layers[i].w) > 1e-6)) onChange({ layers: fitted, text });
  }, [JSON.stringify(layers), aspects]);

  /** Kéo bằng con trỏ/ngón tay: tính độ dời theo tỉ lệ vùng in rồi gọi apply. */
  function drag(e: React.PointerEvent, apply: (dx: number, dy: number) => void) {
    e.preventDefault(); e.stopPropagation();
    const box = areaRef.current!.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    const move = (ev: PointerEvent) => apply((ev.clientX - sx) / box.width, (ev.clientY - sy) / box.height);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  const setLayer = (i: number, l: MemeLayer) => onChange({ layers: layers.map((x, j) => (j === i ? l : x)), text });

  function moveLayer(e: React.PointerEvent, i: number) {
    onSelect(i);
    const l0 = layers[i], h = hOf(l0);
    drag(e, (dx, dy) => setLayer(i, { ...l0, x: clamp(l0.x + dx, l0.w / 2, 1 - l0.w / 2), y: clamp(l0.y + dy, h / 2, 1 - h / 2) }));
  }
  function resizeLayer(e: React.PointerEvent, i: number) {
    onSelect(i);
    const l0 = layers[i], k = (aspects[l0.slug] ?? 1) * PRINT_RATIO;
    // giữ góc trên trái, kéo góc dưới phải; không cho tràn ra ngoài vùng in
    const left = l0.x - l0.w / 2, top = l0.y - (l0.w * k) / 2;
    drag(e, (dx) => {
      const w = clamp(l0.w + dx, 0.12, Math.min(1 - left, (1 - top) / k));
      setLayer(i, { ...l0, w, x: left + w / 2, y: top + (w * k) / 2 });
    });
  }
  function moveText(e: React.PointerEvent) {
    onSelect('text');
    const t0 = text;
    drag(e, (dx, dy) => onChange({ layers, text: { ...t0, x: clamp(t0.x + dx, 0.1, 0.9), y: clamp(t0.y + dy, 0.05, 0.95) } }));
  }

  const [bx, by, bw, bh] = PRINT_BOX;
  const hasText = !!(design.textLine1 || design.textLine2);
  return (
    <div className="tee-editor" onPointerDown={() => onSelect(null)}>
      <TeePreview design={design} width={width} tag={tag} />
      <div ref={areaRef} className="print-area-guide" style={{ left: pct(bx), top: pct(by), width: pct(bw), height: pct(bh) }}>
        {layers.map((l, i) => {
          const h = hOf(l);
          return (
            <div key={i} className={`layer-box ${selected === i ? 'on' : ''}`} style={{ left: pct(l.x - l.w / 2), top: pct(l.y - h / 2), width: pct(l.w), height: pct(h) }}
              onPointerDown={(e) => moveLayer(e, i)} role="button" aria-label={`Meme ${i + 1}, kéo để di chuyển`}>
              {selected === i && <span className="resize-handle" onPointerDown={(e) => resizeLayer(e, i)} aria-label="Kéo để đổi cỡ" />}
            </div>
          );
        })}
        {hasText && (
          <div className={`layer-box text-box ${selected === 'text' ? 'on' : ''}`}
            style={{ left: pct(text.x - 0.42), top: pct(text.y - text.s * (design.textLine1 && design.textLine2 ? 1.2 : 0.65)), width: pct(0.84), height: pct(text.s * (design.textLine1 && design.textLine2 ? 2.4 : 1.3)) }}
            onPointerDown={moveText} role="button" aria-label="Khối chữ, kéo để di chuyển" />
        )}
      </div>
    </div>
  );
}
