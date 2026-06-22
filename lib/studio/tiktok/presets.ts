// lib/studio/tiktok/presets.ts
// ══════════════════════════════════════════════════════════════
// BEESELL AI — TIKTOK REELS PRESETS (single source of truth)
// ──────────────────────────────────────────────────────────────
// Berisi:
//   • 12 jenis script (SCRIPT_VARIANTS) + struktur framework
//   • Platform (TikTok / Reels / Shorts) + limit hashtag + flag API
//   • Opsi durasi (DURATION_OPTIONS)
//   • Visual sequence / shot list per jenis script (VISUAL_SEQUENCES)
//   • Preset integrasi TikTok API:
//       - TIKTOK_POST_PRESETS  (privacy + commercial disclosure)
//       - TIKTOK_TRENDING_SOUND_TYPES (kategori sound)
//       - HASHTAG_STRATEGY (formula mix hashtag)
//       - buildTikTokPostPayload() → payload siap Content Posting API
// ══════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────
export type ScriptVariantId =
  | 'ugc-review'
  | 'pas'
  | 'storytelling'
  | 'unboxing'
  | 'tutorial'
  | 'before-after'
  | 'affiliate'
  | 'live-promo'
  | 'comparison'
  | 'trending-sound'
  | 'flash-sale'
  | 'educational'

export type PlatformId = 'tiktok' | 'reels' | 'shorts'

export type NicheId =
  | 'general'
  | 'fashion'
  | 'beauty'
  | 'skincare'
  | 'food'
  | 'gadget'
  | 'health'
  | 'home'
  | 'baby'
  | 'hijab'

export type DurationSec = 15 | 30 | 45 | 60
export type CvrLevel = 'low' | 'medium' | 'high'

// ══════════════════════════════════════════════════════════════
// SCRIPT VARIANTS — 12 jenis
// ══════════════════════════════════════════════════════════════
export interface ScriptVariant {
  id: ScriptVariantId
  label: string
  icon: string
  badge?: string
  desc: string
  framework: string        // AIDA / PAS / BAB / Direct Response, dll
  structure: string[]      // urutan beat script
  idealDuration: DurationSec
  cvr: CvrLevel            // perkiraan kekuatan konversi
  bestFor: NicheId[]       // niche paling cocok (panduan)
}

