// lib/studio/tiktok/presets.ts
// ══════════════════════════════════════════════════════════════
// TIKTOK REELS AI — Presets, Hooks, Script Engine, Hashtag AI
// ══════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────
export type ScriptVariantId =
  | 'soft-selling'
  | 'hard-selling'
  | 'storytelling'
  | 'ugc-review'
  | 'product-review'
  | 'comparison'
  | 'affiliate'
  | 'problem-solution'
  | 'before-after'
  | 'tutorial'
  | 'unboxing'
  | 'testimonial'

export type DurationSec  = 15 | 30 | 45 | 60 | 90
export type PlatformId   = 'tiktok' | 'reels' | 'shorts' | 'tiktok-shop' | 'shopee-video'
export type NicheId      = 'fashion' | 'beauty' | 'skincare' | 'food' | 'gadget' | 'health' | 'home' | 'baby' | 'hijab' | 'general'
export type InputMode    = 'url' | 'manual'

// ── Script variant metadata ────────────────────────────────────
export interface ScriptVariant {
  id:           ScriptVariantId
  label:        string
  icon:         string
  desc:         string
  hookStyle:    string
  structure:    string[]  // steps
  idealDuration:DurationSec
  cvr:          'low' | 'medium' | 'high'
  badge?:       string
}

