// apps/web-app/lib/ai/caption-prompt-builder.ts
// ── BeeSell AI — Caption Prompt Builder (Complete 18 Dimensions) ──────────
// Converts all user inputs + AI Memory → ultra-detailed prompt → powerful output

export type CaptionEngine =
  | 'caption' | 'hook' | 'cta' | 'soft-selling' | 'hard-selling'
  | 'viral' | 'affiliate' | 'storytelling' | 'engagement'
  | 'description' | 'marketplace' | 'launching' | 'rewrite'

export type MarketingObjective =
  | 'hard-selling' | 'soft-selling' | 'branding' | 'awareness'
  | 'engagement' | 'viral' | 'affiliate' | 'lead-gen'
  | 'marketplace-convert' | 'launching' | 'flash-sale'

export type CaptionStyle =
  | 'storytelling' | 'problem-solution' | 'pas' | 'aida'
  | 'hook-viral' | 'listicle' | 'testimonial' | 'edukasi'
  | 'fomo' | 'cta-heavy' | 'minimalis' | 'cinematic'

export type HookType =
  | 'question' | 'shock' | 'pain-point' | 'curiosity'
  | 'statistic' | 'viral' | 'emotional' | 'humor' | 'fomo'

export type AudienceEmotion =
  | 'penasaran' | 'percaya' | 'urgent' | 'excited'
  | 'fomo' | 'nyaman' | 'premium' | 'inspired'

// ── Dimension 1-18 full input interfaces ─────────────────────────────────
export interface ProductInput {
  // Dim 1 — Informasi Produk (WAJIB)
  name:          string
  type?:         string    // jenis: kemasan botol, fashion, elektronik kecil…
  category?:     string    // kategori: skincare, fashion, food…
  description?:  string    // deskripsi lengkap
  function?:     string    // fungsi utama: mencerahkan, menguatkan…
  highlights?:   string    // keunggulan: BPOM, niacinamide 10%…
  usp?:          string    // unique selling point
  benefits?:     string    // benefit bagi user
  problemSolved?:string    // masalah yang diselesaikan
  price?:        string    // harga
  promo?:        string    // promo / diskon
  guarantee?:    string    // garansi
  packaging?:    string    // packaging info
  certification?:string    // BPOM, halal, SNI…
}

export interface CaptionConfig {
  // Dim 2  — Tujuan marketing
  objective:      MarketingObjective
  // Dim 3  — Platform
  platform:       string
  // Dim 4  — Target audience
  targetAudience: string | string[]
  // Dim 5  — Tone
  tone:           string
  // Dim 6  — Style caption
  style?:         CaptionStyle
  // Dim 7  — Hook preference
  hookType?:      HookType
  // Dim 8  — CTA preference
  ctaText?:       string
  ctaStyle:       'soft' | 'medium' | 'aggressive'
  // Dim 9  — Keywords / SEO
  keywords?:      string
  // Dim 10 — Bahasa & gaya
  language:       string
  // Dim 11 — Panjang caption
  length?:        'short' | 'medium' | 'long' | 'thread' | 'carousel'
  // Dim 12 — Emoji level
  emoji:          'none' | 'minimal' | 'moderate' | 'heavy'
  // Dim 13 — Hashtag generation
  generateHashtag?: boolean
  // Dim 14 — Visual context (from image upload / AI Studio)
  visualContext?: {
    imageUrl?:        string
    imageMode?:       string   // product|ugc|scene|before-after
    imageStyle?:      string   // studio-white|lifestyle|luxury…
    aiDescription?:   string   // GPT-4o vision result
    dominantColors?:  string[] // warna dominan gambar
    mood?:            string   // cozy|energetic|elegant…
    hasModel?:        boolean
    background?:      string
  }
  // Dim 15 — Audience emotion target
  emotionTarget?:   AudienceEmotion
  // Dim 16 — Competitor / market style
  competitorStyle?: string
  // Dim 17 — Brand identity (from AI Memory / Supabase)
  brandIdentity?: {
    name?:         string
    tagline?:      string
    primaryColor?: string
    personality?:  string
    positioning?:  string
    keywords?:     string
    avoidWords?:   string
    niche?:        string
    sellerType?:   string
    usp?:          string
  }
  // Dim 18 — Conversion objective / KPI
  conversionKPI?:   'ctr' | 'save-share' | 'checkout' | 'engagement' | 'affiliate-click'

  // Meta
  engine:    CaptionEngine
  variants:  number
  // For rewrite mode
  originalCaption?: string
}

