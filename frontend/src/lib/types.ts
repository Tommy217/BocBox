export type MemeStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';
export type Meme = { id: number; slug: string; name: string; tags: string; popularity: number; sourceUrl: string | null; screeningNote: string; status?: MemeStatus };
export type ShirtColor = { id: number; name: string; hex: string };
export type SizeChart = { id: number; code: string; minHeight: number; maxHeight: number; minWeight: number; maxWeight: number };
export type SpyForm = { id: number; title: string; scenario: string; /** Link Google Form của nhóm (…/viewform để người nhận điền), null = kịch bản chưa có form. */
  googleFormCopyUrl: string | null; confessionText: string };
export type Batch = { id: number; code: string; openAt: string; closeAt: string; deliveryFrom: string; deliveryTo: string; status: string };
export type OrderStatus = 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'PAID' | 'PRINTING' | 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REPRINT';
export type ContentStatus = 'PENDING_REVIEW' | 'FLAGGED' | 'APPROVED' | 'NEEDS_EDIT';

/** Một meme đặt trên áo: tâm (x, y) và bề rộng w, tính theo tỉ lệ vùng in A4 (0..1). */
export type MemeLayer = { slug: string; x: number; y: number; w: number };
/** Khối 2 dòng chữ: tâm (x, y) và cỡ chữ s, tính theo tỉ lệ vùng in. */
export type TextBlock = { x: number; y: number; s: number };

export type Design = {
  memeSlug: string; colorHex: string; textLine1: string; textLine2: string;
  font: string; position: 'CHEST' | 'CENTER';
  /** Bố cục tự do; thiết kế cũ không có thì suy ra từ memeSlug + position (xem withLayout). */
  layers?: MemeLayer[]; text?: TextBlock;
};

/** Thiệp kèm hộp: SPY = thiệp điệp viên thú tội, MEME = thiệp in meme của áo, PLAIN = thiệp kraft trơn. */
export type CardStyle = 'SPY' | 'MEME' | 'PLAIN';

export type CreateOrder = Omit<Design, 'layers' | 'text'> & {
  layoutJson: string | null;
  cardStyle: CardStyle; cardMessage: string;
  giverName: string; recipientName: string; spyTemplateId: number | null; sizeCode: string;
  shippingName: string; shippingPhone: string; shippingAddress: string; email: string;
};

export type Order = Omit<CreateOrder, 'memeSlug' | 'textLine1' | 'textLine2' | 'cardStyle' | 'cardMessage'> & {
  cardStyle: CardStyle | null; cardMessage: string | null;
  code: string; createdAt: string; status: OrderStatus; contentStatus: ContentStatus; price: number;
  memeSlug: string | null; colorName: string; textLine1: string | null; textLine2: string | null;
  /** Tài khoản khách đặt đơn (null với đơn cũ). */
  customerName: string | null; customerPhone: string | null;
  batch: Batch; keychainDesign: string | null; carrier: string | null; trackingCode: string | null; reviewNote: string | null;
};

export type PaymentQr = { orderCode: string; amount: number; bankId: string; accountNo: string; accountName: string; transferContent: string; qrImageUrl: string };
export type BatchSummary = { totalOrders: number; paidOrders: number; revenue: number; awaitingReview: number; colorBySize: Record<string, Record<string, number>> };
export type BatchStat = { code: string; status: string; openAt: string; orders: number; paid: number; revenue: number };
export type Report = {
  paidBoxes: number; breakEvenBoxes: number; revenue: number; grossProfitEstimate: number; memePopularity: Record<string, number>;
  byBatch: BatchStat[]; byStatus: Partial<Record<OrderStatus, number>>;
};
export type StaffUser = { username: string; displayName: string; role: 'STAFF' | 'ADMIN'; expiresAt: string };
export type LoginResponse = { token: string; user: StaffUser };
/** Tài khoản khách (đăng nhập bằng số điện thoại). */
export type Customer = { id: number; phone: string; fullName: string; email: string | null; expiresAt: string };
export type CustomerLoginResponse = { token: string; customer: Customer };
export type NewCustomer = { phone: string; password: string; fullName: string; email: string };
export type UploadResult = { slug: string; url: string; contentType: string; sizeBytes: number };
export type Keychain = { id: number; seriesName: string; name: string; slug: string; stockQty: number };
/** Tài khoản nhân viên trong trang quản lý (chỉ ADMIN xem). */
export type StaffRow = { id: number; username: string; displayName: string; role: 'STAFF' | 'ADMIN'; active: boolean; createdAt: string | null; lastLoginAt: string | null };
export type NewStaff = { username: string; displayName: string; role: 'STAFF' | 'ADMIN'; password: string };

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'Chờ duyệt', PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', PRINTING: 'Đang in', PACKING: 'Đang đóng hộp',
  SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy', REPRINT: 'In lại',
};
/** Trạng thái được phép chuyển tới, giữ giống OrderStatus.next() trong CustomerOrder.java. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_APPROVAL: ['PENDING_PAYMENT', 'CANCELLED'], PENDING_PAYMENT: ['PAID', 'CANCELLED'], PAID: ['PRINTING', 'CANCELLED'], PRINTING: ['PACKING', 'REPRINT'],
  REPRINT: ['PRINTING'], PACKING: ['SHIPPING', 'REPRINT'], SHIPPING: ['DELIVERED'], DELIVERED: ['REPRINT'], CANCELLED: [],
};
export const CONTENT_LABEL: Record<ContentStatus, string> = {
  PENDING_REVIEW: 'Chờ duyệt nội dung', FLAGGED: 'Nghi vi phạm', APPROVED: 'Đã duyệt', NEEDS_EDIT: 'Cần sửa',
};
export const FONTS = [
  { id: 'Baloo 2', label: 'Baloo (tròn, vui)' },
  { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro (gọn)' },
  { id: 'Patrick Hand', label: 'Patrick Hand (viết tay)' },
];