export const SCRIPT_VARIANTS: ScriptVariant[] = [
  {
    id:'soft-selling', label:'Soft Selling', icon:'💫', cvr:'medium',
    desc:'Edukasi dulu, jual kemudian. Trust building, tidak terasa jualan.',
    hookStyle:'Informasi/tips yang relate dengan target market',
    structure:['Fakta menarik / Tips', 'Problem relatable', 'Edukasi solusi', 'Produk sebagai solusi alami', 'Soft CTA'],
    idealDuration:60,
  },
  {
    id:'hard-selling', label:'Hard Selling', icon:'🔥', cvr:'high', badge:'High CVR',
    desc:'Direct offer, urgency tinggi, harga & promo langsung di depan.',
    hookStyle:'Penawaran langsung + angka/harga yang menarik',
    structure:['Hook offer langsung', 'Benefit + harga', 'Urgency/scarcity', 'Testimonial singkat', 'CTA kuat'],
    idealDuration:30,
  },
  {
    id:'storytelling', label:'Storytelling', icon:'📖', cvr:'medium',
    desc:'Narasi personal yang emosional. Sebelum → sesudah → produk.',
    hookStyle:'Cerita personal yang relate dan emotional',
    structure:['Situasi awal (before)', 'Problem & emosi', 'Titik balik / discovery', 'Perubahan (after)', 'Produk & CTA'],
    idealDuration:90,
  },
  {
    id:'ugc-review', label:'UGC Review', icon:'🎭', cvr:'high', badge:'Terpopuler',
    desc:'User Generated Content authentik. Gaya organic, bukan iklan.',
    hookStyle:'Bicara casual seperti share ke teman, genuine',
    structure:['Konteks diri / siapa kamu', 'Kenapa coba produk ini', 'First impression', 'Hasil nyata', 'Rekomendasi + CTA'],
    idealDuration:45,
  },
  {
    id:'product-review', label:'Product Review', icon:'⭐', cvr:'medium',
    desc:'Review komprehensif, jujur, pros & cons, credible.',
    hookStyle:'Teaser hasil/kesimpulan di awal, detail di tengah',
    structure:['Teaser kesimpulan', 'Unboxing/first look', 'Test & detail', 'Pros & Cons jujur', 'Verdict + CTA'],
    idealDuration:60,
  },
  {
    id:'comparison', label:'Comparison', icon:'🔄', cvr:'high',
    desc:'Bandingkan produk ini vs alternatif. Positioning yang kuat.',
    hookStyle:'Pertanyaan "mana yang lebih bagus?" atau "jangan salah pilih"',
    structure:['Hook pertanyaan pilihan', 'Kompetitor A (alternatif umum)', 'Produk kita (keunggulan)', 'Perbandingan langsung', 'Rekomendasi tegas + CTA'],
    idealDuration:45,
  },
  {
    id:'affiliate', label:'Affiliate', icon:'🔗', cvr:'high', badge:'Affiliate',
    desc:'Personal branding affiliate. Kode diskon, genuine recommendation.',
    hookStyle:'Personal recommendation + kode diskon eksklusif',
    structure:['Perkenalan personal', 'Kenapa saya rekomendasikan', 'Benefit utama', 'Sosial proof', 'Kode diskon + CTA link'],
    idealDuration:45,
  },
  {
    id:'problem-solution', label:'Problem Solution', icon:'💡', cvr:'high',
    desc:'Identifikasi pain point lalu tawarkan solusi spesifik & produk.',
    hookStyle:'"Kalau kamu juga ngerasain ini..." atau "Masalah ini akhirnya ada solusinya"',
    structure:['Identifikasi problem relatable', 'Empati + perkuat pain', 'Produk sebagai solusi', 'Proof / hasil nyata', 'CTA urgency'],
    idealDuration:45,
  },
  {
    id:'before-after', label:'Before & After', icon:'✨', cvr:'high', badge:'Viral',
    desc:'Transformasi visual yang powerful. Before state vs after pakai produk.',
    hookStyle:'"Sebelum kamu tahu ini..." atau transformasi visual langsung',
    structure:['Before state (problem yang terlihat)', 'Transisi ke after', 'Reveal produk', 'Proses / cara pakai singkat', 'CTA + proof'],
    idealDuration:30,
  },
  {
    id:'tutorial', label:'Tutorial / Demo', icon:'🎯', cvr:'medium',
    desc:'Step-by-step cara pakai produk. Edukasi + konversi.',
    hookStyle:'"Cara benar pakai..." atau "Banyak yang tidak tahu cara ini..."',
    structure:['Hook — cara yang benar', 'Persiapan / bahan', 'Step 1-3 tutorial', 'Hasil akhir', 'CTA beli'],
    idealDuration:60,
  },
  {
    id:'unboxing', label:'Unboxing', icon:'📦', cvr:'medium',
    desc:'Unboxing + first impression autentik. Build excitement & trust.',
    hookStyle:'"Akhirnya datang!" atau "Ini yang semua orang tunggu"',
    structure:['Hype / anticipation', 'Unbox packaging', 'First look produk', 'Detail & kualitas', 'Kesimpulan + CTA'],
    idealDuration:60,
  },
  {
    id:'testimonial', label:'Testimonial', icon:'💬', cvr:'high',
    desc:'Cerita pengalaman nyata yang emotional dan relatable.',
    hookStyle:'"Jujur, awalnya saya juga ragu..."',
    structure:['Situasi awal & keraguan', 'Alasan coba', 'Proses penggunaan', 'Hasil yang dirasakan', 'Rekomendasi tulus + CTA'],
    idealDuration:45,
  },
]

