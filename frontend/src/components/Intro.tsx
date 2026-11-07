import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';

/**
 * Màn mở đầu "mở hộp" theo Figma (Wireframe 5 → 2 → 4 → 3): hai cánh cửa cam, giữa là khe trắng,
 * hai cánh tay nét đen nắm mép cửa. Khách bấm (hoặc kéo chuột / vuốt sang hai bên) thì cửa tách ra,
 * bên trong hiện logo, cuối cùng "Hộp quà tặng cá nhân hoá · chạm để mở quà".
 * Chỉ hiện khi vào trang chủ lần đầu trong phiên; luôn có nút "Bỏ qua"; bỏ hẳn nếu máy bật giảm chuyển động.
 * Bàn tay vẽ lại bằng SVG theo nét Figma (file Figma chưa xuất được hình).
 */
const KEY = 'bocbox:intro';
const LOGO = `${import.meta.env.BASE_URL}brand/logo.png`;

function shouldShow(pathname: string) {
  if (pathname !== '/') return false;
  try { if (sessionStorage.getItem(KEY) === '1') return false; } catch { /* trình duyệt chặn bộ nhớ phiên: vẫn hiện */ }
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Cánh tay nét đen, bàn tay xòe hướng sang phải (tay phải dùng bản lật ngang). */
function Hand({ className }: { className: string }) {
  return (
    <svg className={`intro-hand ${className}`} viewBox="0 0 900 300" aria-hidden>
      <path d="M0 196 C200 168 420 120 610 104
        C660 84 730 60 800 50 C822 47 828 70 808 76 C770 88 735 98 712 110
        C765 104 825 104 862 110 C884 114 882 136 860 136 C820 136 775 134 742 138
        C785 146 830 158 852 170 C870 180 858 198 838 192 C805 182 770 168 740 164
        C768 178 792 192 802 204 C814 218 796 232 780 222 C752 204 724 190 690 184
        C660 180 640 190 622 206 C606 220 584 222 580 206 C577 192 592 180 606 170
        C470 186 220 224 0 254" />
    </svg>
  );
}

type Phase = 'closed' | 'open' | 'done';

export function Intro() {
  const { pathname } = useLocation();
  const [phase, setPhase] = useState<Phase>(() => (shouldShow(pathname) ? 'closed' : 'done'));
  const p = useMotionValue(0); // 0 = cửa đóng, 1 = mở hết
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1200 : window.innerWidth));
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const busy = useRef(false);
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  const leftX = useTransform(p, (v) => -v * w * 0.56);
  const rightX = useTransform(p, (v) => v * w * 0.56);
  const logoOpacity = useTransform(p, [0, 0.5, 1], [0.25, 0.8, 1]);
  const logoScale = useTransform(p, [0, 1], [0.8, 1]);
  const hintOpacity = useTransform(p, [0, 0.15], [1, 0]);

  useEffect(() => {
    if (phase === 'done') return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* bỏ qua */ }
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const resize = () => setW(window.innerWidth);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhase('done');
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    };
    window.addEventListener('resize', resize); window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = old; window.removeEventListener('resize', resize); window.removeEventListener('keydown', key); };
  }, [phase === 'done']);
  // mở xong thì tự vào trang sau vài giây nếu khách không chạm
  useEffect(() => {
    if (phase !== 'open') return;
    const t = setTimeout(() => setPhase('done'), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  /** Mở hết cửa rồi hiện lời chào; đang mở rồi thì chạm lần nữa để vào trang. */
  function next() {
    if (phase === 'open') { setPhase('done'); return; }
    if (busy.current) return;
    busy.current = true;
    animate(p, 1, { duration: 0.9, ease: [0.65, 0, 0.35, 1] }).then(() => { busy.current = false; setPhase('open'); });
  }

  const onDown = (e: React.PointerEvent) => {
    if (phase !== 'closed' || busy.current) return;
    drag.current = { x: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = Math.abs(e.clientX - d.x);
    if (dx > 6) d.moved = true;
    if (d.moved) p.set(Math.min(0.7, dx / (w * 0.6))); // kéo sang trái hay phải đều tách cửa
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    if (!d.moved || p.get() > 0.18) next();             // bấm, hoặc kéo đủ xa → mở hết
    else animate(p, 0, { type: 'spring', stiffness: 380, damping: 30 });
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div className="intro" role="dialog" aria-label="Mở hộp quà BocBox" exit={{ opacity: 0 }} transition={{ duration: 0.45 }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onClick={() => { if (phase === 'open') setPhase('done'); }}>
          <button type="button" className="intro-skip" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setPhase('done'); }}>Bỏ qua</button>

          {/* bên trong hộp: logo hiện dần khi cửa mở */}
          <div className="intro-inside">
            <motion.img src={LOGO} alt="BocBox" style={{ opacity: logoOpacity, scale: logoScale }} draggable={false} />
            {phase === 'open' && <>
              <motion.p className="intro-title" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>Hộp quà tặng cá nhân hoá</motion.p>
              <motion.p className="intro-tap" initial={{ opacity: 0 }} animate={{ opacity: [0.35, 1, 0.35] }} transition={{ delay: 0.3, duration: 1.6, repeat: Infinity }}>chạm để mở quà</motion.p>
            </>}
          </div>

          <motion.div className="intro-door left" style={{ x: leftX }}><Hand className="h-left" /></motion.div>
          <motion.div className="intro-door right" style={{ x: rightX }}><Hand className="h-right" /></motion.div>

          <motion.p className="intro-hint" style={{ opacity: hintOpacity }}>
            {!touch && <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><rect x="6" y="3" width="12" height="18" rx="6" /><path d="M12 7v3" /></svg>}
            {touch ? 'Chạm hoặc vuốt để xem bên trong có gì?' : 'Bấm hoặc kéo thả chuột để xem bên trong có gì?'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