export const SCRIPT_VARIANTS: ScriptVariant[] = [
  {
    id: 'ugc-review',
    label: 'UGC Review',
    icon: '🗣️',
    badge: 'TOP',
    desc: 'Review jujur ala user — paling natural & dipercaya untuk affiliate',
    framework: 'Story Selling + Social Proof',
    structure: [
      'Hook: reaksi jujur / keluhan relatable di 3 detik pertama',
      'Konteks: kenapa akhirnya coba produk ini',
      'Demo: tunjukkan produk dipakai langsung',
      'Hasil: before vs after / reaksi spontan',
      'CTA: ajak beli + arahkan ke keranjang kuning',
    ],
    idealDuration: 30,
    cvr: 'high',
    bestFor: ['skincare', 'beauty', 'food', 'general'],
  },
  {
    id: 'pas',
    label: 'Problem-Solution',
    icon: '🎯',
    desc: 'Angkat masalah, perbesar, lalu tawarkan produk sebagai solusi',
    framework: 'PAS (Problem-Agitate-Solution)',
    structure: [
      'Problem: angkat masalah yang relatable',
      'Agitate: perbesar rasa frustrasi & dampaknya',
      'Solution: kenalkan produk sebagai jawaban',
      'Proof: bukti / testimoni singkat',
      'CTA: solusi sekarang juga sebelum nyesel',
    ],
    idealDuration: 30,
    cvr: 'high',
    bestFor: ['health', 'skincare', 'home', 'gadget'],
  },
  {
    id: 'storytelling',
    label: 'Story Selling',
    icon: '📖',
    desc: 'Cerita transformasi personal yang bikin nonton sampai habis',
    framework: 'Before-After-Bridge',
    structure: [
      'Hook: mulai cerita "Dulu aku..."',
      'Konflik: titik terendah / masalah',
      'Penemuan: momen ketemu produk',
      'Transformasi: hidup / hasil berubah',
      'CTA: ajak penonton ikut transformasi',
    ],
    idealDuration: 45,
    cvr: 'medium',
    bestFor: ['health', 'beauty', 'general', 'baby'],
  },
  {
    id: 'unboxing',
    label: 'Unboxing',
    icon: '📦',
    desc: 'Buka paket + first impression — memicu rasa ingin punya',
    framework: 'AIDA',
    structure: [
      'Hook: "Paket baru dateng nih!"',
      'Buka kemasan: tunjukkan detail packaging',
      'First impression: pegang & rasakan tekstur',
      'Demo cepat: tes fungsi utama',
      'CTA: link keranjang + diskon',
    ],
    idealDuration: 30,
    cvr: 'medium',
    bestFor: ['gadget', 'fashion', 'beauty', 'home'],
  },
  {
    id: 'tutorial',
    label: 'Tutorial / How-to',
    icon: '🛠️',
    desc: 'Ajarkan sesuatu, sisipkan produk sebagai tools wajib',
    framework: 'Educational + Direct Response',
    structure: [
      'Hook: "Cara [hasil] dalam [waktu]"',
      'Step 1: langkah pertama jelas',
      'Step 2: langkah dengan produk',
      'Hasil akhir: tunjukkan output',
      'CTA: produk yang dipakai ada di keranjang',
    ],
    idealDuration: 45,
    cvr: 'high',
    bestFor: ['beauty', 'food', 'skincare', 'general'],
  },
  {
    id: 'before-after',
    label: 'Before-After',
    icon: '✨',
    badge: 'VIRAL',
    desc: 'Transformasi visual nyata — bukti hasil yang sulit ditolak',
    framework: 'Before-After-Bridge',
    structure: [
      'Before: kondisi awal (pain point) tanpa sensor',
      'Proses: pemakaian produk dipercepat',
      'After: hasil nyata side-by-side',
      'Timeline: berapa lama hasilnya muncul',
      'CTA: "Mau hasil sama? Beli di sini"',
    ],
    idealDuration: 30,
    cvr: 'high',
    bestFor: ['skincare', 'beauty', 'health', 'home'],
  },
  {
    id: 'affiliate',
    label: 'Affiliate Push',
    icon: '💰',
    badge: 'KODE',
    desc: 'Hard-sell affiliate dengan kode promo & urgensi maksimal',
    framework: 'Direct Response Marketing',
    structure: [
      'Hook: penawaran / diskon besar di depan',
      'Highlight: benefit utama paling kuat',
      'Social proof: rating + jumlah terjual',
      'Urgency: stok / promo terbatas',
      'CTA: pakai kode affiliate + keranjang kuning',
    ],
    idealDuration: 30,
    cvr: 'high',
    bestFor: ['general', 'gadget', 'fashion', 'food'],
  },
  {
    id: 'live-promo',
    label: 'Live Promo',
    icon: '🔴',
    desc: 'Teaser untuk narik penonton ke sesi LIVE selling',
    framework: 'AIDA + Urgency',
    structure: [
      'Hook: "LIVE malam ini jam [x]!"',
      'Bocoran: produk + harga spesial live',
      'Benefit eksklusif: bonus khusus penonton live',
      'Urgency: flash sale jumlah terbatas',
      'CTA: follow + nyalakan reminder LIVE',
    ],
    idealDuration: 15,
    cvr: 'medium',
    bestFor: ['fashion', 'beauty', 'general', 'hijab'],
  },
  {
    id: 'comparison',
    label: 'Comparison / Versus',
    icon: '⚖️',
    desc: 'Bandingkan dengan alternatif lain, posisikan produk sebagai pemenang',
    framework: 'PAS + Direct Response',
    structure: [
      'Hook: "Mahal vs Murah? Cek dulu"',
      'Produk A (kompetitor): tunjukkan kekurangan',
      'Produk B (kita): tunjukkan kelebihan',
      'Verdict: pemenang jelas + alasan',
      'CTA: pilih yang worth it, link di bawah',
    ],
    idealDuration: 45,
    cvr: 'medium',
    bestFor: ['gadget', 'home', 'skincare', 'general'],
  },
  {
    id: 'trending-sound',
    label: 'Trending Sound',
    icon: '🎵',
    badge: 'FYP',
    desc: 'Format pendek nempel sound viral — engineered buat masuk FYP',
    framework: '4U (Useful, Urgent, Unique, Ultra-specific)',
    structure: [
      'Hook visual sinkron dengan beat sound',
      'Transisi cepat ke produk (cut on beat)',
      'Punchline / twist tak terduga',
      'Show benefit produk singkat',
      'CTA singkat + perkuat di caption',
    ],
    idealDuration: 15,
    cvr: 'medium',
    bestFor: ['fashion', 'beauty', 'food', 'general'],
  },
  {
    id: 'flash-sale',
    label: 'Flash Sale',
    icon: '⚡',
    badge: 'URGENSI',
    desc: 'Dorong checkout instan dengan diskon & countdown',
    framework: 'Direct Response + Scarcity',
    structure: [
      'Hook: "Cuma hari ini!"',
      'Harga coret → harga promo (visual jelas)',
      'Benefit + bonus tambahan',
      'Countdown / stok menipis',
      'CTA: checkout sekarang sebelum kehabisan',
    ],
    idealDuration: 15,
    cvr: 'high',
    bestFor: ['general', 'fashion', 'gadget', 'food'],
  },
  {
    id: 'educational',
    label: 'Edukasi / Tips',
    icon: '🧠',
    desc: 'Konten value "X kesalahan / X tips" — bangun trust sambil jualan',
    framework: 'Educational + Soft Selling',
    structure: [
      'Hook: "3 kesalahan saat [topik]"',
      'Tip 1: insight cepat',
      'Tip 2: selipkan produk sebagai solusi',
      'Tip 3: penutup value',
      'CTA: pakai produk yang tepat, cek keranjang',
    ],
    idealDuration: 45,
    cvr: 'medium',
    bestFor: ['skincare', 'health', 'baby', 'home'],
  },
]

