// lib/studio/packshot-presets.ts
// Semua preset AI Packshot Generator — prompt-engineered untuk hasil terbaik

export interface PackshotPreset {
  id:            string
  label:         string
  category:      'studio' | 'float' | 'cosmetic' | 'marketplace' | 'lifestyle' | 'premium'
  icon:          string
  desc:          string
  tags:          string[]
  bestFor:       string[]
  // AI prompt components
  prompt:        string          // positive prompt
  negativePrompt:string          // negative prompt
  // Visual config
  bgColor:       string          // hex — used for padding before AI
  lightingStyle: string
  shadowStyle:   'none' | 'soft' | 'hard' | 'reflection' | 'floating'
  // Output hints
  outputTip:     string
  popular?:      boolean
}

// ── NEGATIVE PROMPT (shared base) ────────────────────────────
export const BASE_NEGATIVE =
  'text, watermark, logo, label, blur, noise, grain, low quality, artifact, distortion, ' +
  'deformed, ugly, out of frame, cropped, person, human, hand, face, arm, body, ' +
  'bad anatomy, extra objects, messy background, busy background, cluttered'

// ── ALL PRESETS ───────────────────────────────────────────────
export const PACKSHOT_PRESETS: PackshotPreset[] = [

  // ══ STUDIO ══════════════════════════════════════════════════

  {
    id: 'white-studio',
    label: 'White Studio',
    category: 'studio',
    icon: '⬜',
    desc: 'Latar putih bersih khas foto studio profesional. Standar marketplace internasional.',
    tags: ['Clean', 'Minimal', 'Professional'],
    bestFor: ['Semua produk', 'Shopee', 'Tokopedia', 'Lazada', 'Foto utama marketplace'],
    prompt: 'product packshot photography, pure white seamless studio background, soft even lighting, professional product photography, clean white backdrop, subtle soft shadow underneath, high-end commercial photography, crisp sharp focus, perfect exposure, studio lighting setup, 85mm lens',
    negativePrompt: BASE_NEGATIVE + ', colored background, gradient, pattern, texture, harsh shadow',
    bgColor: '#FFFFFF',
    lightingStyle: 'soft-studio',
    shadowStyle: 'soft',
    outputTip: 'Ideal untuk foto utama marketplace — wajib background putih di Shopee & Tokopedia',
    popular: true,
  },

  {
    id: 'premium-black',
    label: 'Premium Black',
    category: 'studio',
    icon: '⬛',
    desc: 'Latar hitam mewah — tampilan premium, eksklusif, dan cocok untuk produk luxury.',
    tags: ['Luxury', 'Premium', 'Dark', 'Elegant'],
    bestFor: ['Parfum', 'Jam tangan', 'Perhiasan', 'Skincare premium', 'Produk luxury'],
    prompt: 'product packshot photography, deep black seamless background, dramatic studio lighting, luxury product photography, dark elegant backdrop, rim lighting effect, glossy reflective surface, high-end commercial shoot, moody dramatic atmosphere, chiaroscuro lighting, professional jewelry photography style',
    negativePrompt: BASE_NEGATIVE + ', white background, bright background, overexposed, flat lighting',
    bgColor: '#0A0A0A',
    lightingStyle: 'dramatic-rim',
    shadowStyle: 'hard',
    outputTip: 'Terbaik untuk produk premium — beri kesan mewah dan eksklusif',
    popular: true,
  },

  {
    id: 'soft-shadow',
    label: 'Soft Shadow',
    category: 'studio',
    icon: '🌫️',
    desc: 'Bayangan lembut natural di bawah produk — terlihat realistis dan profesional.',
    tags: ['Natural', 'Realistic', 'Clean'],
    bestFor: ['Fashion', 'Aksesori', 'Kosmetik', 'Makanan & minuman'],
    prompt: 'product photography studio shot, clean white background, beautiful natural drop shadow, soft diffused lighting from above, product placed on white surface, gentle realistic shadow, professional commercial photography, clean and minimal composition, sharp focus on product',
    negativePrompt: BASE_NEGATIVE + ', no shadow, floating, harsh lighting, overexposed',
    bgColor: '#F8F8F8',
    lightingStyle: 'overhead-soft',
    shadowStyle: 'soft',
    outputTip: 'Bayangan natural membuat produk terlihat nyata dan dapat dipercaya',
  },

  {
    id: 'gray-studio',
    label: 'Gray Studio',
    category: 'studio',
    icon: '🩶',
    desc: 'Background abu-abu netral — elegan dan tidak menyilaukan, tampilan modern.',
    tags: ['Modern', 'Neutral', 'Elegant'],
    bestFor: ['Elektronik', 'Gadget', 'Produk teknologi', 'Brand modern'],
    prompt: 'product packshot on light gray seamless background, professional studio photography, neutral gray backdrop, balanced even lighting, clean modern commercial photography, sharp product focus, minimal aesthetic, contemporary product styling',
    negativePrompt: BASE_NEGATIVE + ', white background, dark background, colorful',
    bgColor: '#E8E8E8',
    lightingStyle: 'balanced-studio',
    shadowStyle: 'soft',
    outputTip: 'Cocok untuk brand teknologi dan produk modern',
  },

  // ══ FLOATING ════════════════════════════════════════════════

  {
    id: 'floating-product',
    label: 'Floating Product',
    category: 'float',
    icon: '🌟',
    desc: 'Produk melayang di udara dengan bayangan lembut di bawah — efek dramatis yang menarik perhatian.',
    tags: ['Dynamic', 'Eye-catching', 'Modern', 'Creative'],
    bestFor: ['TikTok ads', 'Instagram', 'Konten viral', 'Brand muda dan energik'],
    prompt: 'product levitation photography, product floating in mid-air, clean white background, beautiful soft shadow directly below on white surface, product defying gravity, creative commercial photography, fashion product photography, dramatic lighting, product suspended in air, levitating product shot',
    negativePrompt: BASE_NEGATIVE + ', surface contact, on table, flat, boring, dull',
    bgColor: '#FFFFFF',
    lightingStyle: 'dramatic-float',
    shadowStyle: 'floating',
    outputTip: 'Sangat efektif untuk konten media sosial dan iklan TikTok/Instagram',
    popular: true,
  },

  {
    id: 'floating-dark',
    label: 'Floating Dark',
    category: 'float',
    icon: '✨',
    desc: 'Produk melayang di latar gelap dengan efek cahaya dramatis — kesan luxury dan premium.',
    tags: ['Luxury', 'Drama', 'Moody', 'Premium'],
    bestFor: ['Parfum', 'Skincare premium', 'Suplemen', 'Produk wellness'],
    prompt: 'product levitation photography, product floating in dark background, dramatic studio lighting with rim light, product suspended in darkness, glowing product edges, moody luxury commercial photography, dark dramatic backdrop, cinematic lighting, floating product with atmospheric mist',
    negativePrompt: BASE_NEGATIVE + ', bright background, white background, flat lighting',
    bgColor: '#0D0D0D',
    lightingStyle: 'rim-dark',
    shadowStyle: 'floating',
    outputTip: 'Dramatis dan premium — cocok untuk campaign iklan berbayar',
  },

  {
    id: 'splash-dynamic',
    label: 'Dynamic Splash',
    category: 'float',
    icon: '💦',
    desc: 'Produk dengan efek percikan air atau elemen dinamis — terasa segar dan hidup.',
    tags: ['Dynamic', 'Fresh', 'Energetic', 'Creative'],
    bestFor: ['Minuman', 'Skincare', 'Parfum', 'Produk segar & alami'],
    prompt: 'product photography with dynamic water splash effect, product surrounded by water droplets, high-speed photography style, clean white or blue background, water splash frozen in motion, fresh and dynamic energy, commercial beverage photography, crisp and sharp details, splash of water around product',
    negativePrompt: BASE_NEGATIVE + ', static, boring, no water, dry',
    bgColor: '#EFF8FF',
    lightingStyle: 'bright-dynamic',
    shadowStyle: 'none',
    outputTip: 'Sangat viral untuk produk minuman dan skincare berbasis air',
  },

  // ══ COSMETIC ════════════════════════════════════════════════

  {
    id: 'cosmetic-studio',
    label: 'Cosmetic Studio',
    category: 'cosmetic',
    icon: '💄',
    desc: 'Setting khusus untuk kosmetik — marble, gold accent, rose petals, soft feminine aesthetic.',
    tags: ['Beauty', 'Feminine', 'Elegant', 'Premium'],
    bestFor: ['Lipstik', 'Foundation', 'Serum', 'Parfum', 'Skincare perempuan'],
    prompt: 'luxury cosmetic product photography, elegant white marble surface, scattered rose petals around product, gold makeup brushes, soft natural light from window, feminine beauty photography, pastel pink and white tones, high-end beauty brand photography, styled beauty flat lay, perfume bottle photography',
    negativePrompt: BASE_NEGATIVE + ', masculine, dark, gritty, plain background, no styling',
    bgColor: '#FFF5F7',
    lightingStyle: 'natural-window',
    shadowStyle: 'soft',
    outputTip: 'Terbaik untuk produk kecantikan wanita — terlihat mewah dan elegan',
    popular: true,
  },

  {
    id: 'korean-beauty',
    label: 'Korean Beauty',
    category: 'cosmetic',
    icon: '🌸',
    desc: 'Estetika K-beauty — warna pastel, bunga, clean aesthetic ala brand Korea.',
    tags: ['Korean', 'Pastel', 'Clean', 'Aesthetic', 'Minimalist'],
    bestFor: ['Skincare', 'Sheet mask', 'Cushion', 'Toner', 'Produk K-beauty'],
    prompt: 'korean beauty product photography, soft pastel background in pink or peach, cherry blossom petals, clean minimalist korean aesthetic, soft diffused natural lighting, clean beauty photography, fresh and pure visual style, korean cosmetic product styling, delicate feminine arrangement, GRWM aesthetic',
    negativePrompt: BASE_NEGATIVE + ', dark, gloomy, western style, heavy makeup style',
    bgColor: '#FFF0F5',
    lightingStyle: 'soft-natural',
    shadowStyle: 'soft',
    outputTip: 'Cocok untuk produk skincare dan brand dengan target konsumen muda',
  },

  {
    id: 'natural-organic',
    label: 'Natural Organic',
    category: 'cosmetic',
    icon: '🌿',
    desc: 'Nuansa alami organik — kayu, daun, bunga kering, earthy tones. Cocok untuk brand natural.',
    tags: ['Natural', 'Organic', 'Earthy', 'Eco-friendly'],
    bestFor: ['Sabun alami', 'Essential oil', 'Herbal', 'Skincare organik', 'Produk halal'],
    prompt: 'organic natural product photography, wooden surface with natural props, green leaves and herbs, linen cloth texture, dried flowers, earth tones and nature elements, natural lighting, eco-friendly brand photography, rustic elegant styling, botanical product photography, artisan natural beauty product shot',
    negativePrompt: BASE_NEGATIVE + ', synthetic, plastic look, artificial, neon colors, dark background',
    bgColor: '#F5F0E8',
    lightingStyle: 'natural-warm',
    shadowStyle: 'soft',
    outputTip: 'Memperkuat brand positioning natural, halal, dan ramah lingkungan',
  },

  // ══ MARKETPLACE ════════════════════════════════════════════

  {
    id: 'shopee-style',
    label: 'Shopee Ready',
    category: 'marketplace',
    icon: '🛍️',
    desc: 'Optimized untuk halaman produk Shopee — bright, clean, memenuhi standar gambar utama.',
    tags: ['Shopee', 'Marketplace', 'Bright', 'Clean'],
    bestFor: ['Foto utama Shopee', 'Semua kategori produk', 'Seller pemula'],
    prompt: 'e-commerce product photography optimized for online marketplace, pure white clean background, product centered in frame, bright even lighting, professional product photo for online store, sharp focus, accurate color representation, clean commercial photography standard, marketplace main image style',
    negativePrompt: BASE_NEGATIVE + ', dark, moody, artistic, off-center product, lifestyle, model',
    bgColor: '#FFFFFF',
    lightingStyle: 'bright-even',
    shadowStyle: 'soft',
    outputTip: 'Memenuhi standar gambar utama Shopee — siap upload langsung',
    popular: true,
  },

  {
    id: 'tokopedia-style',
    label: 'Tokopedia Ready',
    category: 'marketplace',
    icon: '🛒',
    desc: 'Style foto produk Tokopedia — putih bersih, detail tajam, tampilan terpercaya.',
    tags: ['Tokopedia', 'Marketplace', 'Professional', 'Trustworthy'],
    bestFor: ['Foto utama Tokopedia', 'Elektronik', 'Fashion', 'Rumah tangga'],
    prompt: 'professional product photography for e-commerce platform, clean white background, product perfectly centered, balanced studio lighting, sharp detail photography, trustworthy commercial product photo, accurate color reproduction, e-commerce standard photography Indonesia marketplace style',
    negativePrompt: BASE_NEGATIVE + ', artistic, moody, lifestyle photo, low resolution',
    bgColor: '#FFFFFF',
    lightingStyle: 'balanced-bright',
    shadowStyle: 'soft',
    outputTip: 'Tampilan terpercaya yang meningkatkan conversion rate di Tokopedia',
  },

  {
    id: 'infographic-style',
    label: 'Infographic Style',
    category: 'marketplace',
    icon: '📊',
    desc: 'Foto produk dengan ruang untuk text overlay — benefit, harga, fitur produk.',
    tags: ['Informative', 'Marketing', 'Text Space', 'Promotional'],
    bestFor: ['Foto promosi', 'Highlight benefit', 'Before-after', 'Educational content'],
    prompt: 'product photography with clean empty space for text overlay, product positioned to one side or bottom third, clean gradient or solid background with ample negative space, commercial product photography layout for infographic, professional marketing material style, balanced composition with text room',
    negativePrompt: BASE_NEGATIVE + ', centered product, full frame product, no empty space, busy composition',
    bgColor: '#F0F4FF',
    lightingStyle: 'clean-bright',
    shadowStyle: 'soft',
    outputTip: 'Sisakan ruang kosong di sisi kiri/kanan untuk menambahkan teks benefit produk',
  },

  // ══ LIFESTYLE ════════════════════════════════════════════

  {
    id: 'cafe-lifestyle',
    label: 'Cafe Lifestyle',
    category: 'lifestyle',
    icon: '☕',
    desc: 'Setting cafe aesthetic — meja kayu, kopi, tanaman kecil, cahaya hangat. Cocok untuk food & beverage.',
    tags: ['Lifestyle', 'Warm', 'Cozy', 'Aesthetic'],
    bestFor: ['Kopi & minuman', 'Snack', 'Suplemen', 'Produk wellness'],
    prompt: 'lifestyle product photography in cozy cafe setting, wooden table surface, coffee cup nearby, small plant, warm natural window light, golden hour warm tones, Instagram aesthetic lifestyle shot, warm hygge atmosphere, artisan coffee shop vibes, cozy morning aesthetic product placement',
    negativePrompt: BASE_NEGATIVE + ', cold lighting, dark, studio look, white background, model',
    bgColor: '#FFF8F0',
    lightingStyle: 'warm-natural',
    shadowStyle: 'soft',
    outputTip: 'Konten lifestyle yang authentic lebih engage di TikTok dan Instagram',
  },

  {
    id: 'marble-luxury',
    label: 'Marble Studio',
    category: 'lifestyle',
    icon: '🪨',
    desc: 'Permukaan marble putih mewah — tampilan high-end dan premium untuk brand kelas atas.',
    tags: ['Luxury', 'Marble', 'Premium', 'Elegant'],
    bestFor: ['Skincare premium', 'Perhiasan', 'Produk luxury', 'Gift set'],
    prompt: 'luxury product photography on white marble surface, elegant marble texture background, high-end commercial photography, luxury brand aesthetic, sophisticated product styling, natural marble veining, soft directional studio light, premium lifestyle photography, upscale product presentation',
    negativePrompt: BASE_NEGATIVE + ', cheap look, plastic surface, busy background, low end',
    bgColor: '#F9F9F7',
    lightingStyle: 'directional-soft',
    shadowStyle: 'soft',
    outputTip: 'Marble surface meningkatkan persepsi nilai produk secara signifikan',
    popular: true,
  },

  // ══ PREMIUM SPECIAL ════════════════════════════════════════

  {
    id: 'reflection-floor',
    label: 'Reflection Floor',
    category: 'premium',
    icon: '🪞',
    desc: 'Pantulan produk di permukaan mengkilap — efek premium yang sering dipakai brand internasional.',
    tags: ['Reflection', 'Premium', 'Glossy', 'Professional'],
    bestFor: ['Parfum', 'Kosmetik premium', 'Elektronik', 'Brand premium'],
    prompt: 'luxury product photography with mirror reflection, product placed on glossy reflective surface, perfect mirror reflection of product below, dark or white background, dramatic studio lighting, high-end commercial photography, glass floor reflection effect, luxury brand packshot, professional perfume photography style',
    negativePrompt: BASE_NEGATIVE + ', no reflection, matte surface, rough texture, muddy',
    bgColor: '#F0F0F0',
    lightingStyle: 'dramatic-studio',
    shadowStyle: 'reflection',
    outputTip: 'Efek refleksi yang dipercaya meningkatkan click-through rate iklan berbayar',
  },

  {
    id: 'gradient-bg',
    label: 'Gradient Pastel',
    category: 'premium',
    icon: '🌈',
    desc: 'Background gradient pastel lembut — modern, fresh, cocok untuk brand muda dan lifestyle.',
    tags: ['Gradient', 'Modern', 'Fresh', 'Trendy'],
    bestFor: ['Produk beauty', 'Fashion accessories', 'Produk anak muda', 'Gen-Z market'],
    prompt: 'product photography on soft pastel gradient background, smooth color gradient from peach to lavender or pink to blue, clean commercial product photography, modern trendy aesthetic, Instagram worthy product shot, fresh and youthful brand photography, smooth gradient backdrop, contemporary commercial photography',
    negativePrompt: BASE_NEGATIVE + ', solid plain background, white background, old fashioned, harsh',
    bgColor: '#FFF0FA',
    lightingStyle: 'soft-even',
    shadowStyle: 'soft',
    outputTip: 'Sangat efektif untuk target pasar Gen Z dan Milenial di Instagram & TikTok',
  },

]

// ── Helpers ───────────────────────────────────────────────────
export const PRESET_MAP = Object.fromEntries(PACKSHOT_PRESETS.map(p => [p.id, p]))

export const CATEGORIES = {
  studio:     { label: 'Studio',        icon: '🏢', desc: 'Foto studio profesional' },
  float:      { label: 'Floating',      icon: '🌟', desc: 'Produk melayang dramatis' },
  cosmetic:   { label: 'Kosmetik',      icon: '💄', desc: 'Beauty & cosmetic special' },
  marketplace:{ label: 'Marketplace',   icon: '🛍️', desc: 'Siap upload marketplace' },
  lifestyle:  { label: 'Lifestyle',     icon: '☕', desc: 'Gaya hidup dan aesthetic' },
  premium:    { label: 'Premium',       icon: '💎', desc: 'Efek khusus premium' },
} as const

export const POPULAR_PRESETS = PACKSHOT_PRESETS.filter(p => p.popular).map(p => p.id)

export function getPresetsByCategory(cat: keyof typeof CATEGORIES) {
  return PACKSHOT_PRESETS.filter(p => p.category === cat)
}