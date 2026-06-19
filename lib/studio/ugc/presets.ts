// lib/studio/ugc/presets.ts
// ══════════════════════════════════════════════════════════════
// UGC VIDEO GENERATOR — Preset Data & Prompt Engine
// ══════════════════════════════════════════════════════════════

import type {
  ContentType, ContentTypeId,
  CharacterPreset, LanguageOption, LanguageId, AccentId,
  VideoPreset, VideoPresetId,
  DurationSec, ResolutionOption, OutputResolution,
  ProductCategoryId, SubtitleStyle, CtaOverlay, MusicCategory,
} from './types'

// ══ STEP 1 — Content Types ════════════════════════════════════
export const CONTENT_TYPES: ContentType[] = [
  { id:'ugc-review',          label:'UGC Review',           icon:'⭐', desc:'Review jujur dari sudut pandang pengguna', platform:'Semua', color:'#F59E0B' },
  { id:'ugc-testimonial',     label:'UGC Testimonial',      icon:'💬', desc:'Cerita pengalaman nyata pakai produk',      platform:'Semua', color:'#10B981' },
  { id:'ugc-problem-solution',label:'Problem Solution',     icon:'💡', desc:'Tunjukkan problem & produk sebagai solusi', platform:'TikTok', color:'#8B5CF6', badge:'High CVR' },
  { id:'ugc-unboxing',        label:'UGC Unboxing',         icon:'📦', desc:'Unboxing & first impression produk',        platform:'TikTok', color:'#3B82F6' },
  { id:'ugc-demonstration',   label:'UGC Demo',             icon:'🎯', desc:'Demo cara pakai produk step by step',      platform:'IG/TikTok', color:'#F97316' },
  { id:'ugc-showcase',        label:'Product Showcase',     icon:'✨', desc:'Highlight fitur & keunggulan produk',      platform:'Shopee', color:'#EC4899' },
  { id:'ugc-before-after',    label:'Before & After',       icon:'🔄', desc:'Transformasi sebelum & sesudah pakai',     platform:'Semua', color:'#06B6D4', badge:'Viral' },
  { id:'ugc-affiliate',       label:'Affiliate Review',     icon:'🔗', desc:'Review dengan personal branding affiliate', platform:'TikTok', color:'#F59E0B' },
  { id:'ugc-tiktok-shop',     label:'TikTok Shop',          icon:'🎵', desc:'Format khusus TikTok Shop Live & FYP',     platform:'TikTok Shop', color:'#000000', badge:'🔥' },
  { id:'ugc-shopee-video',    label:'Shopee Video',         icon:'🛍️', desc:'Format native Shopee Video',              platform:'Shopee', color:'#EE4D2D' },
  { id:'ugc-facebook-ads',    label:'Facebook Ads',         icon:'📘', desc:'Video ad untuk Facebook & Instagram',      platform:'Facebook', color:'#1877F2' },
  { id:'ugc-instagram-reels', label:'Instagram Reels',      icon:'📸', desc:'Reel 9:16 viral untuk Instagram FYP',     platform:'Instagram', color:'#E1306C', badge:'Trending' },
]