// ══════════════════════════════════════════════════════════════
// PLATFORMS
// ══════════════════════════════════════════════════════════════
export interface Platform {
  id: PlatformId
  label: string
  icon: string
  hashtagLimit: number
  captionLimit: number
  apiSupported: boolean       // ada API publish resmi?
  apiNote: string
}

export const PLATFORMS: Platform[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    hashtagLimit: 8,
    captionLimit: 2200,
    apiSupported: true,
    apiNote: 'TikTok Content Posting API (perlu TikTok for Developers + OAuth)',
  },
  {
    id: 'reels',
    label: 'Reels',
    icon: '📸',
    hashtagLimit: 15,
    captionLimit: 2200,
    apiSupported: true,
    apiNote: 'Instagram Graph API (perlu akun Business/Creator)',
  },
  {
    id: 'shorts',
    label: 'Shorts',
    icon: '▶️',
    hashtagLimit: 12,
    captionLimit: 1500,
    apiSupported: true,
    apiNote: 'YouTube Data API v3 (upload + shorts)',
  },
]

// ══════════════════════════════════════════════════════════════
// DURATION
// ══════════════════════════════════════════════════════════════
export interface DurationOption {
  value: DurationSec
  label: string
  icon: string
}

export const DURATION_OPTIONS: DurationOption[] = [
  { value: 15, label: '15 detik', icon: '⚡' },
  { value: 30, label: '30 detik', icon: '🎯' },
  { value: 45, label: '45 detik', icon: '📖' },
  { value: 60, label: '60 detik', icon: '🎬' },
]

