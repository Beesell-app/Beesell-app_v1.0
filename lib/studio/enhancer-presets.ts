// lib/studio/enhancer-presets.ts
// ══════════════════════════════════════════════════════════════
// PRODUCT ENHANCER AI — 20 Presets + Advanced Controls
// ══════════════════════════════════════════════════════════════
//
// Value proposition:
//   "1 Foto Produk → 20 Gaya Iklan Siap Jual"
//   Foto produk biasa → visual premium ecommerce dalam detik
//   Shopee Clean, TikTok Viral, Luxury Ads, Studio Pro, dan lainnya
//
// AI Strategy:
//   Replicate SDXL img2img
//   - promptStrength: 0.40–0.65 (preserve product, change environment)
//   - guidance_scale: 10–14 (high adherence to style prompt)
//   - Very strong negative prompt (never alter product itself)
//
// System Prompt (always prepended):
//   "Preserve product shape, logo, color, texture, packaging exactly.
//    Only enhance environment, lighting, composition, commercial appeal."

// ── Types ─────────────────────────────────────────────────────
export type PresetId =
  | 'shopee-clean'
  | 'tiktok-viral'
  | 'luxury-brand'
  | 'studio-professional'
  | 'dark-premium'
  | 'minimalist-ecommerce'
  | 'beauty-skincare'
  | 'food-commercial'
  | 'fashion-catalog'
  | 'tech-product'
  | 'jewelry-luxury'
  | 'furniture-showcase'
  | 'glass-reflection'
  | 'floating-product'
  | 'neon-ads'
  | 'outdoor-lifestyle'
  | 'premium-packaging'
  | 'before-after'
  | 'marketplace-booster'
  | 'viral-ad-creative'

export type BackgroundId =
  | 'white-clean' | 'gradient-premium' | 'luxury-black' | 'marble'
  | 'wood-table'  | 'concrete'         | 'glass'        | 'modern-studio'
  | 'office'      | 'kitchen'          | 'bedroom'      | 'nature'
  | 'cafe'        | 'custom-ai'

export type LightingId =
  | 'natural'     | 'softbox-studio'   | 'luxury-spotlight' | 'golden-hour'
  | 'bright-ecommerce' | 'cinematic'   | 'dark-moody'       | 'high-contrast'

export type AngleId =
  | 'front' | 'degree-45' | 'top-view' | 'isometric'
  | 'close-up' | 'macro'  | 'hero-shot'

export type QualityId = 'standard' | 'high' | 'ultra-hd' | 'commercial'

export type CategoryId =
  | 'marketplace' | 'social-ads' | 'premium' | 'product-type' | 'creative'

// ── Preset definition ─────────────────────────────────────────
export interface EnhancerPreset {
  id:           PresetId
  label:        string
  icon:         string
  category:     CategoryId
  desc:         string
  tagline:      string           // short selling copy shown in UI
  badge?:       string
  color:        string           // accent color per preset
  colorLt:      string           // light bg version
  prompt:       string           // main enhancement prompt
  negativeAdd?: string           // extra negative prompt for this preset
  sdxlParams: {
    promptStrength: number       // 0.40–0.65
    guidanceScale:  number       // 10–14
    numInferenceSteps: number    // 30–50
  }
  defaultBackground: BackgroundId
  defaultLighting:   LightingId
  defaultAngle:      AngleId
}

// ── System prompt (always prepended) ─────────────────────────
export const SYSTEM_PROMPT = `You are BeeSell AI Product Enhancer Engine. Transform ordinary product photos into high-converting ecommerce visuals. Rules: Preserve product shape, logo, color, texture, packaging and branding EXACTLY. Never modify the actual product. Only enhance environment, lighting, composition and commercial appeal. Create realistic professional photography. Produce marketplace-ready and advertisement-ready visuals. Avoid artifacts, extra objects, distorted labels or fake product details. Maintain sharp focus on the product.`

