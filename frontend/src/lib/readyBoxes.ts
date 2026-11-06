// Các hộp có sẵn: áo do shop thiết kế sẵn (vẫn sửa được trong Xưởng in), khô gấu vẫn bốc ngẫu nhiên và giữ bí mật.
import type { Design, MemeLayer } from './types';

export type ReadyBox = { id: string; name: string; mood: string; bg: string; design: Design };

const one = (slug: string): MemeLayer[] => [{ slug, x: 0.5, y: 0.36, w: 0.9 }];
const two = (a: string, b: string): MemeLayer[] => [{ slug: a, x: 0.32, y: 0.27, w: 0.6 }, { slug: b, x: 0.68, y: 0.56, w: 0.6 }];
const tee = (layers: MemeLayer[], colorHex: string, textLine1: string, textLine2 = '', font = 'Baloo 2'): Design =>
  ({ memeSlug: layers[0].slug, colorHex, textLine1, textLine2, font, position: 'CENTER', layers, text: { x: 0.5, y: 0.86, s: 0.068 } });

export const MOODS = ['Tất cả', 'Bạn thân', 'Sinh viên', 'Sinh nhật', 'Cà khịa'] as const;

export const READY_BOXES: ReadyBox[] = [
  { id: 'deadline', name: 'Hội chạy deadline', mood: 'Sinh viên', bg: '#d8443b', design: tee(two('surprised-pikachu', 'waiting-skeleton'), '#FFFFFF', 'Deadline là hôm nay', '(tớ vẫn ổn)') },
  { id: 'van-on', name: 'Mọi thứ vẫn ổn', mood: 'Bạn thân', bg: '#16958c', design: tee(one('this-is-fine'), '#E8DCC4', 'Mọi thứ vẫn ổn', '(không ổn)', 'Patrick Hand') },
  { id: 'cai-nhau', name: 'Cãi nhau vui vẻ', mood: 'Bạn thân', bg: '#2f5fc4', design: tee(one('woman-yelling-at-cat'), '#BFD7EA', 'Tớ đúng', 'cậu sai') },
  { id: 'nam-cuoi', name: 'Sinh viên năm cuối', mood: 'Sinh viên', bg: '#e0a526', design: tee(one('hide-the-pain-harold'), '#1F1F1F', 'Sinh viên năm cuối', '', 'Be Vietnam Pro') },
  { id: 'tra-chieu', name: 'Trà chiều hóng chuyện', mood: 'Cà khịa', bg: '#4f9d45', design: tee(one('kermit-tea'), '#FFFFFF', 'Chuyện của cậu', 'tớ chỉ uống trà') },
  { id: 'chay-nha', name: 'Tớ không làm gì cả', mood: 'Cà khịa', bg: '#ef7a2f', design: tee(one('disaster-girl'), '#E8DCC4', 'Tớ không làm gì cả') },
  { id: 'nang-ly', name: 'Nâng ly tuổi mới', mood: 'Sinh nhật', bg: '#c99a2e', design: tee(two('leo-cheers', 'laughing-leo'), '#1F1F1F', 'Chúc mừng', 'cậu già thêm 1 tuổi') },
  { id: 'nguoi-ngoai', name: 'Giải thích kiểu gì', mood: 'Cà khịa', bg: '#7650c9', design: tee(one('ancient-aliens'), '#FFFFFF', 'Không giải thích được', 'do người ngoài hành tinh') },
  { id: 'nghi-ngo', name: 'Không chắc nữa', mood: 'Bạn thân', bg: '#e4628f', design: tee(one('futurama-fry'), '#BFD7EA', 'Không chắc là', 'cậu đang đùa') },
  { id: 'ngo-nghieng', name: 'Có quà không đấy?', mood: 'Sinh nhật', bg: '#26387a', design: tee(two('megamind-peeking', 'squidward-window'), '#FFFFFF', 'Không quà à?') },
  { id: 'co-don', name: 'Họ đâu có biết', mood: 'Bạn thân', bg: '#d65e9a', design: tee(one('they-dont-know'), '#E8DCC4', 'Họ đâu có biết', 'tớ có quà cho cậu', 'Patrick Hand') },
  { id: 'cinema', name: 'Absolute cinema', mood: 'Sinh nhật', bg: '#2b2b2b', design: tee(one('absolute-cinema'), '#FFFFFF', 'Cậu là', 'absolute cinema') },
];