// ── Reference maps ────────────────────────────────────────────────────────
const PLATFORM_RULES: Record<string, { max:number; format:string; hashtag:string; tip:string }> = {
  instagram:     { max:2200,  format:'hook kuat → body storytelling → CTA → hashtag 10-20 di akhir',   hashtag:'10-20 hashtag niche+viral+SEO',              tip:'Gunakan line breaks pendek untuk readability. Emoji strategis.' },
  tiktok:        { max:300,   format:'hook SANGAT kuat (2 detik pertama) → body singkat → CTA cepat',  hashtag:'3-5 hashtag: #fyp #foryou + niche',           tip:'Kalimat pertama menentukan segalanya. Singkat, padat, kuat.' },
  'tiktok-shop': { max:300,   format:'harga/diskon dulu → benefit utama → CTA ke keranjang kuning',    hashtag:'5-8 hashtag tiktokshop + produk',             tip:'Sebut harga dan promo di 5 kata pertama.' },
  shopee:        { max:3000,  format:'judul SEO + paragraf benefit + bullet poin + garansi + CTA',      hashtag:'keyword SEO marketplace di deskripsi',        tip:'Keyword di 70 karakter pertama. Bullet benefit 5-7 poin.' },
  tokopedia:     { max:3000,  format:'deskripsi detail + spesifikasi + cara pakai + garansi + CTA',     hashtag:'keyword SEO tokopedia di body teks',           tip:'Pembeli Tokopedia lebih detail-oriented. Berikan info lengkap.' },
  facebook:      { max:1000,  format:'storytelling hook → emotional body → social proof → CTA + hashtag',hashtag:'3-5 hashtag',                               tip:'Facebook suka konten yang membuat orang komentar dan share.' },
  whatsapp:      { max:800,   format:'sapaan personal → penawaran singkat → benefit → CTA langsung',    hashtag:'tidak perlu hashtag',                         tip:'Tone percakapan, tidak formal. Seperti teman rekomendasikan.' },
  twitter:       { max:280,   format:'1 ide kuat dalam max 280 karakter + 1-2 hashtag',                hashtag:'1-2 hashtag trending',                        tip:'Be controversial atau sangat relatable untuk RT. Punchy.' },
  linkedin:      { max:1300,  format:'professional hook → insight/data → storytelling → CTA',          hashtag:'3-5 hashtag profesional',                     tip:'Authority tone. Data dan insight lebih powerful di LinkedIn.' },
}

const OBJECTIVE_PROMPTS: Record<string, string> = {
  'hard-selling':        'TUJUAN: Menjual langsung sekarang. Direct offer, tampilkan harga, FOMO dan scarcity (stok terbatas, waktu terbatas), social proof singkat, CTA kuat dan urgent. Tidak ada basa-basi.',
  'soft-selling':        'TUJUAN: Edukasi dan nurturing dulu. Share value atau informasi berguna 60-70% → relate masalah → suggest produk secara natural → CTA lembut. JANGAN langsung jualan di awal.',
  'branding':            'TUJUAN: Bangun brand awareness dan brand love. Tidak ada harga, tidak ada direct selling. Fokus pada nilai, personality, dan positioning brand. Buat orang kenal dan suka brand.',
  'awareness':           'TUJUAN: Perkenalkan produk atau brand. Informatif dan menarik. Edukasi tentang apa, untuk siapa, mengapa penting. Belum jualan langsung.',
  'engagement':          'TUJUAN: Tingkatkan interaksi. Buat pertanyaan yang bikin orang mau jawab, ajak komentar/share/tag teman, diskusi, polling, "apa pendapatmu?". Prioritas komentar > likes.',
  'viral':               'TUJUAN: Konten yang dishare banyak orang. Sangat relatable atau mengejutkan, menyentuh emosi massa (tertawa, haru, marah positif), punya humor atau insight yang orang mau forward.',
  'affiliate':           'TUJUAN: Klik link affiliate. Review authentic seperti orang nyata yang pakai produk, "racun produk" style, jujur tapi positif, natural recommendation, subtle CTA ke link.',
  'lead-gen':            'TUJUAN: Kumpulkan leads. Tawarkan sesuatu bernilai gratis (info, konsultasi, sample), minta DM/klik/isi form. Buat penasaran dengan tidak terlalu banyak info sekaligus.',
  'marketplace-convert': 'TUJUAN: Konversi di marketplace. SEO-friendly, benefit crystal clear, eliminasi keraguan, garansi prominan, CTA langsung ke beli/keranjang.',
  'launching':           'TUJUAN: Launching produk baru. Ciptakan hype, eksklusivitas, first-mover advantage, pre-order urgency, teaser yang bikin penasaran, FOMO eksklusivitas.',
  'flash-sale':          'TUJUAN: Flash sale mendesak. URGENCY MAXIMUM: waktu sangat terbatas, stok terbatas, harga tidak akan kembali. Countdown feeling. CTA beli sekarang atau menyesal.',
}