// ── All 20 presets ────────────────────────────────────────────
export const ENHANCER_PRESETS: Record<PresetId, EnhancerPreset> = {

  // ── MARKETPLACE ─────────────────────────────────────────────
  'shopee-clean': {
    id:'shopee-clean', label:'Shopee Clean', icon:'🛍️', category:'marketplace',
    desc:'Foto putih bersih sesuai standar marketplace Shopee & Tokopedia',
    tagline:'Standard marketplace profesional', badge:'#1 Terlaris', color:'#EE4D2D', colorLt:'#FEF2F2',
    prompt:`Transform this product into a professional Shopee marketplace photo. Pure white background. Bright ecommerce lighting. Clean drop shadows. Product perfectly centered. Sharp product details. No distractions, no props, no noise. Commercial photography quality. Marketplace ready. Professional catalog quality. High resolution.`,
    sdxlParams:{ promptStrength:0.45, guidanceScale:11, numInferenceSteps:40 },
    defaultBackground:'white-clean', defaultLighting:'bright-ecommerce', defaultAngle:'front',
  },

  'marketplace-booster': {
    id:'marketplace-booster', label:'Marketplace Booster', icon:'📈', category:'marketplace',
    desc:'Optimasi CTR marketplace — lebih menarik dari kompetitor',
    tagline:'CTR lebih tinggi dari kompetitor', badge:'High CTR', color:'#0284C7', colorLt:'#E0F2FE',
    prompt:`Transform this product photo to maximize marketplace click-through rate. Crisp white or light gradient background. Professional studio lighting with subtle product shadow. Perfect centering with smart whitespace. Sharp focus with enhanced product details and texture. Clean modern commercial style optimized for marketplace thumbnail. Increase perceived product quality.`,
    sdxlParams:{ promptStrength:0.48, guidanceScale:12, numInferenceSteps:40 },
    defaultBackground:'gradient-premium', defaultLighting:'bright-ecommerce', defaultAngle:'front',
  },

  // ── SOCIAL ADS ──────────────────────────────────────────────
  'tiktok-viral': {
    id:'tiktok-viral', label:'TikTok Viral', icon:'🎵', category:'social-ads',
    desc:'Warna lebih hidup, eye-catching, scroll-stopping untuk FYP TikTok',
    tagline:'Stop-scroll untuk FYP TikTok', badge:'🔥 Viral', color:'#010101', colorLt:'#F3F4F6',
    prompt:`Transform this product into a TikTok viral advertisement image. Vibrant saturated colors. High contrast eye-catching composition. Dynamic dramatic lighting with premium product reflections. Modern energetic ecommerce style. Bold visual hierarchy designed to stop scrolling. Trendy youthful commercial photography. Designed to maximize clicks and engagement on TikTok.`,
    sdxlParams:{ promptStrength:0.58, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'gradient-premium', defaultLighting:'high-contrast', defaultAngle:'hero-shot',
  },

  'viral-ad-creative': {
    id:'viral-ad-creative', label:'Viral Ad Creative', icon:'📢', category:'social-ads',
    desc:'Siap dijadikan materi iklan Meta Ads, TikTok Ads, Google Ads',
    tagline:'Materi iklan Meta & TikTok siap pakai', badge:'Ad Ready', color:'#7C3AED', colorLt:'#F5F3FF',
    prompt:`Transform this product into a high-converting paid advertisement creative. Attention-grabbing composition. Premium studio environment. Bold clean typography space in corners. Dynamic lighting that highlights product benefits. Professional advertising photography quality. Optimized for Meta Ads and TikTok Ads formats. Modern commercial advertising style.`,
    sdxlParams:{ promptStrength:0.56, guidanceScale:13, numInferenceSteps:45 },
    defaultBackground:'gradient-premium', defaultLighting:'cinematic', defaultAngle:'hero-shot',
  },

  'neon-ads': {
    id:'neon-ads', label:'Neon Ads', icon:'💡', category:'social-ads',
    desc:'Efek neon dan cyber style yang viral di TikTok dan Instagram',
    tagline:'Cyber neon viral TikTok & Reels', badge:'Trending', color:'#06B6D4', colorLt:'#ECFEFF',
    prompt:`Transform this product with neon cyberpunk advertisement aesthetics. Dark atmospheric background with vibrant neon glow effects. Neon light reflections on product surface. Electric blue, pink, purple neon accents. Cyberpunk commercial photography. High energy night-time advertising style. Dramatic backlit silhouette. Designed for viral social media advertisements.`,
    sdxlParams:{ promptStrength:0.62, guidanceScale:13, numInferenceSteps:45 },
    defaultBackground:'luxury-black', defaultLighting:'dark-moody', defaultAngle:'hero-shot',
  },

  // ── PREMIUM ─────────────────────────────────────────────────
  'luxury-brand': {
    id:'luxury-brand', label:'Luxury Brand', icon:'💎', category:'premium',
    desc:'Tampilan premium seperti brand mahal — Dior, Chanel, Louis Vuitton style',
    tagline:'Tampil seperti brand premium', color:'#92400E', colorLt:'#FFFBEB',
    prompt:`Transform this product into a luxury premium brand advertisement. Elegant minimal environment with premium materials. Sophisticated luxury lighting with soft highlights. Rich textures of marble, gold, or premium surfaces. High-end commercial photography quality. Sophisticated composition with generous whitespace. Luxury fashion campaign style. Aspirational premium branding.`,
    sdxlParams:{ promptStrength:0.55, guidanceScale:13, numInferenceSteps:45 },
    defaultBackground:'marble', defaultLighting:'luxury-spotlight', defaultAngle:'degree-45',
  },

  'dark-premium': {
    id:'dark-premium', label:'Dark Premium', icon:'🌑', category:'premium',
    desc:'Background gelap elegan dan eksklusif — brand high-end style',
    tagline:'Eksklusif dan high-end', color:'#1F2937', colorLt:'#F9FAFB',
    prompt:`Transform this product with dark premium brand aesthetics. Deep black or very dark background. Dramatic moody lighting with precise product spotlight. Premium reflections and subtle rim lighting. Exclusive high-end commercial photography. Sophisticated cinematic dark atmosphere. Luxury product reveal style. High contrast between product and background.`,
    sdxlParams:{ promptStrength:0.52, guidanceScale:13, numInferenceSteps:42 },
    defaultBackground:'luxury-black', defaultLighting:'luxury-spotlight', defaultAngle:'degree-45',
  },

  'glass-reflection': {
    id:'glass-reflection', label:'Glass Reflection', icon:'🪞', category:'premium',
    desc:'Efek refleksi mewah seperti iklan parfum dan produk premium',
    tagline:'Refleksi mewah ala iklan parfum', color:'#0EA5E9', colorLt:'#F0F9FF',
    prompt:`Transform this product with luxurious glass and mirror reflection effects. Perfect glass surface beneath product creating mirror reflection. Subtle luxury gradient background. Precise studio lighting reflected beautifully on glass. Premium cosmetic or fragrance advertisement style. Elegant composition with product elevated on glass pedestal. High-end luxury product photography.`,
    sdxlParams:{ promptStrength:0.54, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'gradient-premium', defaultLighting:'luxury-spotlight', defaultAngle:'degree-45',
  },

  'floating-product': {
    id:'floating-product', label:'Floating Product', icon:'🌟', category:'premium',
    desc:'Produk melayang dengan efek parallax ala iklan modern premium',
    tagline:'Modern floating product ad style', color:'#8B5CF6', colorLt:'#F5F3FF',
    prompt:`Transform this product as if floating in mid-air with premium advertising aesthetics. Product suspended in space with perfect dramatic lighting from above and sides. Subtle floating shadow below. Premium gradient or dark moody background. Dynamic modern commercial advertising style. Premium depth of field and bokeh. High-end floating product advertisement.`,
    sdxlParams:{ promptStrength:0.56, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'gradient-premium', defaultLighting:'cinematic', defaultAngle:'degree-45',
  },

  // ── STUDIO ──────────────────────────────────────────────────
  'studio-professional': {
    id:'studio-professional', label:'Studio Professional', icon:'📸', category:'marketplace',
    desc:'Simulasi studio foto profesional dengan lighting sempurna',
    tagline:'Hasil studio foto tanpa biaya sewa', color:'#374151', colorLt:'#F9FAFB',
    prompt:`Transform this product into a professional photo studio shot. Perfect softbox studio lighting from multiple angles. Clean seamless studio background. Professional product photography setup. Sharp focus with beautiful depth. Commercial studio photography quality. Clean even lighting eliminates harsh shadows. Ready for professional catalog use.`,
    sdxlParams:{ promptStrength:0.47, guidanceScale:11, numInferenceSteps:38 },
    defaultBackground:'modern-studio', defaultLighting:'softbox-studio', defaultAngle:'front',
  },

  'minimalist-ecommerce': {
    id:'minimalist-ecommerce', label:'Minimalist Ecommerce', icon:'◻️', category:'marketplace',
    desc:'Clean modern ala Apple dan brand DTC premium',
    tagline:'Apple-style product photography', color:'#6B7280', colorLt:'#F9FAFB',
    prompt:`Transform this product with Apple-inspired minimalist ecommerce photography. Ultra clean white or light grey background. Perfect minimal composition with generous whitespace. Precise studio lighting with subtle refined shadows. Premium product-focused framing. DTC brand photography style. Modern clean commercial aesthetic. Sophisticated restraint in composition.`,
    sdxlParams:{ promptStrength:0.43, guidanceScale:11, numInferenceSteps:38 },
    defaultBackground:'white-clean', defaultLighting:'softbox-studio', defaultAngle:'front',
  },

  // ── PRODUCT TYPE ────────────────────────────────────────────
  'beauty-skincare': {
    id:'beauty-skincare', label:'Beauty & Skincare', icon:'✨', category:'product-type',
    desc:'Visual premium untuk kosmetik, skincare, dan produk kecantikan',
    tagline:'Premium kosmetik dan skincare visual', badge:'Beauty', color:'#EC4899', colorLt:'#FDF2F8',
    prompt:`Transform this skincare or beauty product into a premium cosmetic campaign photo. Clean beauty aesthetic with soft luxury lighting. Fresh water droplets and dewy reflections on product surface. Natural botanical elements in soft focus background. Elegant minimal composition. Luxury cosmetic brand advertisement style. High-end beauty photography with feminine elegant colors.`,
    sdxlParams:{ promptStrength:0.52, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'marble', defaultLighting:'natural', defaultAngle:'degree-45',
  },

  'food-commercial': {
    id:'food-commercial', label:'Food Commercial', icon:'🍜', category:'product-type',
    desc:'Visual menggugah selera untuk makanan, minuman, dan snack',
    tagline:'Foto makanan menggugah selera', badge:'F&B', color:'#D97706', colorLt:'#FFFBEB',
    prompt:`Transform this food product into a commercial food advertisement photo. Appetizing food styling with fresh natural ingredients around product. Rich warm colors and beautiful texture details. Restaurant-quality food photography lighting. Professional food commercial style. Sharp mouth-watering details. Steam, freshness cues, premium plating. Makes the product look irresistibly delicious.`,
    sdxlParams:{ promptStrength:0.54, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'wood-table', defaultLighting:'golden-hour', defaultAngle:'degree-45',
  },

  'fashion-catalog': {
    id:'fashion-catalog', label:'Fashion Catalog', icon:'👗', category:'product-type',
    desc:'Seperti foto katalog brand fashion premium internasional',
    tagline:'Fashion catalog brand premium', color:'#DB2777', colorLt:'#FDF2F8',
    prompt:`Transform this fashion or clothing product into a premium fashion catalog photo. Editorial fashion photography style. Sophisticated neutral studio or lifestyle background. Premium fashion brand lighting with elegant shadows. Upscale brand catalog quality. International fashion campaign aesthetics. Product highlighted with aspirational lifestyle context. High fashion commercial photography.`,
    sdxlParams:{ promptStrength:0.52, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'modern-studio', defaultLighting:'softbox-studio', defaultAngle:'front',
  },

  'tech-product': {
    id:'tech-product', label:'Tech Product', icon:'📱', category:'product-type',
    desc:'Gadget dan elektronik terlihat premium ala Apple dan Samsung ads',
    tagline:'Gadget premium Apple/Samsung style', badge:'Gadget', color:'#3B82F6', colorLt:'#EFF6FF',
    prompt:`Transform this tech or electronic product into a premium technology advertisement. Sleek dark or gradient background. Precise dramatic lighting highlighting product design. Sharp metallic and glass reflections. Premium tech brand commercial photography. Apple or Samsung advertisement quality. Clean minimal composition emphasizing product form and features. Professional product photography for technology category.`,
    sdxlParams:{ promptStrength:0.50, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'luxury-black', defaultLighting:'high-contrast', defaultAngle:'degree-45',
  },

  'jewelry-luxury': {
    id:'jewelry-luxury', label:'Jewelry Luxury', icon:'💍', category:'product-type',
    desc:'Perhiasan, aksesoris, jam tangan — tampilan high-end jeweler',
    tagline:'High-end jewelry photography', color:'#B45309', colorLt:'#FFFBEB',
    prompt:`Transform this jewelry or accessories product into a luxury jeweler advertisement photo. Premium black velvet or marble display surface. Precise spotlight lighting enhancing gemstone sparkle and metal gleam. Luxury jewelry store photography quality. High-end watch or jewelry brand campaign style. Perfect macro-level detail and clarity. Aspirational luxury commercial photography.`,
    sdxlParams:{ promptStrength:0.48, guidanceScale:13, numInferenceSteps:45 },
    defaultBackground:'marble', defaultLighting:'luxury-spotlight', defaultAngle:'close-up',
  },

  'furniture-showcase': {
    id:'furniture-showcase', label:'Furniture Showcase', icon:'🛋️', category:'product-type',
    desc:'Interior dan home decor terlihat premium ala IKEA dan brand premium',
    tagline:'Home decor dan furniture premium', color:'#059669', colorLt:'#ECFDF5',
    prompt:`Transform this furniture or home decor product into a premium interior showcase photo. Styled interior setting with complementary premium home accessories. Professional interior photography lighting. Warm inviting ambient environment. IKEA or premium furniture brand catalog quality. Beautiful room context that enhances product desirability. Professional home decor commercial photography.`,
    sdxlParams:{ promptStrength:0.56, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'bedroom', defaultLighting:'natural', defaultAngle:'degree-45',
  },

  // ── CREATIVE ────────────────────────────────────────────────
  'outdoor-lifestyle': {
    id:'outdoor-lifestyle', label:'Outdoor Lifestyle', icon:'🌿', category:'creative',
    desc:'Produk dalam situasi penggunaan nyata yang relatable dan aspirasional',
    tagline:'Lifestyle context yang aspirasional', color:'#10B981', colorLt:'#ECFDF5',
    prompt:`Transform this product into an outdoor lifestyle advertisement photo. Natural environment context showing product in real-world aspirational use. Beautiful natural lighting, golden hour atmosphere. Lifestyle photography showing product benefit in action. People-centric aspirational context. Relatable authentic lifestyle commercial photography. Nature or urban lifestyle background enhancing product story.`,
    sdxlParams:{ promptStrength:0.60, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'nature', defaultLighting:'golden-hour', defaultAngle:'hero-shot',
  },

  'premium-packaging': {
    id:'premium-packaging', label:'Premium Packaging', icon:'📦', category:'creative',
    desc:'Fokus pada kemasan dan branding — perfect untuk gifting dan unboxing',
    tagline:'Packaging premium siap gifting', color:'#C2410C', colorLt:'#FFF7ED',
    prompt:`Transform this product with focus on premium packaging and brand presentation. Elegant gift-ready product presentation. Premium unboxing aesthetic with tissue paper, ribbon, or premium elements. Luxury retail display quality. High-end packaging photography. Brand storytelling through beautiful product presentation. Perfect for gifting and premium brand positioning.`,
    sdxlParams:{ promptStrength:0.54, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'marble', defaultLighting:'softbox-studio', defaultAngle:'degree-45',
  },

  'before-after': {
    id:'before-after', label:'Before-After Comparison', icon:'🔄', category:'creative',
    desc:'Visual perbandingan transformasi produk untuk konten yang lebih convincing',
    tagline:'Konten transformasi yang meyakinkan', badge:'High CVR', color:'#7C3AED', colorLt:'#F5F3FF',
    prompt:`Transform this product into a premium professional ecommerce version for a before-after comparison creative. Create the enhanced premium version showing significant quality improvement. Professional studio lighting. Perfect composition. Commercial grade quality. The enhanced version should clearly look dramatically more professional and premium than a typical amateur product photo.`,
    sdxlParams:{ promptStrength:0.50, guidanceScale:12, numInferenceSteps:42 },
    defaultBackground:'white-clean', defaultLighting:'softbox-studio', defaultAngle:'front',
  },
}

// ── Category metadata ─────────────────────────────────────────
export const CATEGORIES: Record<CategoryId, { label:string; icon:string; desc:string }> = {
  marketplace:   { label:'Marketplace',   icon:'🛍️', desc:'Shopee, Tokopedia, Lazada' },
  'social-ads':  { label:'Social & Ads',  icon:'📢', desc:'TikTok, Instagram, Meta Ads' },
  premium:       { label:'Premium',       icon:'💎', desc:'Luxury & high-end brand style' },
  'product-type':{ label:'Per Produk',    icon:'🎯', desc:'Sesuai jenis produk kamu' },
  creative:      { label:'Creative',      icon:'✨', desc:'Lifestyle & creative concepts' },
}

// ── Popular presets for quick access ──────────────────────────
export const POPULAR_PRESETS: PresetId[] = [
  'shopee-clean','tiktok-viral','beauty-skincare','luxury-brand',
  'marketplace-booster','dark-premium','food-commercial','floating-product',
]

// ── Advanced controls data ─────────────────────────────────────
export const BACKGROUNDS: Record<BackgroundId, { label:string; icon:string; prompt:string }> = {
  'white-clean':      { label:'White Clean',       icon:'⬜', prompt:'pure white seamless background' },
  'gradient-premium': { label:'Gradient Premium',  icon:'🌅', prompt:'soft premium gradient background from light to slightly darker tone' },
  'luxury-black':     { label:'Luxury Black',      icon:'⬛', prompt:'deep black luxury background' },
  'marble':           { label:'Marble',            icon:'🪨', prompt:'elegant white and grey marble surface background' },
  'wood-table':       { label:'Wood Table',        icon:'🪵', prompt:'premium natural wood surface background' },
  'concrete':         { label:'Concrete',          icon:'🏗️', prompt:'modern concrete minimalist background' },
  'glass':            { label:'Glass Surface',     icon:'🪟', prompt:'reflective glass surface with subtle reflections' },
  'modern-studio':    { label:'Modern Studio',     icon:'🎬', prompt:'modern professional photography studio background' },
  'office':           { label:'Office',            icon:'🏢', prompt:'clean modern office workspace context' },
  'kitchen':          { label:'Kitchen',           icon:'🍳', prompt:'premium kitchen countertop context' },
  'bedroom':          { label:'Bedroom',           icon:'🛏️', prompt:'styled premium bedroom interior context' },
  'nature':           { label:'Nature',            icon:'🌿', prompt:'fresh natural outdoor environment' },
  'cafe':             { label:'Cafe',              icon:'☕', prompt:'cozy premium cafe setting' },
  'custom-ai':        { label:'Custom AI',         icon:'🤖', prompt:'AI-selected optimal background for product type' },
}

export const LIGHTINGS: Record<LightingId, { label:string; icon:string; prompt:string }> = {
  'natural':          { label:'Natural Light',     icon:'☀️', prompt:'beautiful natural daylight soft window lighting' },
  'softbox-studio':   { label:'Softbox Studio',    icon:'💡', prompt:'professional softbox studio lighting, even and flattering' },
  'luxury-spotlight': { label:'Luxury Spotlight',  icon:'🔦', prompt:'dramatic luxury spotlight lighting from above, premium brand style' },
  'golden-hour':      { label:'Golden Hour',       icon:'🌅', prompt:'warm golden hour sunlight, lifestyle warmth' },
  'bright-ecommerce': { label:'Bright Ecommerce',  icon:'🌟', prompt:'bright clean ecommerce lighting, no harsh shadows' },
  'cinematic':        { label:'Cinematic',         icon:'🎬', prompt:'dramatic cinematic movie poster lighting' },
  'dark-moody':       { label:'Dark Moody',        icon:'🌑', prompt:'dark atmospheric moody lighting with precise accent highlights' },
  'high-contrast':    { label:'High Contrast',     icon:'⚡', prompt:'high contrast dramatic lighting for maximum visual impact' },
}

export const ANGLES: Record<AngleId, { label:string; icon:string; prompt:string }> = {
  'front':      { label:'Front',      icon:'↕️', prompt:'straight front-facing product photography angle' },
  'degree-45':  { label:'45°',        icon:'↗️', prompt:'elegant 45-degree three-quarter angle view' },
  'top-view':   { label:'Top View',   icon:'⬇️', prompt:'flat lay top-down aerial product view' },
  'isometric':  { label:'Isometric',  icon:'📐', prompt:'isometric product display angle' },
  'close-up':   { label:'Close Up',   icon:'🔍', prompt:'detail-focused close-up product photography' },
  'macro':      { label:'Macro',      icon:'🔬', prompt:'extreme macro photography revealing fine product details' },
  'hero-shot':  { label:'Hero Shot',  icon:'🦸', prompt:'dramatic hero shot product presentation angle' },
}

export const QUALITIES: Record<QualityId, { label:string; icon:string; steps:number; desc:string }> = {
  'standard':   { label:'Standard',        icon:'⚡', steps:30, desc:'Cepat · preview' },
  'high':       { label:'High',            icon:'✨', steps:40, desc:'Seimbang · rekomendasi' },
  'ultra-hd':   { label:'Ultra HD',        icon:'💎', steps:50, desc:'Detail tinggi · lambat' },
  'commercial': { label:'Commercial Grade',icon:'🏆', steps:50, desc:'Kualitas iklan profesional' },
}

// ── Prompt builder ─────────────────────────────────────────────
export function buildEnhancerPrompt(params: {
  preset:     EnhancerPreset
  background: BackgroundId
  lighting:   LightingId
  angle:      AngleId
  quality:    QualityId
  custom?:    string
}): string {
  const bg  = BACKGROUNDS[params.background]
  const lt  = LIGHTINGS[params.lighting]
  const ang = ANGLES[params.angle]

  const basePrompt = params.custom?.trim()
    ? `${params.preset.prompt}\n\nAdditional: ${params.custom}`
    : params.preset.prompt

  return [
    basePrompt,
    `Background Style: ${bg.prompt}.`,
    `Lighting Style: ${lt.prompt}.`,
    `Camera Angle: ${ang.prompt}.`,
    `Quality: ${QUALITIES[params.quality].label} commercial photography.`,
    `Preserve original product exactly. Do not modify branding, text, or product shape.`,
    `Professional ecommerce photography. Hyperrealistic. 8K quality.`,
  ].join(' ')
}

export function buildNegativePrompt(presetId: PresetId): string {
  const base = [
    'blurry', 'low quality', 'pixelated', 'distorted product', 'changed logo',
    'altered text', 'modified shape', 'wrong color', 'extra objects', 'watermark',
    'person', 'human', 'hands', 'text overlay', 'fake details', 'artifacts',
    'deformed', 'ugly', 'bad anatomy', 'cartoon', 'anime', 'illustrated',
    'painting', 'drawing', 'unrealistic', 'oversaturated colors on product',
    'changed product branding', 'altered packaging', 'different product',
  ].join(', ')

  // Preset-specific negative additions
  const extras: Partial<Record<PresetId, string>> = {
    'shopee-clean':     'colored background, dark background, props, people',
    'minimalist-ecommerce': 'cluttered, noisy, busy background, props, people',
    'beauty-skincare':  'harsh lighting, unflattering shadows, clinical look',
    'food-commercial':  'unappetizing, cold, unappealing, plastic look',
    'neon-ads':         'natural daylight, white background, boring, flat',
  }

  return extras[presetId] ? `${base}, ${extras[presetId]}` : base
}

// ── SDXL params per preset (already embedded in preset, but utility) ─
export function getSDXLParams(preset: EnhancerPreset, quality: QualityId) {
  return {
    promptStrength:     preset.sdxlParams.promptStrength,
    guidanceScale:      preset.sdxlParams.guidanceScale,
    numInferenceSteps:  QUALITIES[quality].steps,
  }
}