// ── Hook templates per niche ──────────────────────────────────
export const VIRAL_HOOKS: Record<string, string[]> = {
  general: [
    'Baru tahu ternyata {produk} bisa...',
    'Jangan beli sebelum tahu ini tentang {produk}',
    'Produk ini lagi dicari banyak orang, ini alasannya',
    'Awalnya saya kira biasa aja, tapi ternyata...',
    'Kenapa banyak orang menyesal baru tahu {produk} ini?',
    'Saya coba {produk} viral ini selama 7 hari. Hasilnya?',
    'Kalau budget kamu di bawah {harga}, wajib lihat ini',
    'POV: Kamu akhirnya nemuin {produk} yang beneran works',
    'Rating {rating} bintang bukan hoaks, ini buktinya',
    'Ini bukan iklan. Saya beneran suka banget sama {produk}',
  ],
  fashion: [
    'OOTD goals dengan {produk} di bawah {harga}?',
    'Outfit ini auto dapat banyak pujian karena {produk}',
    'Brand lokal tapi kualitasnya gak kalah sama import',
    'Kalau kamu suka style {style}, wajib cek {produk}',
    'Fashion haul yang bikin dompet aman tapi tetap stylish',
  ],
  beauty: [
    'Kulit glowing dalam {days} hari? Saya sudah buktikan',
    'Skincare routine yang mengubah kulit saya 100%',
    '{produk} ini literally game changer untuk kulit {jenis}',
    'Kenapa saya hapus semua skincare lama setelah ketemu {produk}',
    'Beauty secret yang akhirnya saya share: {produk}',
  ],
  skincare: [
    'Dari kulit {masalah} ke glowing dalam {days} hari',
    'Dermatologis juga rekomendasikan {produk} untuk {masalah}',
    'Formula {bahan} ini beneran work untuk kulit orang Asia',
    'Saya sudah buang {jumlah} produk mahal sebelum nemuin ini',
    '{produk} = satu produk, {jumlah} manfaat. Worth it banget',
  ],
  food: [
    '{produk} ini bikin ketagihan, wajib coba!',
    'Rasa autentik yang langsung bikin kangen kampung',
    'Cemilan sehat tapi rasanya gak bohong',
    'Snack viral ini akhirnya saya coba, dan wow...',
    'Bahan alami + rasa premium = {produk}',
  ],
  gadget: [
    'Specs dewa tapi harga {harga}? Real talk tentang {produk}',
    'Review jujur {produk} setelah {days} hari pemakaian',
    '{produk} vs {kompetitor}: mana yang lebih worth it?',
    'Setup impian akhirnya terwujud dengan {produk}',
    'Kenapa {produk} jadi daily driver saya sekarang',
  ],
  health: [
    'Kesehatan adalah investasi. {produk} adalah buktinya',
    'Dokter juga rekomendasikan {produk} untuk {masalah}',
    'Dari {masalah} ke sehat dalam {days} hari',
    'Natural, aman, dan beneran work: {produk}',
    'Herbal solution yang sudah saya pakai selama {period}',
  ],
  home: [
    'Room makeover di bawah {harga} dengan {produk}!',
    'Rumah jadi 10x lebih aesthetic dengan {produk}',
    'Home decor yang bikin tamu selalu nanya beli dimana',
    'Aesthetic + fungsional = {produk} yang wajib dimiliki',
    'Upgrade rumah tanpa renovasi: {produk} jawabannya',
  ],
  baby: [
    'Sebagai ortu, ini yang paling penting: {produk} aman untuk si kecil',
    'Baby-approved! Si kecil langsung suka sama {produk}',
    'Dermatologically tested untuk kulit sensitif bayi',
    'Parenting jadi lebih mudah dengan {produk}',
    'Mommy-recommended: {produk} yang sudah saya buktikan',
  ],
  hijab: [
    'Modest fashion goals? {produk} jawabannya!',
    'Syar\'i, stylish, dan nyaman seharian: {produk}',
    'Hijab OOTD yang auto dapat compliment',
    'Bahan adem + tidak tembus = {produk} yang wajib dicoba',
    'Tampil anggun maksimal dengan {produk}',
  ],
}