const TONE_PROMPTS: Record<string, string> = {
  casual:        'santai, akrab, ngobrol seperti teman se-nongkrong. "kamu" bukan "Anda". Informal tapi genuine.',
  friendly:      'hangat, empati tinggi, supportive. Seperti kakak perempuan yang peduli dan merekomendasikan.',
  professional:  'formal, terpercaya, berbobot. Kredibel dan authority. Hindari slang. Bahasa baku yang mengalir.',
  energetic:     'penuh semangat, exciting, HIGH ENERGY! Banyak tanda seru! Bikin pembaca ikut semangat.',
  luxury:        'mewah, eksklusif, prestisius. Kata-kata premium: "crafted", "eksklusif", "terpilih". Slow dan elegant.',
  playful:       'lucu, fun, ringan, menghibur. Boleh puns dan wordplay. Bikin senyum dulu, jualan kemudian.',
  emotional:     'menyentuh hati, emosional, storytelling yang bikin terharu atau relate dalam. Human-first.',
  authoritative: 'expert, data-driven, thought leader. Berikan angka dan fakta. Orang percaya karena knowledge.',
  islami:        'nuansa Islami, halal, berkah, rezeki, doa. Kata-kata: alhamdulillah, insyaallah, amanah, terpercaya.',
  motivational:  'inspiratif, membakar semangat, belief dalam diri. Seperti motivator. Impactful dan uplifting.',
  'gen-z':       'Gen Z banget: "literally", "no cap", "fr fr", "slay", "main character", "bestie". Informal, ironic, self-aware.',
}

const STYLE_PROMPTS: Record<string, string> = {
  storytelling:     'FORMULA STORYTELLING: Mulai dengan setting yang relate (situasi) → perkenalkan konflik/masalah → turning point saat menemukan produk → transformasi/hasil nyata → CTA natural. Terasa seperti kisah nyata orang sungguhan.',
  'problem-solution':'FORMULA PROBLEM-SOLUTION: Sebut masalah yang sangat spesifik dan relate (bikin pembaca angguk-angguk) → agitate rasa sakit masalah itu → present produk sebagai satu-satunya solusi → CTA.',
  pas:              'FORMULA PAS: P=Problem (sebut masalah spesifik) → A=Agitate (perbesar masalah, bikin makin terasa) → S=Solution (produk sebagai jawaban sempurna). Pakai urutan ini ketat.',
  aida:             'FORMULA AIDA: A=Attention (hook yang stop scroll) → I=Interest (informasi menarik tentang produk) → D=Desire (buat mereka kepengen, bayangkan manfaatnya) → A=Action (CTA yang jelas). Ikuti urutan ini.',
  'hook-viral':     'FORMULA HOOK VIRAL: Hook SANGAT kuat (bisa pertanyaan mengejutkan, statistic, atau statement kontroversial positif) → body singkat-padat dengan benefit utama → CTA langsung. Tidak bertele-tele.',
  listicle:         'FORMAT LISTICLE: Pakai list bernomor atau bullet. Contoh: "5 Alasan Kenapa..." atau "3 Hal yang Bikin Kulit Glow". Setiap poin = 1 baris singkat dan impactful. Mudah dibaca.',
  testimonial:      'FORMAT TESTIMONIAL: Tulis seperti review nyata dari customer yang puas. Voice orang pertama ("Aku", "Gue"). Spesifik dengan angka dan hasil nyata. Authentic, tidak terlalu sempurna.',
  edukasi:          'FORMAT EDUKATIF: Berikan informasi atau tips berharga dulu (80% value) → natural mention produk sebagai alat/solusi (20%) → CTA sangat soft. Orang share karena kontennya berguna.',
  fomo:             'FORMULA FOMO: Tekankan apa yang dilewatkan (eksklusivitas, limitasi, orang lain sudah merasakan). "Kamu satu-satunya yang belum tau ini." Scarcity, urgency, dan social proof yang kuat.',
  'cta-heavy':      'FORMULA CTA HEAVY: Multiple CTA di berbagai titik — di tengah dan akhir. Setiap poin diakhiri mini-CTA. Action-oriented di setiap kalimat. Tidak ada kalimat yang buang-buang space.',
  minimalis:        'FORMULA MINIMALIS: LESS IS MORE. Max 3-5 kalimat total. Setiap kata harus earn its place. Tidak ada filler. White space dan impact > panjang. Singkat tapi memorable dan kuat.',
  cinematic:        'GAYA SINEMATIK: Deskriptif dan vivid, seperti narasi film. Evocative words yang bikin pembaca "melihat" scene. Dramatis, slow-build, atmosphere kuat. Lebih sastra dari sekedar caption.',
}

