import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { SizeChart } from '../lib/types';
import { Icon } from './Fun';

/**
 * Số đo áo phôi (cm, đo khi trải phẳng; ngang ngực đo một mặt) theo size.
 * SỐ THAM KHẢO cho form oversize – nhóm thay bằng số đo thật của xưởng/áo phôi khi chốt nhà cung cấp.
 */
const GARMENT: Record<string, { length: number; shoulder: number; chest: number; sleeve: number }> = {
  S: { length: 66, shoulder: 43, chest: 48, sleeve: 20.5 },
  M: { length: 68, shoulder: 45, chest: 50, sleeve: 21.5 },
  L: { length: 70, shoulder: 47, chest: 52, sleeve: 22 },
  XL: { length: 72, shoulder: 49, chest: 54, sleeve: 22 },
  XXL: { length: 74, shoulder: 50, chest: 56, sleeve: 22.5 },
};
const num = (n: number) => n.toLocaleString('vi-VN');

/** Khoảng chiều cao / cân nặng của một size, lấy từ bảng size của shop (API /sizes). */
function range(min: number, max: number, unit: string, first: boolean, last: boolean) {
  if (first) return `< ${max} ${unit}`;
  if (last) return `> ${min} ${unit}`;
  return `${min}–${max}`;
}

/** Bảng size tham khảo ở bước "Màu & size" của Xưởng in: bấm một dòng để chọn size đó. */
export function SizeGuide({ value, onPick }: { value: string; onPick: (code: string) => void }) {
  const [sizes, setSizes] = useState<SizeChart[]>([]);
  useEffect(() => { api.sizes().then(setSizes).catch(() => undefined); }, []);
  if (!sizes.length) return null;
  return (
    <div className="size-guide">
      <h3><Icon name="t-shirt" size={22} /> Chưa chắc size? Xem bảng size</h3>
      <div className="size-guide-body">
        <img src={`${import.meta.env.BASE_URL}brand/size-guide.png`} alt="Cách đo: A dài áo, B rộng vai, C ngang ngực, D dài tay" />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Size</th><th>Chiều cao</th><th>Cân nặng</th><th>A. Dài áo</th><th>B. Rộng vai</th><th>C. Ngang ngực</th><th>D. Dài tay</th></tr></thead>
            <tbody>
              {sizes.map((s, i) => {
                const g = GARMENT[s.code];
                return (
                  <tr key={s.code} className={s.code === value ? 'on' : ''} onClick={() => onPick(s.code)} title={`Chọn size ${s.code}`}>
                    <td><b>{s.code}</b></td>
                    <td>{range(s.minHeight, s.maxHeight, 'cm', i === 0, i === sizes.length - 1)}</td>
                    <td>{range(s.minWeight, s.maxWeight, 'kg', i === 0, i === sizes.length - 1)}</td>
                    <td>{g ? num(g.length) : '–'}</td><td>{g ? num(g.shoulder) : '–'}</td><td>{g ? num(g.chest) : '–'}</td><td>{g ? num(g.sleeve) : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="muted small">Số đo áo tính bằng cm, đo khi áo trải phẳng (ngang ngực đo một mặt). Form rộng: nằm giữa hai size thì chọn size nhỏ để vừa người, size lớn để mặc rộng. Bấm một dòng để chọn size đó.</p>
    </div>
  );
}