// ── Scene visual sequence ────────────────────────────────────
export const VISUAL_SEQUENCES: Record<ScriptVariantId, string[]> = {
  'soft-selling':    ['Opening relatable/tips overlay', 'Problem visual + text', 'Solusi & edukasi footage', 'Produk introduction', 'Hasil + testimonial', 'CTA overlay'],
  'hard-selling':    ['Hook text + harga besar', 'Produk close-up', 'Benefit list fast-cut', 'Urgency countdown/sticker', 'CTA button overlay'],
  'storytelling':    ['Situasi before — emosional', 'Problem montage', 'Discovery moment', 'Transformation footage', 'After reveal + produk', 'CTA emosional'],
  'ugc-review':      ['Selfie casual intro', 'Produk unboxing', 'Real usage footage', 'Result close-up', 'Reaction shot', 'CTA kasual'],
  'product-review':  ['Teaser hasil di awal', 'Unboxing packaging', 'Detail produk', 'Demo/test footage', 'Pros cons text', 'Verdict + CTA'],
  'comparison':      ['Hook visual pilihan A vs B', 'Product A footage', 'Product B (ours) footage', 'Side-by-side comparison', 'Winner reveal', 'CTA'],
  'affiliate':       ['Personal intro selfie', 'Why I use this', 'Product usage', 'Results close-up', 'Code reveal overlay', 'Swipe up CTA'],
  'problem-solution':['Problem intro (relatable)', 'Pain amplification', 'Transition to solution', 'Product demo', 'Result proof', 'Urgency CTA'],
  'before-after':    ['Before footage/photo', 'Suspense transition', 'After reveal', 'Product close-up', 'Usage quick tip', 'CTA overlay'],
  'tutorial':        ['Hook + end result tease', 'Ingredients/prep', 'Step 1 footage', 'Step 2-3 fast-cut', 'Final result', 'Buy link CTA'],
  'unboxing':        ['Packaging arrival', 'Unbox reveal', 'First look all items', 'Detail close-ups', 'Quick usage test', 'Verdict + CTA'],
  'testimonial':     ['Intro + keraguan awal', 'Decision to try', 'Usage experience', 'Result reveal', 'Emotional ending', 'CTA recommendation'],
}

// ── Platform config ───────────────────────────────────────────
export interface PlatformConfig {
  id:     PlatformId
  label:  string
  icon:   string
  ratio:  string
  size:   string
  maxDur: number
  desc:   string
  hashtagLimit: number
}

export const PLATFORMS: PlatformConfig[] = [
  { id:'tiktok',       label:'TikTok',         icon:'🎵', ratio:'9:16', size:'1080×1920', maxDur:180, desc:'FYP + For You Page viral', hashtagLimit:10 },
  { id:'reels',        label:'Instagram Reels', icon:'📸', ratio:'9:16', size:'1080×1920', maxDur:90,  desc:'IG Explore + Reels Feed',  hashtagLimit:30 },
  { id:'shorts',       label:'YouTube Shorts',  icon:'▶️', ratio:'9:16', size:'1080×1920', maxDur:60,  desc:'YouTube Shorts discovery', hashtagLimit:15 },
  { id:'tiktok-shop',  label:'TikTok Shop',     icon:'🛒', ratio:'9:16', size:'1080×1920', maxDur:60,  desc:'Product video + shoppable',hashtagLimit:10 },
  { id:'shopee-video', label:'Shopee Video',    icon:'🛍️', ratio:'9:16', size:'720×1280',  maxDur:60,  desc:'Native Shopee marketplace', hashtagLimit:5 },
]

// ── Duration options ──────────────────────────────────────────
export const DURATION_OPTIONS = [
  { value:15  as DurationSec, label:'15 detik', icon:'⚡', desc:'Hook-only. Ultra viral, 1 benefit.' },
  { value:30  as DurationSec, label:'30 detik', icon:'🎯', desc:'Hook + benefit + CTA. TikTok optimal.' },
  { value:45  as DurationSec, label:'45 detik', icon:'🎬', desc:'Full UGC format. Platform-recommended.' },
  { value:60  as DurationSec, label:'60 detik', icon:'📖', desc:'Review lengkap. IG & YouTube Shorts.' },
  { value:90  as DurationSec, label:'90 detik', icon:'🌟', desc:'Deep storytelling. Emotional arc.' },
]