const HOOK_PROMPTS: Record<string, string> = {
  question:   'Mulai dengan PERTANYAAN yang langsung relate dengan pain point atau situasi audience. Pertanyaan yang bikin pembaca berkata "iya, itu aku!".',
  shock:      'SHOCK STATEMENT di kalimat pertama. Counter-intuitive, mengejutkan, atau informasi yang tidak terduga. Bikin pembaca langsung fokus.',
  'pain-point':'Langsung sebut MASALAH SPESIFIK yang audience rasakan setiap hari. Sangat spesifik dan mendetail — bikin mereka merasa dipahami.',
  curiosity:  'CURIOSITY GAP — berikan petunjuk tapi jangan full reveal. "Ini yang bikin 10.000 seller berhenti buang uang untuk..." — orang harus baca terus.',
  statistic:  'Mulai dengan ANGKA atau DATA yang mengejutkan dan relevan. "73% seller online gagal bukan karena produknya, tapi karena..."',
  viral:      'Pakai FORMULA HOOK yang sedang viral di platform target. Mirror pattern konten yang sedang trending di FYP/Explore.',
  emotional:  'Langsung SENTUH EMOSI di kalimat pertama. Nostalgia, cinta, kekhawatiran, harapan, atau rasa takut yang relate.',
  humor:      'Buka dengan HUMOR atau sesuatu yang bikin senyum. Puns, wordplay, atau situasi lucu yang relate. Disarm pembaca dulu.',
  fomo:       '"Semua orang udah coba ini tapi kamu belum?" atau variasi. Langsung menciptakan rasa tertinggal dan keharusan untuk tahu.',
}

const EMOTION_PROMPTS: Record<string, string> = {
  penasaran: 'Ciptakan CURIOSITY GAP di setiap poin. Berikan cukup untuk menarik tapi tidak terlalu banyak. Pertanyaan yang bikin orang harus tahu jawabannya.',
  percaya:   'Bangun KEPERCAYAAN: tampilkan social proof (jumlah pengguna, review), data konkret, sertifikasi, transparansi tentang bahan/proses, garansi.',
  urgent:    'Ciptakan URGENCY NYATA: waktu terbatas (jam countdown), stok terbatas (angka spesifik), harga akan naik, kesempatan langka.',
  excited:   'ENERGI TINGGI dan antusiasme yang menular. Buat pembaca excited tentang kemungkinan dan manfaat luar biasa yang bisa mereka dapat.',
  fomo:      'FEAR OF MISSING OUT yang kuat: orang lain sudah merasakan, kamu belum. Ekslusivitas, limitasi, dan komunitas yang sudah ada.',
  nyaman:    'Rasa AMAN dan NYAMAN. Tidak ada tekanan, no judgment. Warm, welcoming, reassuring. Pembaca merasa produk ini "untuk mereka".',
  premium:   'Perasaan EKSKLUSIF dan ISTIMEWA. Produk ini bukan untuk semua orang — untuk mereka yang menghargai kualitas. Premium experience.',
  inspired:  'INSPIRASI dan MOTIVASI melalui transformasi. Kisah sebelum-sesudah yang powerful. "Kalau mereka bisa, kamu juga bisa."',
}