// ══ STEP 3 — Characters ════════════════════════════════════════
export const CHARACTER_PRESETS: CharacterPreset[] = [
  // Female
  { id:'f-indonesia-young',  label:'Wanita Indo Muda',   icon:'👩',  gender:'female', style:'indonesian',  age:'18-25', desc:'Indonesia, 18-25th, casual & energik',      avatarBg:'#FEF3C7' },
  { id:'f-indonesia-mature', label:'Wanita Indo Mature', icon:'👩‍🦱', gender:'female', style:'indonesian',  age:'25-35', desc:'Indonesia, 25-35th, professional & trusted', avatarBg:'#ECFDF5' },
  { id:'f-hijab-young',      label:'Hijab Muda',         icon:'🧕',  gender:'female', style:'hijab',       age:'18-25', desc:'Hijab kasual, 18-25th, relatable & friendly', avatarBg:'#F5F3FF' },
  { id:'f-hijab-mature',     label:'Hijab Professional', icon:'🧕',  gender:'female', style:'hijab',       age:'25-35', desc:'Hijab elegan, 25-35th, trusted & authoritative',avatarBg:'#EFF6FF' },
  { id:'f-asian-young',      label:'Asia Muda',          icon:'👩‍🦰', gender:'female', style:'asian',       age:'18-25', desc:'Asian K-pop vibe, 18-25th, trendy',          avatarBg:'#FDF2F8' },
  { id:'f-western-young',    label:'Western Female',     icon:'👱‍♀️', gender:'female', style:'western',     age:'25-35', desc:'Western, 25-35th, confident & premium',      avatarBg:'#F0FDF4' },
  { id:'f-professional',     label:'Profesional Wanita', icon:'👩‍💼', gender:'female', style:'professional',age:'35-45', desc:'Formal, authoritative, expert positioning',   avatarBg:'#EFF6FF' },
  { id:'f-casual',           label:'Kasual Wanita',      icon:'🙋‍♀️', gender:'female', style:'casual',      age:'18-25', desc:'Santai, relatable, everyday lifestyle',       avatarBg:'#FFFBEB' },
  // Male
  { id:'m-indonesia-young',  label:'Pria Indo Muda',     icon:'👨',  gender:'male',   style:'indonesian',  age:'18-25', desc:'Indonesia, 18-25th, casual & energik',       avatarBg:'#FEF3C7' },
  { id:'m-indonesia-mature', label:'Pria Indo Mature',   icon:'👨‍🦱', gender:'male',   style:'indonesian',  age:'25-35', desc:'Indonesia, 25-35th, trustworthy & solid',    avatarBg:'#ECFDF5' },
  { id:'m-asian-young',      label:'Asia Muda Pria',     icon:'👨‍🦰', gender:'male',   style:'asian',       age:'18-25', desc:'Asian, 18-25th, fresh & trendy',             avatarBg:'#F5F3FF' },
  { id:'m-western',          label:'Western Male',       icon:'👱‍♂️', gender:'male',   style:'western',     age:'25-35', desc:'Western, 25-35th, confident & credible',     avatarBg:'#F0FDF4' },
  { id:'m-professional',     label:'Profesional Pria',   icon:'👨‍💼', gender:'male',   style:'professional',age:'35-45', desc:'Formal, expert, trusted advisor vibes',      avatarBg:'#EFF6FF' },
  { id:'m-casual',           label:'Kasual Pria',        icon:'🙋‍♂️', gender:'male',   style:'casual',      age:'18-25', desc:'Santai, friendly, everyday bro energy',      avatarBg:'#FDF2F8' },
]

export const CHARACTER_FEMALE = CHARACTER_PRESETS.filter(c => c.gender === 'female')
export const CHARACTER_MALE   = CHARACTER_PRESETS.filter(c => c.gender === 'male')

// ══ STEP 4 — Language ══════════════════════════════════════════
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'indonesia', label: 'Indonesia', flag: '🇮🇩',
    accents: [
      { id:'natural-id', label:'Natural Indonesia' },
      { id:'formal-id',  label:'Formal Indonesia' },
      { id:'casual-id',  label:'Kasual / Gaul' },
    ],
  },
  {
    id: 'english', label: 'English', flag: '🇺🇸',
    accents: [
      { id:'american-en', label:'American English' },
      { id:'british-en',  label:'British English' },
    ],
  },
]