// ── Hashtag database per niche ────────────────────────────────
export const HASHTAG_DB: Record<NicheId, { trending: string[]; niche: string[]; general: string[] }> = {
  fashion: {
    trending: ['#OOTD','#FashionTikTok','#StyleInspo','#OutfitIdeas','#FashionHaul'],
    niche:    ['#BajuKece','#FashionLokal','#StyleIndonesia','#OOTDIndonesia','#FashionWanita'],
    general:  ['#TikTokFashion','#Lookbook','#FashionBlogger','#Trendy','#StyleTips'],
  },
  beauty: {
    trending: ['#BeautyTikTok','#MakeupTutorial','#GlowUp','#BeautyHacks','#MakeupLovers'],
    niche:    ['#BeautyLokal','#MakeupIndonesia','#CantikAlami','#Skincare','#BeautyRoutine'],
    general:  ['#MakeupTips','#BeautyInfluencer','#GRWM','#NoFilter','#NaturalBeauty'],
  },
  skincare: {
    trending: ['#SkincareRoutine','#GlowingSkin','#SkincareObsessed','#SkincareTips','#ClearSkin'],
    niche:    ['#SkincareLokal','#KuliSehat','#GlowingAlami','#SkincareIndonesia','#HydrationSkincare'],
    general:  ['#Moisturizer','#Sunscreen','#Serum','#SkincareAddict','#HealthySkin'],
  },
  food: {
    trending: ['#FoodTikTok','#FoodLovers','#Kuliner','#MakanEnak','#FoodReview'],
    niche:    ['#MakananLokal','#KulinerIndonesia','#SnackViralll','#JajananEnak','#HomeMade'],
    general:  ['#FoodPhotography','#Foodie','#Delicious','#MustTry','#FoodRecommendation'],
  },
  gadget: {
    trending: ['#TechTikTok','#GadgetLovers','#TechReview','#NewGadget','#TechUnboxing'],
    niche:    ['#GadgetIndonesia','#ReviewJujur','#TechLokal','#GadgetMurah','#WorthIt'],
    general:  ['#Technology','#Innovation','#TechNews','#Unboxing','#ReviewProduct'],
  },
  health: {
    trending: ['#HealthTips','#Wellness','#HealthyLifestyle','#Herbal','#NaturalHealth'],
    niche:    ['#HerbalIndonesia','#JamuLokal','#KesehatanAlami','#HidupSehat','#SuplemenAlami'],
    general:  ['#HealthyLiving','#NaturalRemedy','#WellnessJourney','#TipsKesehatan','#Supplement'],
  },
  home: {
    trending: ['#HomeDecor','#InteriorDesign','#HomeTour','#RoomMakeover','#HouseGoals'],
    niche:    ['#DekorasiRumah','#RumahMinimalis','#HomeIndonesia','#InteriorLokal','#HomeInspo'],
    general:  ['#HomeDesign','#CozyHome','#HomeStyling','#DIYDecor','#LivingRoom'],
  },
  baby: {
    trending: ['#BabyTikTok','#ParentingTips','#BabyProducts','#NewMom','#BabyReview'],
    niche:    ['#MomIndonesia','#BayiIndonesia','#ProdukBayi','#ParentingIndonesia','#MomLife'],
    general:  ['#Parenting','#BabyShop','#Mompreneur','#BabyCare','#NewParent'],
  },
  hijab: {
    trending: ['#HijabStyle','#HijabFashion','#OOTDHijab','#ModestFashion','#HijabLook'],
    niche:    ['#HijabIndonesia','#HijabLokal','#BusanaMuslim','#GamisKece','#HijabOOTD'],
    general:  ['#Muslimah','#HijabInfluencer','#ModestWear','#HijabTrend','#IslamicFashion'],
  },
  general: {
    trending: ['#TikTokViral','#FYP','#ForYouPage','#Trending','#Viral'],
    niche:    ['#ProdukLokal','#BuatanIndonesia','#ReviewJujur','#Recommended','#MustBuy'],
    general:  ['#Seller','#ShopNow','#OnlineShop','#BelanjaMurah','#TikTokShop'],
  },
}

// ── Prompt builder for script generation ─────────────────────
export interface BuildScriptPromptInput {
  variantId:      ScriptVariantId
  platform:       PlatformId
  duration:       DurationSec
  productName:    string
  productPrice:   string
  targetMarket:   string
  mainBenefit:    string
  painPoint:      string
  socialProof:    string
  niche:          NicheId
  language:       'indonesia' | 'english'
  tone:           string
  affiliateCode?: string
}