const KPI_PROMPTS: Record<string, string> = {
  ctr:             'Optimasi untuk CLICK-THROUGH RATE: hook yang sangat compelling dan specific benefit yang bikin penasaran. Setiap kalimat harus pull reader ke next action.',
  'save-share':    'Optimasi untuk SAVE & SHARE: berikan nilai yang orang mau simpan untuk referensi nanti, atau informasi yang orang mau bagikan ke teman yang membutuhkan.',
  checkout:        'Optimasi untuk CHECKOUT: eliminasi semua keraguan (garansi, review, sertifikasi), perkuat benefit yang paling relevan, minimize friction, CTA langsung ke beli.',
  engagement:      'Optimasi untuk ENGAGEMENT: pertanyaan terbuka yang genuinely menarik untuk dijawab, polling implisit, "tag teman yang butuh ini", controversial tapi positive.',
  'affiliate-click':'Optimasi untuk AFFILIATE CLICK: authentic review yang tidak terasa seperti iklan, natural recommendation, subtle placement link, "link di bio" yang terasa organik.',
}

// ── Visual context analyzer ───────────────────────────────────────────────
function buildVisualContextSection(vc: NonNullable<CaptionConfig['visualContext']>): string {
  if (!vc.imageUrl && !vc.aiDescription) return ''

  const lines = ['=== KONTEKS VISUAL (SECTION 14 — SANGAT PENTING) ===']

  if (vc.aiDescription) {
    lines.push(`Deskripsi AI dari gambar: ${vc.aiDescription}`)
  }
  if (vc.imageMode)  lines.push(`Mode foto: ${vc.imageMode}`)
  if (vc.imageStyle) lines.push(`Style visual: ${vc.imageStyle}`)
  if (vc.mood)       lines.push(`Mood/atmosphere gambar: ${vc.mood}`)
  if (vc.dominantColors?.length) lines.push(`Warna dominan: ${vc.dominantColors.join(', ')}`)
  if (vc.hasModel !== undefined) lines.push(`Ada model/orang: ${vc.hasModel ? 'Ya' : 'Tidak'}`)
  if (vc.background)  lines.push(`Background: ${vc.background}`)

  lines.push('')
  lines.push('INSTRUKSI: Sesuaikan nuansa, suasana, dan tone caption dengan visual di atas.')
  lines.push('Caption harus "terasa" seperti dibuat untuk gambar ini secara spesifik.')
  lines.push('Gunakan kata-kata yang evocative dan sesuai mood gambar.')

  return lines.join('\n')
}

// ── Brand identity section ────────────────────────────────────────────────
function buildBrandSection(brand: NonNullable<CaptionConfig['brandIdentity']>): string {
  const lines = ['=== BRAND IDENTITY & AI MEMORY (SECTION 17) ===']
  if (brand.name)         lines.push(`Nama Brand: ${brand.name}`)
  if (brand.tagline)      lines.push(`Tagline: "${brand.tagline}"`)
  if (brand.personality)  lines.push(`Brand Personality: ${brand.personality}`)
  if (brand.positioning)  lines.push(`Positioning: ${brand.positioning}`)
  if (brand.niche)        lines.push(`Niche: ${brand.niche}`)
  if (brand.sellerType)   lines.push(`Tipe Seller: ${brand.sellerType}`)
  if (brand.keywords)     lines.push(`Keyword Brand yang HARUS muncul: ${brand.keywords}`)
  if (brand.usp)          lines.push(`USP Brand: ${brand.usp}`)
  if (brand.avoidWords)   lines.push(`⚠️ DILARANG KERAS menggunakan kata: ${brand.avoidWords}`)
  if (brand.primaryColor) lines.push(`Warna brand: ${brand.primaryColor}`)
  return lines.join('\n')
}