// ══ STEP 6 — Video Presets ═════════════════════════════════════
export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id:'viral-tiktok', label:'Viral TikTok', icon:'🔥', platform:'TikTok', badge:'Most Popular',
    desc:'Hook kuat 3 detik pertama, storytelling cepat, CTA FOMO',
    toneStyle:'Energik, speaking-to-camera, fast-cut pacing',
    hook:'Hook pattern: "POV: Kamu akhirnya nemuin..."',
    cta:'Link di bio! Jangan sampai kehabisan 🔥',
    durationHint:30,
  },
  {
    id:'tiktok-shop', label:'TikTok Shop', icon:'🛒', platform:'TikTok Shop', badge:'🔥 High CVR',
    desc:'Format live & video TikTok Shop, highlight promo & harga',
    toneStyle:'Casual, langsung to the point, strong product focus',
    hook:'Harga segini, kualitas premium? Cek deh!',
    cta:'Klik keranjang sekarang, gratis ongkir!',
    durationHint:30,
  },
  {
    id:'shopee-video', label:'Shopee Video', icon:'🛍️', platform:'Shopee',
    desc:'Native Shopee Video format, highlight rating & ulasan',
    toneStyle:'Friendly, showcase produk, marketplace-trusted tone',
    hook:'Rating 4.9 bukan hoaks, ini buktinya:',
    cta:'Order sekarang di Shopee, promo hari ini aja!',
    durationHint:45,
  },
  {
    id:'facebook-ads', label:'Facebook Ads', icon:'📘', platform:'Facebook',
    desc:'Video ad format Facebook, hook 2 detik, problem-solution',
    toneStyle:'Relatable, problem-aware, clear benefit focus',
    hook:'Masih struggle dengan [masalah]? Coba ini:',
    cta:'Klik Pelajari Selengkapnya untuk info lebih lanjut',
    durationHint:60,
  },
  {
    id:'instagram-reels', label:'Instagram Reels', icon:'📸', platform:'Instagram', badge:'Trending',
    desc:'Reels aesthetic, music-driven, visual-first approach',
    toneStyle:'Aesthetic, aspirational, lifestyle-focused',
    hook:'This changed my routine... ✨',
    cta:'Save ini kalau mau coba! Link di bio 💛',
    durationHint:30,
  },
  {
    id:'product-review', label:'Product Review', icon:'⭐', platform:'Semua',
    desc:'Review komprehensif, pros cons, genuine honest opinion',
    toneStyle:'Honest, detailed, balanced pros/cons',
    hook:'Udah 2 minggu pakai ini, ini jujurnya:',
    cta:'Worth it banget buat dicoba!',
    durationHint:60,
  },
  {
    id:'testimonial', label:'Testimonial', icon:'💬', platform:'Semua',
    desc:'Cerita personal pengalaman pakai, emotional storytelling',
    toneStyle:'Personal, emotional, authentic storytelling',
    hook:'Jujur, awalnya saya juga ragu...',
    cta:'Kalau kamu juga struggling, wajib coba ini',
    durationHint:45,
  },
  {
    id:'soft-selling', label:'Soft Selling', icon:'🌿', platform:'Semua',
    desc:'Edukasi dulu, jual kemudian. Nilai & manfaat diutamakan',
    toneStyle:'Educational, value-first, gentle persuasion',
    hook:'Tau nggak sih kalau...',
    cta:'Kalau mau tau lebih lanjut, cek profil ya',
    durationHint:60,
  },
  {
    id:'hard-selling', label:'Hard Selling', icon:'⚡', platform:'FB/TikTok',
    desc:'Direct offer, urgency tinggi, promo & scarcity',
    toneStyle:'Urgent, direct, strong offer, limited time',
    hook:'HARI INI AJA! Harga spesial yang nggak bakal balik:',
    cta:'ORDER SEKARANG sebelum habis! Link di bio!',
    durationHint:30,
  },
  {
    id:'storytelling', label:'Storytelling', icon:'📖', platform:'Semua',
    desc:'Narasi masalah → perjalanan → transformasi → produk',
    toneStyle:'Narrative, emotional journey, before-after arc',
    hook:'6 bulan lalu, hidup saya beda banget...',
    cta:'Kamu bisa berubah juga. Mulai dari sini.',
    durationHint:90,
  },
  {
    id:'problem-solution', label:'Problem Solution', icon:'💡', platform:'TikTok/FB', badge:'High CVR',
    desc:'Identifikasi pain point lalu tawarkan solusi spesifik',
    toneStyle:'Empathetic, problem-aware, clear solution delivery',
    hook:'Kalau kamu juga ngerasain ini, dengerin dulu:',
    cta:'Produk ini literally ngubah cara saya [aktivitas]. Cek di bio!',
    durationHint:45,
  },
  {
    id:'affiliate-marketing', label:'Affiliate Marketing', icon:'🔗', platform:'TikTok/IG',
    desc:'Personal branding affiliate, code diskon, honest review',
    toneStyle:'Personal branding, code-push, genuine recommendation',
    hook:'Finally nemuin produk yang worth every penny:',
    cta:'Pakai kode [NAMA] dapat diskon ekstra! Link di bio 💛',
    durationHint:45,
  },
]

// ══ Duration ═══════════════════════════════════════════════════
export const DURATION_OPTIONS: { value: DurationSec; label: string; desc: string; icon: string }[] = [
  { value:15,  label:'15 detik', desc:'Quick hook, 1 benefit, hard CTA', icon:'⚡' },
  { value:30,  label:'30 detik', desc:'Hook + benefit + CTA, optimal TikTok', icon:'🎯' },
  { value:45,  label:'45 detik', desc:'Storytelling ringkas, problem-solution', icon:'📖' },
  { value:60,  label:'60 detik', desc:'Review lengkap, pros & cons, demo', icon:'🎬' },
  { value:90,  label:'90 detik', desc:'Deep storytelling, full product journey', icon:'🌟' },
]

