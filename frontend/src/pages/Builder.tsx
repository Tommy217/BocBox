import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { BLANK_DESIGN, designFromOrder, isBlankDesign, isUserImage, LOCAL_PREFIX, MAX_LAYERS, memeSrc, registerLocalImage, toOrderDesign, withLayout } from '../lib/art';
import { clearDraft, loadDraft, saveDraft, type Draft } from '../lib/draft';
import { useAuth } from '../lib/auth';
import { FONTS, type Batch, type CardStyle, type Design, type Meme, type MemeLayer, type ShirtColor, type SpyForm } from '../lib/types';
import { cardIdeas } from '../lib/cardIdeas';
import { useIntel } from '../lib/store';
import { MemePhoto, TeeEditor } from '../components/Canvases';
import { SizeGuide } from '../components/SizeGuide';
import { AuthorTag, CARD_STYLES, GiftCard } from '../components/Cards';
import { dmy, dmyhm, vnd } from '../components/ui';
import { Icon, party } from '../components/Fun';
import { k, priceLines, usePricing } from '../lib/pricing';

const STEPS = [
  { icon: 'sparkles', label: 'Meme & ảnh' },
  { icon: 'memo', label: 'Câu đùa' },
  { icon: 'paintbrush', label: 'Màu & size' },
  { icon: 'label', label: 'Tag & thiệp' },
  { icon: 'delivery-truck', label: 'Giao hàng' },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/** Thu nhỏ ảnh khách chọn (cạnh dài ≤ 1400 px) để lưu nháp và gửi lên nhẹ; PNG/WEBP giữ nền trong suốt. */
async function shrinkImage(file: File, max = 1400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error('Không đọc được ảnh này')); i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
    let out = file.type === 'image/jpeg' ? cv.toDataURL('image/jpeg', 0.9) : cv.toDataURL('image/png');
    if (out.length > 3_500_000) out = cv.toDataURL('image/jpeg', 0.85); // PNG quá nặng (> ~2,5 MB) thì đổi JPG
    return out;
  } finally { URL.revokeObjectURL(url); }
}
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export default function Builder() {
  const { intel } = useIntel();
  const { customer, requireLogin } = useAuth();
  const nav = useNavigate();
  // ?edit=MÃ_ĐƠN: sửa đơn đã đặt (sau khi shop báo "Cần sửa"); không đụng tới nháp trên máy
  const editCode = useSearchParams()[0].get('edit');
  const draft = useMemo<Partial<Draft>>(() => (editCode ? {} : loadDraft()), [editCode]);
  const resumed = useRef(!editCode && !!draft.design && !isBlankDesign({ ...BLANK_DESIGN, layers: undefined, ...draft.design }));
  const [uploads, setUploads] = useState<Record<string, string>>(draft.uploads ?? {});
  const [draftFull, setDraftFull] = useState(false);
  const [editing, setEditing] = useState<{ code: string; note: string | null } | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [colors, setColors] = useState<ShirtColor[]>([]);
  const [forms, setForms] = useState<SpyForm[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [design, setDesign] = useState<Design>(() => {
    // chưa chọn mẫu nào → áo trơn, chưa có meme hay chữ; nháp cũ (chỉ có memeSlug) được đổi sang bố cục lớp
    const d: Design = draft.design ? { ...BLANK_DESIGN, layers: undefined, ...draft.design } : BLANK_DESIGN;
    return { ...d, ...withLayout(d), position: 'CENTER' };
  });
  const [sel, setSel] = useState<number | 'text' | null>(null);
  const location = useLocation();
  const [size, setSize] = useState(intel.sizeCode ?? draft.size ?? 'M');
  const [giver, setGiver] = useState(draft.giver ?? ''), [recipient, setRecipient] = useState(draft.recipient ?? '');
  const [spyId, setSpyId] = useState<number | null>(intel.spyTemplateId ?? draft.spyId ?? null);
  const [cardStyle, setCardStyle] = useState<CardStyle>(draft.cardStyle ?? 'SPY');
  const [cardMessage, setCardMessage] = useState(draft.cardMessage ?? '');
  const [ship, setShip] = useState({ shippingName: '', shippingPhone: '', shippingAddress: '', email: '' });
  // mở từ kệ hộp có sẵn thì áo đã xong, nhảy thẳng tới bước tag & thiệp
  const [step, setStep] = useState(() => (location.state as { step?: number } | null)?.step ?? 0);
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false);

  useEffect(() => {
    const show = (e: Error) => setErr(e.message);
    api.memes().then(setMemes).catch(show); api.colors().then(setColors).catch(show); api.openBatch().then(setBatch).catch(show);
    api.spyForms().then((f) => { setForms(f); setSpyId((s) => s ?? f[0]?.id ?? null); }).catch(show);
  }, []);
  // sửa đơn: tải đơn của chính khách (cần đăng nhập) đổ vào xưởng
  useEffect(() => {
    if (!editCode) return;
    (async () => {
      if (!(await requireLogin('Đăng nhập để sửa đơn ' + editCode))) { setErr('Cần đăng nhập để sửa đơn.'); return; }
      try {
        const o = await api.customer.order(editCode);
        if (!['PENDING_APPROVAL', 'PENDING_PAYMENT'].includes(o.status)) { setErr(`Đơn ${o.code} đã thanh toán hoặc đã vào sản xuất, không sửa được nữa.`); return; }
        const d = designFromOrder(o);
        setDesign({ ...d, ...withLayout(d), position: 'CENTER' });
        setSize(o.sizeCode); setGiver(o.giverName); setRecipient(o.recipientName); setSpyId(o.spyTemplateId);
        setCardStyle(o.cardStyle ?? 'SPY'); setCardMessage(o.cardMessage ?? '');
        setShip({ shippingName: o.shippingName, shippingPhone: o.shippingPhone, shippingAddress: o.shippingAddress, email: o.email ?? '' });
        setEditing({ code: o.code, note: o.contentStatus === 'NEEDS_EDIT' ? o.reviewNote : null });
      } catch (ex) { setErr((ex as Error).message); }
    })();
  }, [editCode]);

  useEffect(() => {
    if (editCode) return;
    // chỉ giữ ảnh tải lên còn nằm trên áo, cho nhẹ bộ nhớ trình duyệt
    const used = Object.fromEntries(Object.entries(uploads).filter(([id]) => withLayout(design).layers.some((l) => l.slug === LOCAL_PREFIX + id)));
    setDraftFull(!saveDraft({ design, size, giver, recipient, spyId, cardStyle, cardMessage, uploads: used }));
  }, [design, size, giver, recipient, spyId, cardStyle, cardMessage, uploads]);

  // đã đăng nhập thì điền sẵn người nhận hàng = chủ tài khoản (khách vẫn sửa được)
  useEffect(() => {
    if (!customer) return;
    setShip((s) => ({ ...s, shippingName: s.shippingName || customer.fullName, shippingPhone: s.shippingPhone || customer.phone, email: s.email || customer.email || '' }));
  }, [customer?.id]);

  // đổi bước thì cuộn lên đầu khung bước nếu nó đang nằm khuất phía trên
  const panelRef = useRef<HTMLFormElement>(null), firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    const el = panelRef.current;
    if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const confession = useMemo(() => forms.find((f) => f.id === spyId)?.confessionText ?? '', [forms, spyId]);
  const colorName = colors.find((c) => c.hex === design.colorHex)?.name ?? '';
  const upd = (p: Partial<Design>) => setDesign((d) => ({ ...d, ...p }));
  const { layers, text } = withLayout(design);
  const pricing = usePricing();
  const lines = priceLines(pricing, layers.length, cardStyle);
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const memeName = (slug: string) => (isUserImage(slug) ? 'Ảnh của bạn' : memes.find((m) => m.slug === slug)?.name ?? slug);
  const selLayer = typeof sel === 'number' ? layers[sel] : undefined;
  const setLayers = (ls: MemeLayer[]) => upd({ layers: ls, memeSlug: ls[0]?.slug ?? '' });
  const fileRef = useRef<HTMLInputElement>(null);

  /** Khách chọn ảnh trên máy: thu nhỏ, giữ trong nháp ("local:"), đặt lên áo. Gửi lên server lúc bấm đặt hộp. */
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setErr('');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setErr('Chỉ nhận ảnh PNG, JPG hoặc WEBP.'); return; }
    if (file.size > 20 * 1024 * 1024) { setErr('Ảnh lớn quá (tối đa 20 MB trước khi thu nhỏ).'); return; }
    try {
      const url = await shrinkImage(file), id = newId();
      registerLocalImage(id, url);
      setUploads((u) => ({ ...u, [id]: url }));
      pickMeme(LOCAL_PREFIX + id);
    } catch (ex) { setErr((ex as Error).message); }
  }
  function startOver() {
    if (!confirm('Xóa hết meme, ảnh và chữ trên áo để làm lại từ áo trơn?')) return;
    setDesign(BLANK_DESIGN); setUploads({}); setSel(null); resumed.current = false;
  }

  /** Bấm một meme: thêm lớp mới ở giữa vùng in, hoặc thay ảnh của lớp đang chọn khi đã đủ 4 meme. */
  function pickMeme(slug: string) {
    if (layers.length < MAX_LAYERS) {
      // xếp lệch nhau một chút để hình mới không đè kín hình cũ
      setLayers([...layers, { slug, x: 0.5, y: 0.3 + 0.12 * layers.length, w: 0.5 }]); setSel(layers.length);
    } else if (typeof sel === 'number') {
      setLayers(layers.map((l, i) => (i === sel ? { ...l, slug } : l)));
    } else setErr(`Áo tối đa ${MAX_LAYERS} meme. Chọn một meme trên áo để thay, hoặc xóa bớt.`);
  }
  function removeLayer() {
    if (typeof sel !== 'number') return;
    setLayers(layers.filter((_, i) => i !== sel)); setSel(null);
  }
  function bringToFront() {
    if (typeof sel !== 'number') return;
    setLayers([...layers.filter((_, i) => i !== sel), layers[sel]]); setSel(layers.length - 1);
  }

  /** Bước 4 cần tên hai người trước khi sang giao hàng. */
  const blocker = step === 3 && (!giver.trim() || !recipient.trim()) ? 'Điền tên người tặng và người nhận để in lên tag nhé.' : '';
  function next(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (blocker) { setErr(blocker); return; }
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    submit();
  }
  /** Gửi ảnh tự tải lên (slug "local:") lên server, đổi thành slug "u:"; dùng chung cho đặt hộp và lưu mẫu. */
  async function uploadLocalImages(): Promise<Design> {
    const map: Record<string, string> = {};
    for (const l of layers) {
      if (!l.slug.startsWith(LOCAL_PREFIX) || map[l.slug]) continue;
      const blob = await (await fetch(memeSrc(l.slug))).blob();
      map[l.slug] = (await api.customer.upload(blob, `anh-ao.${blob.type.split('/')[1] ?? 'png'}`)).slug;
    }
    const final: Design = { ...design, layers: layers.map((l) => (map[l.slug] ? { ...l, slug: map[l.slug] } : l)) };
    if (Object.keys(map).length) setDesign(final); // bấm lại sau lỗi không phải gửi ảnh lần nữa
    return final;
  }

  /** Lưu thiết kế áo hiện tại vào "Mẫu của tôi" (cần đăng nhập); không ảnh hưởng nháp hay đơn. */
  const [saveName, setSaveName] = useState(''), [saving, setSaving] = useState(false), [saveMsg, setSaveMsg] = useState('');
  async function saveDesign() {
    setSaveMsg('');
    if (isBlankDesign(design)) { setSaveMsg('Áo đang trống, thêm meme hoặc chữ rồi hãy lưu.'); return; }
    if (!(await requireLogin('Đăng nhập để lưu mẫu vào Mẫu của tôi. Thiết kế đang làm vẫn được giữ nguyên.'))) return;
    setSaving(true);
    try {
      const final = await uploadLocalImages();
      const d = toOrderDesign(final);
      const name = saveName.trim() || (design.textLine1.trim() || memeName(layers[0]?.slug ?? '') || 'Mẫu áo').slice(0, 40);
      await api.customer.saveDesign({ name, colorHex: d.colorHex, textLine1: d.textLine1, textLine2: d.textLine2, font: d.font, layoutJson: d.layoutJson });
      setSaveName(''); setSaveMsg(`Đã lưu “${name}” vào Mẫu của tôi.`);
    } catch (ex) { setSaveMsg((ex as Error).message); } finally { setSaving(false); }
  }

  /** Bấm đặt: khách vãng lai phải đăng nhập (popup), thiết kế vẫn giữ nguyên; đăng nhập xong đặt tiếp luôn. */
  async function submit() {
    if (isBlankDesign(design)) { setErr('Áo đang trống: thêm ít nhất một meme, ảnh hoặc dòng chữ nhé.'); setStep(0); return; }
    if (!(await requireLogin('Đăng nhập hoặc đăng ký nhanh bằng số điện thoại để đặt hộp. Bản thiết kế của bạn vẫn được giữ nguyên.'))) {
      setErr('Cần đăng nhập để đặt hộp. Thiết kế đã được lưu trong nháp trên máy này.'); return;
    }
    setBusy(true); setErr('');
    try {
      const final = await uploadLocalImages();
      const body = { ...toOrderDesign(final), giverName: giver, recipientName: recipient, spyTemplateId: spyId, sizeCode: size, cardStyle, cardMessage, ...ship };
      const o = editCode ? await api.customer.updateOrder(editCode, body) : await api.customer.createOrder(body);
      if (!editCode) clearDraft();
      party(); nav(`/orders/${o.code}`, { state: { fresh: !editCode, edited: !!editCode } });
    } catch (ex) { setErr((ex as Error).message); } finally { setBusy(false); }
  }
  const usedUploads = Object.keys(uploads);

  return (
    <div className="page builder">
      <aside className="builder-preview">
        <div className="preview-stage">
          <TeeEditor design={design} width={400} selected={sel} onSelect={setSel} tag={{ giver, recipient }} onChange={(p) => upd({ ...p, memeSlug: p.layers[0]?.slug ?? '' })} />
        </div>
        <p className="muted small center drag-hint">Kéo meme hoặc chữ trên áo để di chuyển · kéo góc cam để đổi cỡ · tag vải may ở gấu áo</p>
        <div className="preview-colors" role="radiogroup" aria-label="Màu áo">
          {colors.map((c) => <button type="button" key={c.hex} title={c.name} aria-label={c.name} aria-checked={design.colorHex === c.hex} role="radio"
            className={`swatch ${design.colorHex === c.hex ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => upd({ colorHex: c.hex })} />)}
        </div>
        <div className="save-design">
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)} maxLength={40} placeholder="Tên mẫu (vd. Áo sinh nhật Lan)" aria-label="Tên mẫu để lưu" />
          <button type="button" className="btn small ghost" onClick={saveDesign} disabled={saving}><Icon name="star" size={18} /> {saving ? 'Đang lưu…' : 'Lưu vào Mẫu của tôi'}</button>
          {saveMsg && <p className="small save-msg">{saveMsg} {saveMsg.startsWith('Đã lưu') && <Link to="/my-designs">Xem Mẫu của tôi</Link>}</p>}
        </div>
        <dl className="summary">
          <div><dt>Meme</dt><dd>{layers.length ? layers.map((l) => memeName(l.slug)).join(', ') : 'Chưa có'}</dd></div>
          <div><dt>Áo</dt><dd>{colorName} · size {size}</dd></div>
          <div><dt>Vùng in</dt><dd>Mặt trước, khổ A4</dd></div>
          {lines.map((l, i) => <div key={l.label} className={i ? 'extra' : ''}><dt>{i ? '+ ' : ''}{l.label}</dt><dd>{vnd(l.amount)}</dd></div>)}
          <div className="total"><dt>Tổng</dt><dd>{vnd(total)}</dd></div>
        </dl>
        <p className="muted small center">{editCode ? `Đang sửa đơn ${editCode}: lưu xong đơn được duyệt lại.` : draftFull ? 'Ảnh lớn quá nên nháp không lưu được trên máy, đừng tải lại trang nhé.' : 'Nháp được lưu tự động trên máy này: sang trang khác xem mẫu rồi quay lại vẫn còn.'}</p>
      </aside>

      <form className="builder-panel" onSubmit={next} ref={panelRef}>
        <div className="page-head small"><Icon name="t-shirt" size={48} /><div><h1>{editCode ? `Sửa đơn ${editCode}` : 'Xưởng in áo'}</h1><p className="muted">Mọi thay đổi hiện ngay trên áo bên cạnh.</p></div></div>
        {editing?.note && <p className="callout small"><Icon name="edit" size={20} /> Shop cần bạn sửa: <b>{editing.note}</b></p>}
        {!editCode && resumed.current && (
          <p className="callout small resume">Đang tiếp tục bản thiết kế dở của bạn.
            <button type="button" className="link-btn" onClick={startOver}>Làm lại từ áo trơn</button> · <Link to="/shop">Xem mẫu có sẵn</Link> · <Link to="/my-designs">Mẫu của tôi</Link></p>
        )}

        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s.label}>
              <button type="button" className={i === step ? 'on' : i < step ? 'done' : ''} disabled={i > step}
                onClick={() => { setErr(''); setStep(i); }}><span>{i < step ? '✓' : i + 1}</span>{s.label}</button>
            </li>
          ))}
        </ol>

        <fieldset key={step}>
          <legend><Icon name={STEPS[step].icon} size={22} /> {STEPS[step].label}</legend>

          {step === 0 && <>
            <div className="layer-bar">
              <span>Trên áo: <b>{layers.length}/{MAX_LAYERS}</b> meme{layers.length >= 2 && <span className="price-chip">+{k(pricing.extraMemes)}</span>}</span>
              <div className="layer-chips">
                {layers.map((l, i) => (
                  <button type="button" key={i} className={`layer-chip ${sel === i ? 'on' : ''}`} onClick={() => setSel(i)} title={memeName(l.slug)}>
                    <MemePhoto slug={l.slug} size={36} alt={memeName(l.slug)} />
                  </button>
                ))}
              </div>
            </div>
            {selLayer ? (
              <div className="layer-tools">
                <span className="field-label">Meme đang chọn: {memeName(selLayer.slug)}</span>
                <label className="range-row">Cỡ
                  <input type="range" min={0.12} max={1} step={0.01} value={selLayer.w}
                    onChange={(e) => setLayers(layers.map((l, i) => (i === sel ? { ...l, w: +e.target.value, x: Math.min(Math.max(l.x, +e.target.value / 2), 1 - +e.target.value / 2) } : l)))} />
                </label>
                <div className="choice-row">
                  <button type="button" className="choice" onClick={bringToFront}>Đưa lên trên cùng</button>
                  <button type="button" className="choice" onClick={removeLayer}>Xóa khỏi áo</button>
                  <button type="button" className="choice" onClick={() => setSel(null)}>Bỏ chọn</button>
                </div>
              </div>
            ) : <p className="muted small">{layers.length ? `Bấm một meme hoặc tải ảnh lên để thêm (tối đa ${MAX_LAYERS}). Bấm hình trên áo để chọn, rồi kéo để di chuyển.`
              : 'Áo đang trơn. Bấm một meme bên dưới hoặc tải ảnh của bạn lên để bắt đầu (có thể chỉ in chữ ở bước sau).'}</p>}
            <div className="upload-row">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
              <button type="button" className="upload-opt" onClick={() => fileRef.current?.click()}>
                <Icon name="plus" size={28} /><span>Tải ảnh từ máy</span><small className="muted">PNG, JPG, WEBP</small>
              </button>
              {usedUploads.map((id) => (
                <button type="button" key={id} className={`meme-opt user-img ${layers.some((l) => l.slug === LOCAL_PREFIX + id) ? 'on' : ''}`} onClick={() => pickMeme(LOCAL_PREFIX + id)} title="Thêm lại ảnh này">
                  <MemePhoto slug={LOCAL_PREFIX + id} size={96} alt="Ảnh của bạn" /><span>Ảnh của bạn</span>
                </button>
              ))}
            </div>
            <p className="muted small"><Icon name="label" size={16} /> Giá {k(pricing.base)} đã gồm 1 meme hoặc ảnh. Thêm meme/ảnh thứ 2 đến thứ {MAX_LAYERS} chỉ cộng <b>{k(pricing.extraMemes)}</b> một lần.</p>
            <p className="muted small">Ảnh tự tải lên được shop duyệt cùng đơn (rõ nét, không vi phạm bản quyền hay nội dung xấu). Nền trong suốt (PNG) in đẹp nhất.</p>
            <div className="meme-grid">
              {memes.map((m) => (
                <button type="button" key={m.slug} className={`meme-opt ${layers.some((l) => l.slug === m.slug) ? 'on' : ''}`} onClick={() => pickMeme(m.slug)}>
                  <MemePhoto slug={m.slug} size={96} alt={m.name} /><span>{m.name}</span>
                </button>
              ))}
            </div>
          </>}

          {step === 1 && <>
            <label><span className="label-row">Dòng 1<span className="muted small">{design.textLine1.length}/28</span></span><input maxLength={28} value={design.textLine1} onChange={(e) => upd({ textLine1: e.target.value })} /></label>
            <label><span className="label-row">Dòng 2<span className="muted small">{design.textLine2.length}/28</span></span><input maxLength={28} value={design.textLine2} onChange={(e) => upd({ textLine2: e.target.value })} /></label>
            <div>
              <span className="field-label">Kiểu chữ</span>
              <div className="choice-row">
                {FONTS.map((f) => <button type="button" key={f.id} className={`choice ${design.font === f.id ? 'on' : ''}`} style={{ fontFamily: f.id }} onClick={() => upd({ font: f.id })}>{f.label}</button>)}
              </div>
            </div>
            <label className="range-row">Cỡ chữ
              <input type="range" min={0.03} max={0.12} step={0.005} value={text.s} onChange={(e) => upd({ text: { ...text, s: +e.target.value } })} />
            </label>
            <p className="muted small">Kéo khối chữ trên áo để đặt chỗ khác. Chữ được nhóm duyệt trước khi in; để trống nếu chỉ muốn in meme.</p>
          </>}

          {step === 2 && <>
            <div>
              <span className="field-label">Màu áo</span>
              <div className="choice-row">
                {colors.map((c) => <button type="button" key={c.hex} className={`choice ${design.colorHex === c.hex ? 'on' : ''}`} onClick={() => upd({ colorHex: c.hex })}>
                  <i className="dot" style={{ background: c.hex }} />{c.name}</button>)}
              </div>
            </div>
            <div>
              <span className="field-label">Size (form unisex rộng){intel.sizeCode && <span className="muted small"> · gợi ý từ phòng điệp viên: {intel.sizeCode}</span>}</span>
              <div className="choice-row">{SIZES.map((s) => <button type="button" key={s} className={`choice size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>{s}</button>)}</div>
            </div>
            <SizeGuide value={size} onPick={setSize} />
            <p className="muted small">Chưa biết size? <a href="#/spy">Vào Phòng điệp viên</a> để hỏi khéo người nhận.</p>
          </>}

          {step === 3 && <>
            <div className="row gap">
              <label>Người tặng<input value={giver} onChange={(e) => setGiver(e.target.value)} placeholder="Minh" maxLength={100} /></label>
              <label>Người nhận<input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Lan" maxLength={100} /></label>
            </div>
            <div>
              <span className="field-label">Kiểu thiệp</span>
              <div className="card-styles">
                {CARD_STYLES.map((c) => (
                  <button type="button" key={c.id} className={`choice card-style ${cardStyle === c.id ? 'on' : ''}`} onClick={() => setCardStyle(c.id)}>
                    <b>{c.label}{c.id === 'MEME' && <span className="price-chip">{layers.length ? `+${k(pricing.memeCard)}` : 'cần meme trên áo'}</span>}</b><span className="small muted">{c.note}</span>
                  </button>
                ))}
              </div>
            </div>
            {cardStyle === 'SPY' && <label>Kịch bản đã dùng để lấy size (lời thú tội in sẵn)<select value={spyId ?? ''} onChange={(e) => setSpyId(+e.target.value)}>{forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}</select></label>}
            <label>
              <span className="label-row">Lời nhắn trên thiệp<span className="muted small">{cardMessage.length}/300</span></span>
              <textarea rows={3} maxLength={300} value={cardMessage} onChange={(e) => setCardMessage(e.target.value)} placeholder="Tự viết, hoặc bấm một gợi ý bên dưới" />
            </label>
            <div className="ideas">
              <span className="small muted">Shop gợi ý theo meme trên áo:</span>
              {cardIdeas(layers.map((l) => l.slug)).map((idea) => <button type="button" key={idea} className="idea" onClick={() => setCardMessage(idea)}>{idea}</button>)}
            </div>
            <div className="flatlay" aria-label="Tag và thiệp trong hộp">
              <GiftCard style={cardStyle} giver={giver} recipient={recipient} message={cardMessage} confession={confession} memeSlug={layers[0]?.slug} width={340} />
              <AuthorTag giver={giver} recipient={recipient} width={190} />
            </div>
            <p className="muted small">Tag vải được may ở gấu áo (xem áo bên cạnh). Thiệp in trên giấy kraft 15×10 cm, lời nhắn được nhóm duyệt cùng chữ trên áo.</p>
          </>}

          {step === 4 && <>
            <div className="row gap">
              <label>Tên người nhận hàng<input required value={ship.shippingName} onChange={(e) => setShip({ ...ship, shippingName: e.target.value })} /></label>
              <label>Số điện thoại<input required inputMode="tel" pattern="0\d{9}" title="10 số, bắt đầu bằng 0" value={ship.shippingPhone} onChange={(e) => setShip({ ...ship, shippingPhone: e.target.value })} placeholder="09xxxxxxxx" /></label>
            </div>
            <label>Địa chỉ<input required value={ship.shippingAddress} onChange={(e) => setShip({ ...ship, shippingAddress: e.target.value })} /></label>
            <label>Email nhận thông báo (không bắt buộc)<input type="email" value={ship.email} onChange={(e) => setShip({ ...ship, email: e.target.value })} /></label>
            {batch && <p className="callout small">Vào đợt <b>{batch.code}</b>, chốt {dmyhm(batch.closeAt)}. Hàng giao <b>{dmy(batch.deliveryFrom)}–{dmy(batch.deliveryTo)}</b>. Shop duyệt thiết kế trước, <b>duyệt xong bạn mới chuyển khoản</b>. Theo dõi, sửa hoặc hủy ở mục Đơn của tôi tới khi chốt đợt.</p>}
            {!customer && <p className="muted small"><Icon name="lock" size={16} /> Bạn đang xem với tư cách khách. Bấm đặt hộp sẽ hiện ô đăng nhập / đăng ký nhanh, thiết kế không bị mất.</p>}
          </>}
        </fieldset>

        {err && <p className="error">{err}</p>}
        <div className="step-nav">
          {step > 0 && <button type="button" className="btn ghost" onClick={() => { setErr(''); setStep(step - 1); }}>Quay lại</button>}
          {step < STEPS.length - 1
            ? <button className="btn">Tiếp: {STEPS[step + 1].label} →</button>
            : <button className="btn big" disabled={busy || (!!editCode && !editing)}><Icon name="wrapped-gift" size={26} />
              {busy ? 'Đang gói…' : editCode ? `Lưu thay đổi & gửi duyệt lại · ${vnd(total)}` : customer ? `Bỏ vào hộp · ${vnd(total)}` : `Đăng nhập & bỏ vào hộp · ${vnd(total)}`}</button>}
        </div>
      </form>
    </div>
  );
}