// ══════════════════════════════════════════════════════════════
// VISUAL SEQUENCES — shot list per jenis script (5 scene)
// ══════════════════════════════════════════════════════════════
export const VISUAL_SEQUENCES: Record<ScriptVariantId, string[]> = {
  'ugc-review': [
    'Close-up wajah/ekspresi sambil ngomong langsung ke kamera (handheld, natural)',
    'Cutaway ke produk di tangan, putar perlihatkan kemasan',
    'B-roll produk dipakai / diaplikasikan secara nyata',
    'Split-screen atau cut before-after hasil',
    'Pointing ke keranjang kuning + teks CTA di layar',
  ],
  pas: [
    'Visual masalah (kusam, berantakan, ribet) dengan ekspresi kesal',
    'Zoom-in masalah + teks overlay "relate gak?"',
    'Reveal produk dengan transisi cepat (problem solved)',
    'Demo produk menyelesaikan masalah',
    'Teks rating/terjual + CTA arrow ke keranjang',
  ],
  storytelling: [
    'Talking head intim, lighting hangat, mulai cerita',
    'Foto/klip "masa sulit" (bisa stok atau reenactment)',
    'Momen reveal produk dengan musik naik',
    'Montage transformasi / hasil sekarang',
    'Senyum ke kamera + CTA lembut + link',
  ],
  unboxing: [
    'Paket utuh di meja, tangan mulai buka (ASMR friendly)',
    'Tarik isi keluar, perlihatkan layer packaging',
    'Hold produk, putar 360°, sorot detail',
    'Tes cepat fungsi utama produk',
    'Produk + teks harga/diskon + CTA keranjang',
  ],
  tutorial: [
    'Hook teks besar "Cara [X] dalam [Y] detik"',
    'Top-down / POV step pertama',
    'Step pakai produk (highlight produk di frame)',
    'Reveal hasil akhir memuaskan',
    'Tunjuk produk + teks "tools ada di keranjang"',
  ],
  'before-after': [
    'Shot "BEFORE" jujur, teks label di pojok',
    'Transisi swipe/clap ke proses pemakaian',
    'Time-lapse / cut cepat proses',
    'Shot "AFTER" angle sama, side-by-side',
    'Teks timeline "X hari" + CTA beli',
  ],
  affiliate: [
    'Hook diskon besar teks layar penuh',
    'Produk hero shot dengan lighting clean',
    'Overlay screenshot rating & jumlah terjual',
    'Teks "stok terbatas" + animasi urgensi',
    'Zoom keranjang kuning + kode promo besar',
  ],
  'live-promo': [
    'Teks "LIVE jam [X]" full screen energik',
    'Teaser produk ditutup sebagian (bikin penasaran)',
    'Flash harga coret → harga live',
    'Hitung mundur / "siapin keranjang"',
    'CTA follow + ikon reminder berkedip',
  ],
  comparison: [
    'Split screen "A vs B" teks jelas',
    'Sorot kekurangan produk A (netral)',
    'Sorot kelebihan produk kita (B)',
    'Checklist perbandingan muncul satu-satu',
    'Tunjuk pemenang + CTA ke produk B',
  ],
  'trending-sound': [
    'Frame 1 sinkron beat drop sound viral',
    'Hard cut ke produk tepat di ketukan',
    'Transisi/twist gerakan cepat',
    'Quick benefit shot (1-2 detik)',
    'Freeze + teks CTA, perkuat di caption',
  ],
  'flash-sale': [
    'Teks "FLASH SALE HARI INI" merah/kuning kontras',
    'Harga coret besar → harga promo animasi',
    'Produk + bonus ditata rapi',
    'Countdown timer / "stok tinggal sedikit"',
    'Tombol checkout + panah ke keranjang',
  ],
  educational: [
    'Hook teks "3 kesalahan saat [topik]"',
    'Poin 1 dengan visual contoh salah',
    'Poin 2 + masuk produk sebagai solusi',
    'Poin 3 penutup value cepat',
    'CTA halus + produk di keranjang',
  ],
}