// ══ Resolution options ═════════════════════════════════════════
export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { id:'vertical',    label:'Vertical Social',  ratio:'9:16', size:'1080×1920', desc:'TikTok, Reels, Shorts',  icon:'📱' },
  { id:'square',      label:'Square Feed',      ratio:'1:1',  size:'1080×1080', desc:'Instagram Feed, FB',     icon:'⬜' },
  { id:'landscape',   label:'Landscape',        ratio:'16:9', size:'1920×1080', desc:'YouTube, Website',       icon:'🖥️' },
  { id:'marketplace', label:'Marketplace',      ratio:'9:16', size:'720×1280',  desc:'Shopee, Tokopedia',      icon:'🛍️' },
]

// ══ Subtitle styles ═════════════════════════════════════════════
export const SUBTITLE_STYLES: { id: SubtitleStyle; label: string; preview: string }[] = [
  { id:'tiktok',  label:'TikTok Style',  preview:'Bold, background box, animasi pop' },
  { id:'reels',   label:'Reels Style',   preview:'Italic, gradient, smooth fade' },
  { id:'minimal', label:'Minimal',       preview:'White text, subtle shadow' },
  { id:'modern',  label:'Modern',        preview:'Outlined, color-accent highlight' },
  { id:'none',    label:'Tanpa Subtitle',preview:'No subtitle overlay' },
]

// ══ CTA Overlays ════════════════════════════════════════════════
export const CTA_OVERLAYS: { id: CtaOverlay; label: string; icon: string }[] = [
  { id:'shop-now',     label:'Shop Now',      icon:'🛍️' },
  { id:'buy-now',      label:'Buy Now',       icon:'⚡' },
  { id:'order-today',  label:'Order Today',   icon:'📦' },
  { id:'learn-more',   label:'Learn More',    icon:'ℹ️' },
  { id:'whatsapp-now', label:'WhatsApp Now',  icon:'💬' },
  { id:'none',         label:'Tanpa CTA',     icon:'✕' },
]

// ══ Music categories ════════════════════════════════════════════
export const MUSIC_CATEGORIES: { id: MusicCategory; label: string; icon: string; desc: string }[] = [
  { id:'trending',   label:'Trending',   icon:'🔥', desc:'Sound viral TikTok & IG saat ini' },
  { id:'corporate',  label:'Corporate',  icon:'💼', desc:'Professional, trustworthy vibes' },
  { id:'lifestyle',  label:'Lifestyle',  icon:'🌿', desc:'Chill, aesthetic, everyday' },
  { id:'fashion',    label:'Fashion',    icon:'👗', desc:'Trendy, stylish, runway energy' },
  { id:'beauty',     label:'Beauty',     icon:'💄', desc:'Soft, feminine, glam vibes' },
  { id:'technology', label:'Technology', icon:'🤖', desc:'Tech-forward, modern, dynamic' },
  { id:'none',       label:'Tanpa Musik',icon:'🔇', desc:'Voice only, no background music' },
]

// ══ PROMPT ENGINE — Product categories ═════════════════════════
export const PRODUCT_CATEGORIES: { id: ProductCategoryId; label: string; icon: string }[] = [
  { id:'beauty',        label:'Beauty',       icon:'💄' },
  { id:'skincare',      label:'Skincare',     icon:'🧴' },
  { id:'fashion',       label:'Fashion',      icon:'👗' },
  { id:'hijab',         label:'Hijab',        icon:'🧕' },
  { id:'gadget',        label:'Gadget',       icon:'📱' },
  { id:'electronics',   label:'Electronics',  icon:'⚡' },
  { id:'food',          label:'Food',         icon:'🍜' },
  { id:'beverage',      label:'Beverage',     icon:'☕' },
  { id:'herbal',        label:'Herbal',       icon:'🌿' },
  { id:'furniture',     label:'Furniture',    icon:'🪑' },
  { id:'home-living',   label:'Home Living',  icon:'🏡' },
  { id:'pet-products',  label:'Pet Products', icon:'🐾' },
  { id:'baby-products', label:'Baby Products',icon:'👶' },
  { id:'automotive',    label:'Automotive',   icon:'🚗' },
]

