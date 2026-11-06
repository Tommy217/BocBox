// Lời nhắn shop gợi ý cho thiệp, theo meme trên áo. Khách bấm để điền rồi sửa tiếp.
const BY_MEME: Record<string, string[]> = {
  'surprised-pikachu': ['Bất ngờ chưa! Quà này tớ âm mưu từ tháng trước rồi đấy.', 'Mặt cậu khi mở hộp chắc y chang con Pikachu trên áo.'],
  'this-is-fine': ['Deadline cháy nhà cũng được, miễn cậu vẫn ổn. Tớ luôn ở đây.', 'Mọi thứ sẽ ổn thôi, còn không ổn thì có tớ.'],
  'woman-yelling-at-cat': ['Cãi nhau cả năm nhưng vẫn quý cậu nhất. Mặc áo này đi cãi tiếp nhé!'],
  'hide-the-pain-harold': ['Năm cuối rồi, cười lên dù hơi gượng. Tốt nghiệp xong tớ bao trà sữa.'],
  'monkey-puppet': ['Đừng liếc nữa, quà của cậu thật đấy.', 'Lúc tớ hỏi size cậu, mặt cậu y như con khỉ này.'],
  'mocking-spongebob': ['tỚ kHôNg dỖi ĐâU. Hết dỗi rồi thì mặc áo vào đi ăn lẩu!'],
  'roll-safe': ['Không bao giờ quên sinh nhật nếu đặt quà từ tuần trước. Khôn chưa?'],
  'laughing-leo': ['Cười lên đi, tuổi mới phải vui như Leo!'],
  'disaster-girl': ['Sinh nhật vui vẻ nha đồ phá hoại!', 'Cậu phá đâu tớ dọn đó, bạn thân là vậy.'],
  'leo-cheers': ['Nâng ly chúc cậu tuổi mới ăn không béo, ngủ đủ 8 tiếng.', 'Chúc mừng! Cậu lại già thêm 1 tuổi rồi.'],
  'kermit-tea': ['Chuyện thiên hạ kệ họ, mình cứ uống trà và mặc áo đẹp.'],
  'megamind-peeking': ['Không quà à? Có đây rồi, đừng ngó nữa!'],
  'absolute-cinema': ['Cảm ơn vì đã là nhân vật chính trong mọi câu chuyện của nhóm mình.'],
  'they-dont-know': ['Họ đâu có biết tớ chuẩn bị quà cho cậu từ lâu rồi.'],
  'change-my-mind': ['Cậu là bạn thân nhất của tớ. Cãi đi!'],
  'waiting-skeleton': ['Chờ cậu trả lời tin nhắn lâu như bộ xương này. Nhận quà rồi rep tớ nhé!'],
  'ancient-aliens': ['Không giải thích được vì sao tớ quý cậu thế. Chắc do người ngoài hành tinh.'],
  'futurama-fry': ['Không chắc cậu sẽ thích, nhưng chắc chắn cậu sẽ cười.'],
  'squidward-window': ['Đừng ghen tị nữa, giờ cậu cũng có áo meme rồi.'],
  'grandma-internet': ['Gửi người bạn lúc nào cũng hỏi "cái này dùng sao?". Thương lắm!'],
};
const GENERIC = ['Chúc cậu luôn vui như meme trên áo!', 'Mặc áo này mỗi lần cần nhớ ra có người luôn đứng về phía cậu.'];

/** Tối đa 4 gợi ý, ưu tiên theo các meme trên áo. */
export function cardIdeas(memeSlugs: string[]) {
  const ideas = [...new Set([...memeSlugs.flatMap((s) => BY_MEME[s] ?? []), ...GENERIC])];
  return ideas.slice(0, 4);
}
