import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Archive, ArrowsClockwise, ChartBar, CheckCircle, Confetti, CreditCard, Cube, Detective, DownloadSimple, Envelope, Eye, EyeSlash,
  FolderSimple, Gift, Hourglass, Image, Key, Lightbulb, ListChecks, Lock, MagnifyingGlass, NotePencil, Package, PaintBrush, Palette,
  PencilSimple, Plus, Printer, Question, Receipt, Scissors, Seal, ShoppingBag, SignOut, Sparkle, Star, Storefront, Tag, Trash, Truck,
  TShirt, UserCircle, Users, Warning, type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

// Bộ icon Phosphor (MIT), nét duotone đồng màu chữ: gọn và đồng bộ hơn emoji 3D.
const ICONS: Record<string, PhosphorIcon> = {
  'wrapped-gift': Gift, package: Package, 't-shirt': TShirt, sparkles: Sparkle, 'party-popper': Confetti, detective: Detective,
  'file-folder': FolderSimple, receipt: Receipt, 'delivery-truck': Truck, 'convenience-store': Storefront, 'artist-palette': Palette,
  'check-mark-button': CheckCircle, 'credit-card': CreditCard, 'hourglass-not-done': Hourglass, label: Tag,
  'magnifying-glass-tilted-left': MagnifyingGlass, memo: NotePencil, paintbrush: PaintBrush, 'shopping-bags': ShoppingBag, star: Star,
  chart: ChartBar, orders: ListChecks, users: Users, key: Key, image: Image, archive: Archive, logout: SignOut, printer: Printer,
  envelope: Envelope, plus: Plus, trash: Trash, eye: Eye, 'eye-off': EyeSlash, lock: Lock, warning: Warning, scissors: Scissors,
  cube: Cube, user: UserCircle, edit: PencilSimple, refresh: ArrowsClockwise, download: DownloadSimple, seal: Seal, idea: Lightbulb,
  question: Question,
};

export function Icon({ name, size = 24, className = '', weight = 'duotone' }: {
  name: string; size?: number; className?: string; weight?: 'regular' | 'duotone' | 'bold' | 'fill';
}) {
  const C = ICONS[name] ?? Question;
  return <C size={size} weight={weight} className={`icon ${className}`} aria-hidden />;
}

/** Tiêu đề mục: nhãn nhỏ + tiêu đề lớn. */
export function SectionTitle({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="section-title">
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {sub && <p className="muted">{sub}</p>}
    </div>
  );
}

/** Đếm ngược tới một mốc giờ (hạn chốt đợt pre-order). */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, new Date(to).getTime() - now);
  const parts = [[Math.floor(left / 864e5), 'ngày'], [Math.floor(left / 36e5) % 24, 'giờ'], [Math.floor(left / 6e4) % 60, 'phút'], [Math.floor(left / 1e3) % 60, 'giây']] as const;
  return (
    <div className="countdown" role="timer" aria-label="Thời gian còn lại của đợt">
      {parts.map(([n, unit]) => <div key={unit}><b>{String(n).padStart(2, '0')}</b><span>{unit}</span></div>)}
    </div>
  );
}

export function Bubble({ children, side = 'left' }: { children: ReactNode; side?: 'left' | 'right' }) {
  return <div className={`bubble bubble-${side}`}>{children}</div>;
}

/** Màu giấy gói: cam BocBox, kraft, xanh xô thơm, hồng đất, vàng mù tạt. */
export const WRAP_COLORS = ['#F47A3A', '#c9a172', '#7f9a76', '#d98b84', '#e3b04b'];
export const party = () => {
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.65 }, colors: WRAP_COLORS, shapes: ['square'], scalar: 0.9 });
};

/** Màn "Đợi chút!" chỉ hiện ở lần mở đầu tiên trong phiên, không làm chậm các lần tải lại sau. */
const seenLoading = () => { try { return sessionStorage.getItem('bocbox:loaded') === '1'; } catch { return false; } };
export function LoadingScreen() {
  const [hide, setHide] = useState(false), [gone, setGone] = useState(seenLoading);
  useEffect(() => {
    if (gone) return;
    try { sessionStorage.setItem('bocbox:loaded', '1'); } catch { /* bỏ qua */ }
    const t = setTimeout(() => setHide(true), 1000); const t2 = setTimeout(() => setGone(true), 1500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  if (gone) return null;
  return (
    <div className={`loading ${hide ? 'hide' : ''}`} onClick={() => setHide(true)}>
      <div className="loading-inner">
        <motion.div animate={{ rotate: [0, -6, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          <Icon name="wrapped-gift" size={88} />
        </motion.div>
        <div className="loading-title">Đợi chút!</div>
        <div className="loading-sub">BocBox đang gói quà…</div>
      </div>
    </div>
  );
}