// ══ PROMPT ENGINE — Script templates ═══════════════════════════
export const SCRIPT_TEMPLATES: Record<ProductCategoryId, Record<string, string>> = {
  beauty: {
    hook_id:  'Jujur, selama ini saya selalu pake {productName}, dan ini hasilnya...',
    hook_en:  'Okay so I need to talk about {productName} because wow...',
    benefit:  'Kulit lebih glowing, pori tersamarkan, dan yang penting cocok buat semua jenis kulit!',
    cta_id:   'Mau kulit kamu juga kayak gini? Link di bio! 💄',
  },
  skincare: {
    hook_id:  'Dari kulit kusam ke glowing dalam {duration}? Beneran? Coba {productName}.',
    hook_en:  'My skin transformation using {productName} — no filter, no editing.',
    benefit:  'Formula ringan, cepat meresap, dan hasilnya keliatan dalam 7 hari pertama.',
    cta_id:   'Skincare routine kamu belum lengkap tanpa ini. Order sekarang! 🌟',
  },
  fashion: {
    hook_id:  'OOTD goals? Ini dia {productName} yang bikin penampilan naik level!',
    hook_en:  'This {productName} is giving everything. Let me show you why.',
    benefit:  'Material premium, jahitan rapi, dan fit yang flattering untuk semua bentuk tubuh.',
    cta_id:   'Jangan sampe sold out lagi! Grab yours sekarang 👗',
  },
  hijab: {
    hook_id:  'Baju muslim yang syar\'i tapi tetep stylish? Ini jawabannya: {productName}.',
    hook_en:  'Modest, stylish, and comfortable — {productName} has it all.',
    benefit:  'Bahan adem, tidak tembus, nyaman seharian dan cocok untuk berbagai acara.',
    cta_id:   'Ready untuk tampil cantik? Klik link di bio ya! 🧕',
  },
  gadget: {
    hook_id:  'Specs dewa tapi harga bersahabat? Real talk soal {productName}:',
    hook_en:  'Honest review of {productName} after 2 weeks of daily use.',
    benefit:  'Performa smooth, baterai tahan lama, dan build quality yang premium.',
    cta_id:   'Worth every rupiah. Check link di bio untuk harga terbaik! 📱',
  },
  electronics: {
    hook_id:  'Produk elektronik yang mengubah cara kerja saya: {productName}',
    hook_en:  'This {productName} literally changed my workflow. Here is why.',
    benefit:  'Efisiensi naik, hemat waktu, dan teknologi yang mudah digunakan.',
    cta_id:   'Upgrade setup kamu sekarang! Link di bio ⚡',
  },
  food: {
    hook_id:  'Ini dia {productName} yang bikin saya ketagihan setiap hari!',
    hook_en:  'I tried {productName} and honestly I was not ready for how good it is.',
    benefit:  'Rasa autentik, bahan alami, dan praktis buat dimana aja.',
    cta_id:   'Cobain sendiri! Pesan sekarang sebelum kehabisan 🍜',
  },
  beverage: {
    hook_id:  'Morning routine saya berubah total sejak ketemu {productName}',
    hook_en:  '{productName} is now a non-negotiable part of my daily routine.',
    benefit:  'Rasa enak, manfaat nyata, dan mudah diseduh kapanpun dimanapun.',
    cta_id:   'Mau coba? Link di bio ya! ☕',
  },
  herbal: {
    hook_id:  'Udah tau belum manfaat {productName} yang satu ini?',
    hook_en:  'I switched to {productName} and the results were unexpected.',
    benefit:  'Bahan herbal alami, tanpa efek samping, dan sudah BPOM terdaftar.',
    cta_id:   'Kesehatan adalah investasi. Cek link di bio! 🌿',
  },
  furniture: {
    hook_id:  'Room makeover dengan budget terbatas? {productName} jawabannya!',
    hook_en:  'How I transformed my space with {productName} — honest review.',
    benefit:  'Desain modern, bahan kuat, dan mudah dirakit tanpa tools khusus.',
    cta_id:   'Home vibes upgrade, yuk order sekarang! 🪑',
  },
  'home-living': {
    hook_id:  'Rumah jadi lebih estetik dan fungsional dengan {productName}',
    hook_en:  'This {productName} made my home actually feel like a home.',
    benefit:  'Multifungsi, estetik, dan kualitas yang tahan lama.',
    cta_id:   'Wujudkan rumah impian kamu! Link di bio 🏡',
  },
  'pet-products': {
    hook_id:  'Si bulu kesayangan langsung suka sama {productName} ini!',
    hook_en:  'My pet approved this {productName} and I could not be happier.',
    benefit:  'Aman untuk hewan peliharaan, bahan berkualitas, dan hewan langsung suka.',
    cta_id:   'Sayangi hewan peliharaan kamu. Order sekarang! 🐾',
  },
  'baby-products': {
    hook_id:  'Sebagai mama/papa, saya sangat selektif soal {productName} untuk si kecil.',
    hook_en:  'As a parent, finding {productName} that actually works safely is everything.',
    benefit:  'Aman untuk kulit sensitif bayi, dermatologically tested, dan bebas bahan berbahaya.',
    cta_id:   'Untuk si kecil yang terbaik. Pesan sekarang! 👶',
  },
  automotive: {
    hook_id:  'Upgrade kendaraan kamu dengan {productName} yang sudah saya pakai:',
    hook_en:  'This {productName} upgrade was a game changer for my daily drive.',
    benefit:  'Performa lebih baik, pemasangan mudah, dan kualitas terjamin.',
    cta_id:   'Drive better, cek link di bio ya! 🚗',
  },
}