// ── Engine instruction per type ───────────────────────────────────────────
function getEngineInstruction(engine: CaptionEngine, d: CaptionConfig): string {
  const v = d.variants
  switch (engine) {
    case 'caption':
      return `Generate ${v} caption BERBEDA yang langsung bisa diposting. Setiap caption = hook kuat + body informatif + CTA. Variasikan angle: emotional, logical, FOMO, social proof, etc.`
    case 'hook':
      return `Generate ${v * 3} variasi HOOK PEMBUKA saja (bukan full caption). Hook = max 2 kalimat pertama yang stop-scroll. Variasikan jenis: pertanyaan, shock, pain-point, curiosity, FOMO, humor, statistik.`
    case 'cta':
      return `Generate ${v * 4} variasi CTA berbeda kekuatan: soft (persuasif tanpa tekanan), medium (actionable), strong (urgent), creative (unik memorable). Sesuaikan platform ${d.platform}.`
    case 'soft-selling':
      return `Generate ${v} caption soft selling. Formula: value/edukasi 70% → natural mention produk → gentle CTA 30%. DILARANG direct selling di awal. Buat orang trust dulu.`
    case 'hard-selling':
      return `Generate ${v} caption hard selling. Direct offer langsung, tampilkan harga${d.brandIdentity?.name ? ` dari ${d.brandIdentity.name}` : ''}, FOMO + scarcity kuat, social proof cepat, CTA sangat direct.`
    case 'viral':
      return `Generate ${v} caption dengan viral potential tinggi. Hook sangat mengejutkan atau relatable, emotional trigger kuat, buat orang mau share/comment/tag teman. Optimize untuk ${d.platform} algorithm.`
    case 'affiliate':
      return `Generate ${v} caption gaya "racun produk" affiliate. Voice seperti orang nyata yang pakai dan suka produk ini. Jujur, authentic, spesifik dengan hasil, natural recommendation, subtle CTA.`
    case 'storytelling':
      return `Generate ${v} caption storytelling. Setiap caption = kisah lengkap: setting → masalah → penemuan produk → transformasi → CTA. Terasa seperti kisah nyata, bukan iklan.`
    case 'engagement':
      return `Generate ${v} caption engagement-first. Prioritas: bikin orang komentar, share, atau tag teman. Pertanyaan open-ended, poll implisit, controversial tapi positif, call for interaction.`
    case 'description':
      return `Generate ${v} deskripsi produk berbeda angle. Setiap versi: tagline → manfaat utama → cara kerja → spesifikasi → garansi/sertifikasi → CTA. Angle berbeda: benefit-focused, science-backed, story-driven.`
    case 'marketplace':
      return `Generate ${v} set copy marketplace. Setiap set: judul SEO (max 70 char, keyword di depan) + deskripsi lengkap min 150 kata + 7 bullet benefit + 10 hashtag SEO.`
    case 'launching':
      return `Generate ${v} caption launching produk baru. Ciptakan hype, eksklusivitas, first-mover advantage, pre-order urgency. Buat orang excited menjadi yang pertama punya/coba.`
    case 'rewrite':
      return `REWRITE caption di bawah menjadi lebih powerful dan high-converting. Pertahankan pesan utama tapi tingkatkan: hook, emotional trigger, clarity, dan CTA. Buat ${v} versi improvement berbeda approach.`
    default:
      return `Generate ${v} caption high-converting yang langsung siap digunakan.`
  }
}