// ══════════════════════════════════════════════════════════════
// INTEGRASI TIKTOK API
// ──────────────────────────────────────────────────────────────
// Preset di bawah ini menyiapkan METADATA siap-publish ke
// TikTok Content Posting API. Untuk benar-benar posting otomatis,
// dibutuhkan: app di TikTok for Developers, scope video.publish,
// dan alur OAuth user (access_token). Lihat buildTikTokPostPayload().
// ══════════════════════════════════════════════════════════════

export type TikTokPrivacy =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'FOLLOWER_OF_CREATOR'
  | 'SELF_ONLY'

export interface TikTokPostPreset {
  id: string
  label: string
  icon: string
  privacyLevel: TikTokPrivacy
  discloseCommercial: boolean   // disclose_commercial_content
  brandOrganic: boolean         // brand_organic_toggle (brand kamu sendiri)
  brandedContent: boolean       // branded_content_toggle (paid partnership)
  disableComment: boolean
  disableDuet: boolean
  disableStitch: boolean
  desc: string
}

export const TIKTOK_POST_PRESETS: TikTokPostPreset[] = [
  {
    id: 'organic',
    label: 'Organik (Brand Sendiri)',
    icon: '🌱',
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    discloseCommercial: true,
    brandOrganic: true,
    brandedContent: false,
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
    desc: 'Untuk seller yang promosi produk sendiri. Aktifkan label "Promosikan produk sendiri".',
  },
  {
    id: 'affiliate',
    label: 'Affiliate / Paid Partnership',
    icon: '🤝',
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    discloseCommercial: true,
    brandOrganic: false,
    brandedContent: true,
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
    desc: 'Untuk affiliate / endorse. Wajib label "Konten bermerek (paid partnership)".',
  },
  {
    id: 'engagement',
    label: 'Maksimal Engagement',
    icon: '🔥',
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    discloseCommercial: false,
    brandOrganic: false,
    brandedContent: false,
    disableComment: false,
    disableDuet: false,
    disableStitch: false,
    desc: 'Buka semua interaksi (comment, duet, stitch) buat dorong reach FYP.',
  },
  {
    id: 'draft',
    label: 'Privat (Cek Dulu)',
    icon: '🔒',
    privacyLevel: 'SELF_ONLY',
    discloseCommercial: false,
    brandOrganic: false,
    brandedContent: false,
    disableComment: true,
    disableDuet: true,
    disableStitch: true,
    desc: 'Upload privat untuk review internal sebelum dipublik.',
  },
]

// ── Kategori trending sound ───────────────────────────────────
// Data sound viral REAL-TIME sebaiknya ditarik dari TikTok Creative
// Center / Display API. Ini panduan tipe sound per gaya konten.
export interface TrendingSoundType {
  id: string
  label: string
  icon: string
  useFor: ScriptVariantId[]
  tip: string
}

export const TIKTOK_TRENDING_SOUND_TYPES: TrendingSoundType[] = [
  {
    id: 'upbeat-trending',
    label: 'Upbeat / Trending Beat',
    icon: '🎶',
    useFor: ['trending-sound', 'unboxing', 'flash-sale'],
    tip: 'Pakai sound yang lagi naik (panah ke atas di Creative Center). Sinkronkan cut ke beat drop.',
  },
  {
    id: 'voiceover-asmr',
    label: 'Voiceover + ASMR',
    icon: '🎙️',
    useFor: ['ugc-review', 'tutorial', 'educational'],
    tip: 'Suara asli kamu lebih dipercaya. Tambah ASMR halus untuk unboxing/tekstur.',
  },
  {
    id: 'emotional',
    label: 'Emotional / Cinematic',
    icon: '🎻',
    useFor: ['storytelling', 'before-after'],
    tip: 'Bangun emosi di klimaks transformasi. Naikkan volume saat reveal "after".',
  },
  {
    id: 'hype-urgency',
    label: 'Hype / Urgency',
    icon: '📣',
    useFor: ['live-promo', 'flash-sale', 'affiliate'],
    tip: 'Tempo cepat untuk dorong rasa "buruan checkout". Cocok untuk countdown.',
  },
]