// ══ Prompt builder ══════════════════════════════════════════════
export function buildUgcPrompt(params: {
  contentType:    string
  character:      CharacterPreset
  videoPreset:    VideoPreset
  language:       LanguageId
  accent:         AccentId
  duration:       DurationSec
  productCategory:ProductCategoryId | null
  productName?:   string
  targetMarket?:  string
  mainBenefit?:   string
  painPoint?:     string
}): string {
  const lang = params.language === 'indonesia' ? 'bahasa Indonesia' : 'English'
  const accentMap: Record<string, string> = {
    'natural-id': 'natural conversational Indonesian',
    'formal-id':  'formal polished Indonesian',
    'casual-id':  'casual gaul Indonesian with local slang',
    'american-en':'American English, warm and energetic',
    'british-en': 'British English, polished and articulate',
  }
  const accent = accentMap[params.accent] ?? 'natural Indonesian'

  return [
    `Create a ${params.duration}-second UGC ${params.contentType} video script in ${lang}.`,
    `Speaking style: ${accent}.`,
    `Character: ${params.character.label} — ${params.character.desc}.`,
    `Video format: ${params.videoPreset.label}. Tone: ${params.videoPreset.toneStyle}.`,
    params.productName    ? `Product: ${params.productName}.`    : '',
    params.targetMarket   ? `Target audience: ${params.targetMarket}.` : '',
    params.mainBenefit    ? `Key benefit to highlight: ${params.mainBenefit}.` : '',
    params.painPoint      ? `Pain point to address: ${params.painPoint}.` : '',
    `Hook style: ${params.videoPreset.hook}`,
    `End with CTA: ${params.videoPreset.cta}`,
    `Keep it natural, authentic, NOT salesy. Match platform: ${params.videoPreset.platform}.`,
    `Structure: [HOOK 3s] → [CONTENT ${params.duration - 10}s] → [CTA 5s]`,
    `Output: Script only, no stage directions, no timestamps. Ready to read aloud.`,
  ].filter(Boolean).join(' ')
}

// ══ Video generation prompt (for AI avatar) ════════════════════
export function buildVideoGenPrompt(params: {
  character:     CharacterPreset
  script:        string
  videoPreset:   VideoPreset
  subtitleStyle: string
  ctaOverlay:    string
  musicCategory: string
  resolution:    OutputResolution
}): string {
  const resMap: Record<string, string> = {
    vertical:    '1080x1920 9:16 vertical',
    square:      '1080x1080 square',
    landscape:   '1920x1080 16:9 landscape',
    marketplace: '720x1280 marketplace format',
  }

  return [
    `Generate UGC video with AI avatar: ${params.character.label}.`,
    `Script to voice: "${params.script.substring(0, 500)}"`,
    `Style: ${params.videoPreset.toneStyle}. Platform: ${params.videoPreset.platform}.`,
    `Resolution: ${resMap[params.resolution] ?? '1080x1920'}.`,
    params.subtitleStyle !== 'none' ? `Subtitle style: ${params.subtitleStyle}.` : 'No subtitles.',
    params.ctaOverlay    !== 'none' ? `CTA overlay: "${params.ctaOverlay}".`     : 'No CTA overlay.',
    params.musicCategory !== 'none' ? `Background music category: ${params.musicCategory}.` : 'No background music.',
    'Ensure natural eye contact with camera. Clear product visibility. High quality.',
  ].filter(Boolean).join(' ')
}