// ── MASTER PROMPT BUILDER ─────────────────────────────────────────────────
export function buildCaptionPrompt(product: ProductInput, config: CaptionConfig): string {
  const platform = PLATFORM_RULES[config.platform] ?? PLATFORM_RULES.instagram
  const brand    = config.brandIdentity ?? {}
  const audience = Array.isArray(config.targetAudience)
    ? config.targetAudience.join(', ')
    : config.targetAudience

  const sections: string[] = [
    // ── META ─────────────────────────────────────────────────────
    `BeeSell AI — Copywriter Profesional untuk Seller Online Indonesia`,
    `Engine: ${config.engine.toUpperCase()} | Platform: ${config.platform.toUpperCase()} | Variants: ${config.variants}`,
    '',

    // ── DIM 1: PRODUK ─────────────────────────────────────────────
    '═══ SECTION 1: INFORMASI PRODUK ═══',
    `Nama Produk:          ${product.name}`,
    product.type          ? `Jenis Produk:         ${product.type}` : '',
    product.category      ? `Kategori:             ${product.category}` : '',
    product.description   ? `Deskripsi:            ${product.description}` : '',
    product.function      ? `Fungsi Utama:         ${product.function}` : '',
    product.highlights    ? `Keunggulan:           ${product.highlights}` : '',
    product.usp           ? `USP:                  ${product.usp}` : '',
    product.benefits      ? `Benefit Utama:        ${product.benefits}` : '',
    product.problemSolved ? `Masalah Diselesaikan: ${product.problemSolved}` : '',
    product.price         ? `Harga:                ${product.price}` : '',
    product.promo         ? `Promo/Diskon:         ${product.promo}` : '',
    product.guarantee     ? `Garansi:              ${product.guarantee}` : '',
    product.packaging     ? `Packaging:            ${product.packaging}` : '',
    product.certification ? `Sertifikasi:          ${product.certification}` : '',
    '',

    // ── DIM 2: OBJECTIVE ─────────────────────────────────────────
    '═══ SECTION 2: TUJUAN MARKETING ═══',
    OBJECTIVE_PROMPTS[config.objective] ?? '',
    '',

    // ── DIM 3: PLATFORM ──────────────────────────────────────────
    '═══ SECTION 3: PLATFORM ═══',
    `Platform: ${config.platform}`,
    `Format yang benar: ${platform.format}`,
    `Aturan hashtag: ${platform.hashtag}`,
    `Batas karakter: ${platform.max} char`,
    `Tips platform: ${platform.tip}`,
    '',

    // ── DIM 4: AUDIENCE ──────────────────────────────────────────
    '═══ SECTION 4: TARGET AUDIENCE ═══',
    `Target Pembeli: ${audience || 'umum, semua kalangan'}`,
    `Sesuaikan: vocabulary, referensi, gaya bicara, dan pain point yang spesifik untuk audience ini.`,
    '',

    // ── DIM 5: TONE ──────────────────────────────────────────────
    '═══ SECTION 5: TONE OF VOICE ═══',
    `Tone: ${TONE_PROMPTS[config.tone] ?? config.tone}`,
    '',

    // ── DIM 6: STYLE ─────────────────────────────────────────────
    config.style ? `═══ SECTION 6: STYLE CAPTION ═══\n${STYLE_PROMPTS[config.style]}\n` : '',

    // ── DIM 7: HOOK ──────────────────────────────────────────────
    config.hookType ? `═══ SECTION 7: HOOK PREFERENCE ═══\n${HOOK_PROMPTS[config.hookType]}\n` : '',

    // ── DIM 8: CTA ───────────────────────────────────────────────
    '═══ SECTION 8: CTA ═══',
    config.ctaText
      ? `Gunakan CTA spesifik ini: "${config.ctaText}"`
      : config.ctaStyle === 'soft'
        ? 'CTA lembut: "Cek link bio ya", "Boleh DM kami", "Kepoin dulu di bio"'
        : config.ctaStyle === 'aggressive'
          ? 'CTA kuat: "BELI SEKARANG sebelum habis!", "ORDER HARI INI!", "Stok terbatas — jangan nyesel!"'
          : 'CTA medium: "Order sekarang di link bio", "Klik keranjang kuning", "DM untuk info lengkap"',
    '',

    // ── DIM 9: KEYWORDS ──────────────────────────────────────────
    config.keywords ? `═══ SECTION 9: KEYWORDS/SEO ═══\nSertakan kata kunci: ${config.keywords}\n` : '',

    // ── DIM 10: BAHASA ────────────────────────────────────────────
    '═══ SECTION 10: BAHASA & GAYA ═══',
    (() => {
      const map: Record<string,string> = {
        'indonesian-casual':'Bahasa Indonesia santai dan gaul. "kamu", "banget", "sih", "loh". Informal tapi genuine.',
        'indonesian-formal':'Bahasa Indonesia formal dan baku. "Anda", kalimat sempurna, tidak ada slang.',
        'mixed-english':    'Mix Indonesia-English natural seperti anak muda Indonesia kekinian.',
        'gen-z':            'Full Gen Z: "no cap", "fr fr", "bestie", "slay", "literally". Campur Indo-English.',
        'jaksel':           'Jaksel style: "which is", "literally bisa banget", "that's the thing", campur casual.',
        'full-english':     'Full English yang natural dan engaging untuk pasar internasional.',
      }
      return map[config.language] ?? map['indonesian-casual']
    })(),
    '',

    // ── DIM 11: LENGTH ────────────────────────────────────────────
    '═══ SECTION 11: PANJANG CAPTION ═══',
    (() => {
      const map: Record<string,string> = {
        short:   'SINGKAT: Max 3 kalimat + CTA. Setiap kata harus earn its place. Impact dalam sedikit kata.',
        medium:  'MEDIUM: 3-5 paragraf pendek. Hook + 2-3 poin benefit + CTA yang cukup detail.',
        long:    'PANJANG: 5-8 paragraf. Full storytelling, multiple benefit, social proof, detail garansi, CTA kuat.',
        thread:  'THREAD: Format thread/listicle dengan numbering atau bullet. Setiap poin baru baris. Mudah scan.',
        carousel:'CAROUSEL: Setiap "caption" = teks untuk 1 slide. Singkat, impactful, standalone per slide.',
      }
      return map[config.length ?? 'medium']
    })(),
    '',

    // ── DIM 12: EMOJI ─────────────────────────────────────────────
    '═══ SECTION 12: EMOJI ═══',
    (() => {
      const map: Record<string,string> = {
        none:    'ZERO emoji. Pure text, clean dan profesional.',
        minimal: '1-2 emoji per caption hanya jika sangat memperkuat pesan.',
        moderate:'2-4 emoji ditempatkan strategis untuk emphasis dan visual break.',
        heavy:   '5+ emoji per caption. Colorful, expressive, Gen Z feeling.',
      }
      return map[config.emoji]
    })(),
    '',

    // ── DIM 13: HASHTAG ───────────────────────────────────────────
    config.generateHashtag !== false
      ? `═══ SECTION 13: HASHTAG ═══\nSertakan hashtag sesuai aturan platform: ${platform.hashtag}\nMix: branded + niche + viral + SEO hashtag.\n`
      : '═══ SECTION 13: HASHTAG ═══\nTidak perlu hashtag.\n',

    // ── DIM 14: VISUAL CONTEXT ────────────────────────────────────
    config.visualContext ? buildVisualContextSection(config.visualContext) + '\n' : '',

    // ── DIM 15: EMOTION TARGET ────────────────────────────────────
    config.emotionTarget ? `═══ SECTION 15: EMOTION TARGET ═══\n${EMOTION_PROMPTS[config.emotionTarget]}\n` : '',

    // ── DIM 16: COMPETITOR STYLE ─────────────────────────────────
    config.competitorStyle ? `═══ SECTION 16: REFERENSI STYLE ═══\nAdaptasi dan benchmark dari style: ${config.competitorStyle}\nJangan copy-paste, tapi ambil approach dan formula yang efektifnya.\n` : '',

    // ── DIM 17: BRAND IDENTITY (from AI Memory) ───────────────────
    Object.keys(brand).length > 0 ? buildBrandSection(brand) + '\n' : '',

    // ── DIM 18: CONVERSION KPI ────────────────────────────────────
    config.conversionKPI ? `═══ SECTION 18: KPI KONVERSI ═══\n${KPI_PROMPTS[config.conversionKPI]}\n` : '',

    // ── Rewrite original ──────────────────────────────────────────
    config.originalCaption ? `═══ CAPTION ORIGINAL (untuk di-REWRITE) ═══\n"${config.originalCaption}"\n` : '',

    // ── ENGINE INSTRUCTION ────────────────────────────────────────
    '═══ ENGINE INSTRUCTION ═══',
    getEngineInstruction(config.engine, config),
    '',

    // ── OUTPUT FORMAT ─────────────────────────────────────────────
    '═══ OUTPUT FORMAT ═══',
    'CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no preamble.',
    'Setiap variasi HARUS berbeda dalam: angle, hook, pendekatan emosi, dan structure.',
    '',
    config.engine === 'marketplace'
      ? `{"variants": [{"title": "judul SEO max 70 char", "description": "min 150 kata", "bullets": ["benefit 1","benefit 2","benefit 3","benefit 4","benefit 5"], "hashtags": ["#tag1","#tag2"]}, ...]}`
      : config.engine === 'hook'
        ? `{"hooks": [{"text": "hook text max 2 kalimat", "type": "question|shock|pain-point|curiosity|fomo|emotional|humor|statistic", "virality_score": 8}, ...]}`
        : config.engine === 'cta'
          ? `{"ctas": [{"text": "CTA text", "style": "soft|medium|strong|creative", "best_for": "${config.platform}"}, ...]}`
          : `{"captions": ["caption lengkap variasi 1 dengan hashtag jika diminta", "caption variasi 2", "caption variasi 3"]}`,
  ]

  return sections
    .filter(s => s !== undefined && s !== null && s !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── System prompt (invariant across all calls) ────────────────────────────
export const CAPTION_SYSTEM_PROMPT = `Kamu adalah BeeSell AI — AI copywriter marketing profesional terbaik untuk seller online dan affiliate Indonesia.

PRINSIP UTAMA:
1. Output HARUS langsung bisa dipakai tanpa editing apapun
2. Setiap variasi harus benar-benar berbeda dalam angle, hook, dan emotional approach
3. Jangan pernah generik — selalu spesifik pada produk, audience, dan context
4. Pahami deep psychology: social proof, FOMO, anchoring, reciprocity, loss aversion
5. Caption terbaik terasa seperti rekomendasi teman, bukan iklan
6. STRICT: Jika ada kata yang harus dihindari, JANGAN gunakan sama sekali
7. Return ONLY valid JSON — tidak ada penjelasan atau markdown apapun

KUALITAS STANDAR: Setiap output harus setara atau melebihi kualitas copywriter senior berpengalaman 5+ tahun di digital marketing Indonesia.`