// ── Strategi hashtag ──────────────────────────────────────────
export const HASHTAG_STRATEGY = {
  formula: '3 Trending + 3 Niche + 2 General + 2 Produk',
  rules: [
    'Jangan spam hashtag — TikTok lebih suka 3-8 hashtag relevan.',
    'Selalu campur 1-2 hashtag trending dengan hashtag niche spesifik.',
    'Hashtag produk/brand memudahkan tracking & retargeting.',
    'Cek volume & tren hashtag di TikTok Creative Center sebelum dipakai.',
  ],
} as const

// ── Builder payload Content Posting API ───────────────────────
export interface BuildPayloadInput {
  platform: PlatformId
  caption: string
  hashtags: string[]
  privacyLevel?: TikTokPrivacy
  postPreset?: TikTokPostPreset
  videoUrl?: string          // hasil render (mis. dari Cloudflare R2)
  suggestedSound?: string
}

export interface TikTokPublishPayload {
  // Sesuai struktur TikTok Content Posting API (post_info + source_info)
  post_info: {
    title: string
    privacy_level: TikTokPrivacy
    disable_comment: boolean
    disable_duet: boolean
    disable_stitch: boolean
    brand_content_toggle: boolean
    brand_organic_toggle: boolean
  }
  source_info: {
    source: 'PULL_FROM_URL' | 'FILE_UPLOAD'
    video_url?: string
  }
  // _meta = bantuan internal app (BUKAN bagian payload resmi TikTok)
  _meta: {
    platform: PlatformId
    hashtags: string[]
    suggestedSound?: string
    note: string
  }
}

/**
 * Bangun payload metadata siap dikirim ke TikTok Content Posting API.
 * Title = caption + hashtags (TikTok menggabung caption & hashtag di field title).
 */