export function buildScriptPrompt(input: BuildScriptPromptInput): string {
  const variant  = SCRIPT_VARIANTS.find(v => v.id === input.variantId)!
  const platform = PLATFORMS.find(p => p.id === input.platform)!

  return [
    `You are an expert TikTok/Reels viral content creator and copywriter for Indonesian e-commerce.`,
    `Create a ${input.duration}-second ${variant.label} video script for ${platform.label} (${platform.ratio} format).`,
    `Language: ${input.language === 'indonesia' ? 'bahasa Indonesia natural, conversational' : 'English'}.`,
    `Tone: ${input.tone}.`,
    `\nPRODUCT INFO:`,
    `- Name: ${input.productName}`,
    `- Price: ${input.productPrice || 'competitively priced'}`,
    `- Main benefit: ${input.mainBenefit}`,
    `- Pain point solved: ${input.painPoint}`,
    `- Target market: ${input.targetMarket}`,
    input.socialProof ? `- Social proof: ${input.socialProof}` : '',
    input.affiliateCode ? `- Affiliate code: ${input.affiliateCode} (include in CTA)` : '',
    `\nSCRIPT STRUCTURE (${variant.label}):`,
    variant.structure.map((s, i) => `${i+1}. ${s}`).join('\n'),
    `\nHOOK STYLE: ${variant.hookStyle}`,
    `\nOUTPUT FORMAT — Return ONLY these 5 sections, no extra text:`,
    `[HOOK] (first 3 seconds — must stop the scroll)`,
    `[SCRIPT] (full ${input.duration}s spoken script, natural conversational, no stage directions)`,
    `[CAPTION] (${platform.label} caption with emojis, max 150 chars)`,
    `[CTA] (specific call-to-action for ${platform.label})`,
    `[VISUAL_NOTES] (3-5 bullet points: what to show on screen each section)`,
    `\nRules: Sound like a REAL person, NOT an advertisement. Natural, engaging, conversion-focused.`,
    platform.id === 'tiktok-shop' ? 'Include shopping link/cart mention naturally in CTA.' : '',
  ].filter(Boolean).join('\n')
}

// ── A/B Hook generator ────────────────────────────────────────
export function buildHookVariants(productName: string, niche: NicheId, price: string): string[] {
  const hooks = VIRAL_HOOKS[niche] ?? VIRAL_HOOKS.general
  return hooks.slice(0, 6).map(h =>
    h.replace(/\{produk\}/g, productName)
     .replace(/\{harga\}/g, price)
     .replace(/\{days\}/g, String(Math.floor(Math.random() * 14) + 7))
     .replace(/\{rating\}/g, '4.9')
     .replace(/\{period\}/g, '6 bulan')
     .replace(/\{jumlah\}/g, '5')
     .replace(/\{masalah\}/g, 'bermasalah')
     .replace(/\{style\}/g, 'streetwear')
     .replace(/\{bahan\}/g, 'niacinamide')
     .replace(/\{kompetitor\}/g, 'produk mahal lainnya')
     .replace(/\{jenis\}/g, 'normal-oily')
  )
}

// ── Generate hashtags ─────────────────────────────────────────
export function buildHashtags(niche: NicheId, platform: PlatformId, productName: string): {
  trending: string[]; niche: string[]; general: string[]; product: string[]
} {
  const db  = HASHTAG_DB[niche] ?? HASHTAG_DB.general
  const platCfg = PLATFORMS.find(p => p.id === platform)!
  const productHash = productName.split(' ').slice(0,2).map(w => `#${w.replace(/[^a-zA-Z0-9]/g,'')}`).filter(h => h.length > 2)

  return {
    trending: db.trending.slice(0, 5),
    niche:    db.niche.slice(0, 5),
    general:  db.general.slice(0, 5),
    product:  [...productHash, '#TikTokShop', '#Shopee'],
  }
}

// ── URL parser for product info extraction ────────────────────
export function extractPlatformFromUrl(url: string): 'shopee' | 'tiktok-shop' | 'tokopedia' | 'unknown' {
  if (url.includes('shopee.co.id') || url.includes('shp.ee')) return 'shopee'
  if (url.includes('tiktok.com') || url.includes('shop.tiktok')) return 'tiktok-shop'
  if (url.includes('tokopedia.com')) return 'tokopedia'
  return 'unknown'
}