export function buildTikTokPostPayload(input: BuildPayloadInput): TikTokPublishPayload {
  const preset = input.postPreset
  const platform = PLATFORMS.find((p) => p.id === input.platform) ?? PLATFORMS[0]

  const tags = input.hashtags.slice(0, platform.hashtagLimit).join(' ')
  const rawTitle = tags ? `${input.caption}\n\n${tags}` : input.caption
  const title = rawTitle.slice(0, platform.captionLimit)

  return {
    post_info: {
      title,
      privacy_level: input.privacyLevel ?? preset?.privacyLevel ?? 'PUBLIC_TO_EVERYONE',
      disable_comment: preset?.disableComment ?? false,
      disable_duet: preset?.disableDuet ?? false,
      disable_stitch: preset?.disableStitch ?? false,
      brand_content_toggle: preset?.brandedContent ?? false,
      brand_organic_toggle: preset?.brandOrganic ?? false,
    },
    source_info: {
      source: input.videoUrl ? 'PULL_FROM_URL' : 'FILE_UPLOAD',
      ...(input.videoUrl ? { video_url: input.videoUrl } : {}),
    },
    _meta: {
      platform: input.platform,
      hashtags: input.hashtags.slice(0, platform.hashtagLimit),
      suggestedSound: input.suggestedSound,
      note: platform.apiSupported
        ? `${platform.apiNote}. Butuh access_token user (scope video.publish).`
        : 'Platform ini belum mendukung auto-publish via API.',
    },
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS UNTUK ROUTE API (single source of truth)
// ──────────────────────────────────────────────────────────────
// Dipakai oleh app/api/studio/video/tiktok/route.ts
// ══════════════════════════════════════════════════════════════

// ── Deteksi marketplace dari URL produk ───────────────────────
export function extractPlatformFromUrl(url: string): string {
  const u = (url || '').toLowerCase()
  if (u.includes('shopee'))    return 'Shopee'
  if (u.includes('tiktok'))    return 'TikTok Shop'
  if (u.includes('tokopedia')) return 'Tokopedia'
  if (u.includes('lazada'))    return 'Lazada'
  if (u.includes('bukalapak')) return 'Bukalapak'
  if (u.includes('blibli'))    return 'Blibli'
  return 'website'
}

// ── Label bahasa untuk prompt ─────────────────────────────────
function langLabel(language: 'indonesia' | 'english'): string {
  return language === 'english'
    ? 'English'
    : 'Bahasa Indonesia (gaya seller TikTok Indonesia, natural & santai)'
}

// ── Prompt single script (output bertag untuk parseSections) ──
export interface ScriptPromptInput {
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

export function buildScriptPrompt(input: ScriptPromptInput): string {
  const v    = SCRIPT_VARIANTS.find(s => s.id === input.variantId) ?? SCRIPT_VARIANTS[0]
  const plat = PLATFORMS.find(p => p.id === input.platform) ?? PLATFORMS[0]
  const isAffiliate = input.variantId === 'affiliate' && !!input.affiliateCode?.trim()

  return `Tulis script video pendek untuk ${plat.label} (durasi target ${input.duration} detik).

GAYA SCRIPT: ${v.label} — ${v.desc}
FRAMEWORK: ${v.framework}
STRUKTUR (ikuti urutan ini):
${v.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DATA PRODUK:
- Nama: ${input.productName}
- Harga: ${input.productPrice || '(belum disebut — buat menarik tanpa angka spesifik)'}
- Benefit utama: ${input.mainBenefit || '(simpulkan sendiri yang masuk akal)'}
- Pain point: ${input.painPoint || '(simpulkan masalah relevan)'}
- Target market: ${input.targetMarket || 'pembeli online Indonesia'}
- Social proof: ${input.socialProof || '(boleh estimasi wajar)'}
- Niche: ${input.niche}
${isAffiliate ? `- Kode affiliate (WAJIB disebut di CTA): ${input.affiliateCode}` : ''}

ATURAN:
- Bahasa: ${langLabel(input.language)}
- Tone: ${input.tone}
- Hook wajib menahan scroll di 3 detik pertama.
- Bahasa natural seperti orang ngomong, jangan kaku/robotik.
- Fokus konversi: arahkan ke keranjang kuning / link produk.

OUTPUT WAJIB persis dengan tag berikut (jangan ada teks lain di luar tag):
[HOOK]
(1 kalimat hook paling kuat)
[SCRIPT]
(naskah lengkap siap dibaca, sesuai struktur & durasi)
[CAPTION]
(caption singkat untuk ${plat.label}, tanpa hashtag)
[CTA]
(1-2 kalimat call to action${isAffiliate ? `, sertakan kode ${input.affiliateCode}` : ''})
[VISUAL_NOTES]
(tips visual/shot singkat)`
}

// ── Prompt 12 variasi sekaligus (id SELALU cocok SCRIPT_VARIANTS) ──
export interface VariantsPromptInput {
  productName:   string
  productPrice?: string
  targetMarket?: string
  mainBenefit?:  string
  painPoint?:    string
  socialProof?:  string
  niche?:        NicheId
  platform?:     PlatformId
  duration?:     DurationSec
}

export function buildVariantsPrompt(input: VariantsPromptInput): string {
  const list = SCRIPT_VARIANTS
    .map(v => `[${v.id}] (${v.label}) <hook + cuplikan script ~${v.idealDuration} detik>`)
    .join('\n')

  return `Kamu scriptwriter viral TikTok/Reels untuk e-commerce Indonesia.
Buat 12 script BERBEDA untuk produk yang SAMA — satu untuk tiap format di bawah.

PRODUK: ${input.productName} | Harga: ${input.productPrice || 'kompetitif'} | Benefit: ${input.mainBenefit || '-'} | Pain point: ${input.painPoint || '-'} | Target: ${input.targetMarket || 'pembeli online Indonesia'}

Untuk tiap format, tulis HANYA: [id-format] lalu hook + cuplikan script (maks 80 kata).
Output 12 baris dengan format PERSIS seperti ini (pertahankan id di dalam kurung siku):
${list}

Tulis dalam Bahasa Indonesia natural. Buat tiap hook unik & menjual. Jangan tambahkan teks lain.`
}

// ── Hook variants (template, tanpa AI) ────────────────────────
export function buildHookVariants(productName: string, _niche: NicheId, price: string): string[] {
  const p     = productName?.trim() || 'produk ini'
  const harga = price?.trim()
  return [
    `Nggak nyangka ${p} bisa se-ngefek ini, coba lihat deh...`,                       // curiosity gap
    `Udah ribuan orang checkout ${p}, dan ini alasan mereka repeat order.`,            // social proof
    harga
      ? `Cuma ${harga} tapi hasilnya kayak produk mahal — ini buktinya.`              // price anchor
      : `Harga segini tapi kualitasnya nggak main-main, ini buktinya.`,
    `STOP scroll. Kalau kamu punya masalah yang sama, ${p} wajib kamu tahu.`,
    `Aku coba ${p} seminggu, dan hasilnya bikin nyesel kenapa nggak dari dulu.`,
    `Ini yang nggak diceritain penjual lain soal ${p}...`,
  ]
}

// ── Hashtag generator ─────────────────────────────────────────
const NICHE_HASHTAGS: Record<NicheId, string[]> = {
  general:  ['#rekomendasi', '#produkviral', '#wajibpunya', '#olshopindonesia'],
  fashion:  ['#ootd', '#fashionindonesia', '#outfitinspo', '#fashiontiktok'],
  beauty:   ['#beauty', '#makeup', '#beautytips', '#makeuptutorial'],
  skincare: ['#skincare', '#skincareroutine', '#glowing', '#skincareindonesia'],
  food:     ['#kulinerviral', '#makananenak', '#foodie', '#jajananviral'],
  gadget:   ['#gadget', '#teknologi', '#gadgetmurah', '#reviewgadget'],
  health:   ['#herbal', '#kesehatan', '#hidupsehat', '#suplemen'],
  home:     ['#peralatanrumah', '#homedecor', '#rumahminimalis', '#perabotanrumah'],
  baby:     ['#perlengkapanbayi', '#ibudananak', '#babyshop', '#momlife'],
  hijab:    ['#hijabstyle', '#hijabootd', '#fashionhijab', '#hijabers'],
}

function slugifyTag(name: string): string {
  const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  return slug ? `#${slug.slice(0, 24)}` : '#produk'
}

export interface HashtagSet {
  trending: string[]
  niche:    string[]
  general:  string[]
  product:  string[]
}

export function buildHashtags(niche: NicheId, platform: PlatformId, productName: string): HashtagSet {
  const platTag =
    platform === 'reels'  ? ['#reels', '#instagramreels'] :
    platform === 'shorts' ? ['#shorts', '#youtubeshorts'] :
                            ['#tiktok', '#tiktokshop']

  const words    = (productName || '').trim().split(/\s+/).filter(Boolean)
  const firstTwo = words.slice(0, 2).join('')
  const productTags = Array.from(new Set([
    slugifyTag(productName),
    firstTwo ? slugifyTag(firstTwo) : '#produkviral',
    '#racuntiktok',
  ]))

  return {
    trending: ['#fyp', '#foryou', '#viral', '#masukberanda', '#trending'],
    niche:    NICHE_HASHTAGS[niche] ?? NICHE_HASHTAGS.general,
    general:  ['#racunshopee', '#review', '#rekomendasi', ...platTag],
    product:  productTags,
  }
}