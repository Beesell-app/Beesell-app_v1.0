// apps/web-app/lib/ai/image/prompt-builder.ts
// ── AI Image Prompt Builder System ────────────────────────────
// Builds ultra-detailed, cinematic, commercial-quality prompts
// from structured user inputs → Replicate SDXL / Stability AI

export interface ImageGenerationInput {
  // Core
  productName:    string
  productDesc?:   string

  // 12 dimension selectors
  category?:      string   // fashion|skincare|food|electronics|...
  contentType?:   string   // product-ads|marketplace|ugc|before-after|...
  visualStyle?:   string   // realistic|hyper-realistic|luxury|minimalist|...
  productType?:   string   // physical|packaging|fashion-wearable|...
  targetAudience?:string   // gen-z|millennial|luxury|ibu-rumah-tangga|...
  platform?:      string   // instagram|tiktok|shopee|tokopedia|...
  bgStyle?:       string   // studio-white|marble|cafe|outdoor|...
  colorTone?:     string   // warm|pastel|gold-luxury|black-premium|...
  moodTone?:      string   // elegant|energetic|calm|trustworthy|...
  lightingStyle?: string   // soft|studio|golden-hour|dramatic|...
  composition?:   string   // flat-lay|hero-shot|close-up|floating|...
  cameraStyle?:   string   // dslr|sony-a7r|iphone|85mm|macro|...

  // Output
  ratio?:         string   // 1:1 | 4:5 | 9:16 | 16:9 | 4:3
  count?:         number   // 1-4

  // Upload
  uploadedImageUrl?: string  // user's product image for img2img

  // Overrides
  customPrompt?:  string
  negativePrompt?:string
}

// ── Lookup maps ────────────────────────────────────────────────
const CATEGORY_PROMPT: Record<string,string> = {
  fashion:     'fashion apparel product, clothing, stylish garment',
  skincare:    'skincare beauty product, cosmetic, serum bottle, cream jar',
  food:        'food product, culinary, delicious meal, food packaging',
  minuman:     'beverage drink product, refreshing liquid, bottle packaging',
  electronics: 'electronic gadget product, tech device, sleek design',
  furniture:   'furniture home decor product, interior design piece',
  otomotif:    'automotive product, vehicle accessory, mechanical part',
  perhiasan:   'jewelry accessory product, gold silver gemstone',
  gadget:      'smartphone gadget tech product, minimalist design',
  sepatu:      'footwear shoe product, sneaker boots lifestyle',
  tas:         'bag handbag product, leather canvas luxury accessory',
  jam:         'watch timepiece product, luxury wristwatch detail',
}

const CONTENT_TYPE_PROMPT: Record<string,string> = {
  'product-ads':        'commercial product advertisement, marketing campaign visual, conversion-optimized',
  'marketplace':        'marketplace product thumbnail, e-commerce optimized, clean commercial',
  'tiktok-shop':        'TikTok Shop product visual, viral content style, engaging social commerce',
  'shopee':             'Shopee marketplace product image, SEO optimized, clean white background',
  'instagram-feed':     'Instagram feed aesthetic, editorial photography style, aspirational lifestyle',
  'ugc':                'user-generated content style, authentic candid feel, real person testimonial',
  'before-after':       'split comparison before after transformation, dramatic change visualization',
  'promo-banner':       'promotional banner design, sale discount visual, urgent CTA oriented',
  'branding-campaign':  'brand identity campaign visual, cohesive brand story, premium positioning',
  'cinematic-shot':     'cinematic product photography, film-quality visual, dramatic storytelling',
  'luxury-branding':    'luxury brand campaign, ultra premium visual identity, high-end aesthetic',
  'flash-sale':         'flash sale urgency visual, countdown promotion, bold discount graphic',
  'soft-selling':       'soft sell lifestyle product image, aspirational subtle sell, emotional connection',
  'hard-selling':       'hard sell direct response visual, bold CTA, price-focused promotional',
}

const VISUAL_STYLE_PROMPT: Record<string,string> = {
  'realistic':          'photorealistic, ultra realistic, true-to-life photography, 8K quality',
  'hyper-realistic':    'hyper-realistic photograph, ultra detailed, indistinguishable from real photo, 8K HDR',
  'minimalist':         'minimalist clean design, negative space, simple elegant composition, Scandinavian aesthetic',
  'luxury':             'luxury premium photography, high-end editorial, sophisticated elegance, aspirational',
  'premium':            'premium quality photography, professional commercial, polished perfection',
  'clean-studio':       'clean studio photography, professional setup, controlled lighting, commercial grade',
  'korean-style':       'Korean aesthetic photography, soft pastel, clean dewy, K-beauty inspired',
  'japanese':           'Japanese wabi-sabi aesthetic, minimalist zen, natural organic composition',
  'dark-moody':         'dark moody photography, dramatic shadows, high contrast, mysterious atmosphere',
  'bright-commercial':  'bright vibrant commercial photography, high-key lighting, cheerful energetic',
  'futuristic':         'futuristic tech aesthetic, neon accents, holographic elements, sci-fi inspired',
  'cinematic':          'cinematic photography, movie-quality frame, dramatic depth of field, film look',
  'vintage':            'vintage retro photography, film grain, nostalgic tone, analog warmth',
  'elegant':            'elegant sophisticated photography, refined composition, timeless beauty',
  'viral-tiktok':       'viral TikTok video frame style, trending aesthetic, eye-catching composition, bold',
}

const BG_STYLE_PROMPT: Record<string,string> = {
  'studio-white':   'pure white studio background, seamless paper backdrop, professional product photography',
  'marble':         'luxury marble surface, white gray veining, high-end editorial surface',
  'cafe':           'modern Indonesian cafe interior, coffee shop aesthetic, warm ambient light',
  'outdoor':        'natural outdoor environment, green botanical, organic fresh atmosphere',
  'dapur':          'modern kitchen interior, culinary setting, clean countertop',
  'bathroom':       'bathroom aesthetic, wellness spa setting, clean tiles background',
  'neon-cyberpunk': 'neon cyberpunk background, purple blue neon glow, futuristic night setting',
  'minimal-clean':  'minimal clean background, subtle texture, professional simplicity',
  'gradient':       'smooth gradient background, soft color blend, modern design',
  'transparent':    'transparent background (PNG), isolated product, no background',
  'dark-premium':   'dark premium setup, deep black background, spot lighting, luxury atmosphere',
}

const COLOR_TONE_PROMPT: Record<string,string> = {
  'warm':       'warm color palette, golden amber tones, cozy inviting atmosphere',
  'pastel':     'soft pastel colors, dreamy gentle palette, feminine delicate tones',
  'monochrome': 'monochromatic color scheme, single hue variations, sophisticated minimal',
  'gold-luxury':'gold luxury color palette, champagne metallic, premium opulence',
  'black-premium':'black premium palette, deep shadow, sophisticated dark elegance',
  'clean-white':'clean bright white palette, pure pristine, clinical professional',
  'vibrant':    'vibrant saturated colors, high energy, bold eye-catching commercial',
  'earth-tone': 'earth tone palette, natural brown beige green, organic sustainable',
}

const MOOD_PROMPT: Record<string,string> = {
  'happy':       'joyful happy mood, uplifting positive energy, cheerful expression',
  'elegant':     'elegant refined mood, graceful sophisticated atmosphere, poised',
  'trustworthy': 'trustworthy reliable mood, professional credibility, confident assurance',
  'premium':     'premium exclusive mood, high-value perception, aspirational quality',
  'emotional':   'emotional connection mood, heartfelt resonance, personal relatable story',
  'fresh':       'fresh clean energetic mood, invigorating vitality, natural freshness',
  'healthy':     'healthy natural mood, wellness lifestyle, wholesome organic feel',
  'luxury':      'ultra luxury exclusive mood, elite status, magnificent opulence',
  'energetic':   'high energy dynamic mood, powerful motion, bold statement',
  'calm':        'calm serene peaceful mood, tranquil harmony, relaxing ambiance',
  'confident':   'confident bold authoritative mood, strong presence, decisive stance',
}

const LIGHTING_PROMPT: Record<string,string> = {
  'soft':          'soft diffused light, gentle shadows, flattering even illumination',
  'studio':        'professional studio lighting, 3-point setup, controlled shadow fill',
  'natural':       'natural daylight, window light, organic soft illumination',
  'golden-hour':   'golden hour warm sun, magical backlight, flare bokeh atmosphere',
  'dramatic':      'dramatic chiaroscuro shadow, high contrast single light source',
  'cinematic':     'cinematic lighting setup, anamorphic lens flare, movie production quality',
  'neon-glow':     'neon glow RGB lighting, colorful LED atmosphere, night club feel',
  'high-contrast': 'high contrast bold lighting, deep shadow highlight split',
  'bright-commercial':'bright high-key commercial lighting, no shadow, clean product reveal',
}

const COMPOSITION_PROMPT: Record<string,string> = {
  'close-up':      'extreme close-up shot, product detail macro, texture reveal',
  'flat-lay':      'flat lay top-down composition, overhead product styling, editorial arrange',
  'macro':         'macro photography, ultra close detail, microscopic texture view',
  'symmetrical':   'perfect symmetrical composition, centered balance, mirror composition',
  'hero-shot':     'hero product shot, main feature composition, proud prominent placement',
  'rule-of-thirds':'rule of thirds framing, dynamic balance, professional photography guide',
  'wide-cinematic':'wide cinematic frame, environmental context, storytelling landscape',
  'floating':      'floating levitating product, mid-air suspension, gravity defying',
  'hand-holding':  'hand holding product, human touch interaction, lifestyle use case',
  'lifestyle':     'lifestyle composition, product in daily use context, aspirational scene',
}

const CAMERA_PROMPT: Record<string,string> = {
  'dslr':          'DSLR commercial photography, Canon EOS professional quality, tack sharp',
  'sony-a7r':      'Sony A7R cinematic quality, full frame sensor, exceptional detail',
  'iphone':        'iPhone realistic photography, contemporary casual feel, social media native',
  '85mm':          '85mm portrait lens, beautiful background separation, flattering compression',
  'macro':         'macro photography lens, extreme detail, magnified texture study',
  'ultra-detailed':'ultra detailed photography, every texture visible, hyper sharp resolution',
  'bokeh':         'bokeh background blur, shallow depth of field, subject isolation, dreamy',
  'studio-hq':     'high-end studio photography, commercial grade quality, advertising standard',
}

const AUDIENCE_PROMPT: Record<string,string> = {
  'remaja':        'for Indonesian teenage audience, youth culture, youthful energetic',
  'mahasiswa':     'for Indonesian college student audience, budget conscious, trendy lifestyle',
  'ibu-rumah-tangga':'for Indonesian housewife audience, practical family oriented, trusted',
  'pria-dewasa':   'for Indonesian adult male audience, masculine confident, sophisticated',
  'wanita-karir':  'for Indonesian career woman audience, professional modern, empowered',
  'luxury':        'for luxury high-income audience, exclusive elite, premium aspiration',
  'gen-z':         'for Gen Z audience, authenticity-driven, digital native, trend-forward',
  'millennial':    'for millennial audience, experience-driven, purpose-oriented, aspirational',
  'pebisnis':      'for business professional audience, ROI-focused, corporate credibility',
  'gamer':         'for gaming enthusiast audience, tech-savvy, immersive, high-performance',
  'beauty-enthusiast':'for beauty enthusiast audience, skincare-obsessed, ingredient-aware',
}

const PLATFORM_SPEC: Record<string,{ ratio:string; note:string }> = {
  'instagram':  { ratio:'4:5',  note:'Instagram feed optimized, 1080x1350px ideal, thumb-stopping' },
  'tiktok':     { ratio:'9:16', note:'TikTok vertical format, scroll-stopping, high energy' },
  'shopee':     { ratio:'1:1',  note:'Shopee product image, white bg preferred, clear product' },
  'tokopedia':  { ratio:'1:1',  note:'Tokopedia marketplace ready, professional clean' },
  'lazada':     { ratio:'1:1',  note:'Lazada product image, clean commercial, sharp detail' },
  'facebook-ads':{ ratio:'4:5', note:'Facebook Ads optimized, conversion-focused, attention-grabbing' },
  'website':    { ratio:'16:9', note:'Website banner optimized, landscape hero image' },
  'whatsapp':   { ratio:'1:1',  note:'WhatsApp marketing ready, clear message, mobile-first' },
}

// ── Quality suffix (always appended) ──────────────────────────
const QUALITY_SUFFIX = [
  'ultra high quality', '8K resolution', 'sharp focus', 'professional commercial photography',
  'perfect exposure', 'color accurate', 'magazine-quality', 'award-winning photography',
  'photorealistic', 'highly detailed', 'commercial grade', 'product photography',
].join(', ')

const DEFAULT_NEGATIVE = [
  'blurry', 'out of focus', 'low quality', 'pixelated', 'grainy', 'noisy',
  'watermark', 'text overlay', 'signature', 'logo', 'frame',
  'distorted', 'deformed', 'ugly', 'bad anatomy',
  'oversaturated', 'overexposed', 'underexposed',
  'amateur photography', 'poorly lit', 'harsh shadows',
  'duplicate', 'multiple products', 'cluttered background',
].join(', ')

// ── Main prompt builder ────────────────────────────────────────
export function buildImagePrompt(input: ImageGenerationInput): {
  prompt:         string
  negativePrompt: string
  recommendedRatio: string
} {
  const parts: string[] = []

  // 1. Product identity
  parts.push(`Ultra realistic professional product photography of "${input.productName}"`)
  if (input.productDesc) parts.push(`Product details: ${input.productDesc}`)

  // 2. Category context
  if (input.category && CATEGORY_PROMPT[input.category]) {
    parts.push(CATEGORY_PROMPT[input.category])
  }

  // 3. Content type
  if (input.contentType && CONTENT_TYPE_PROMPT[input.contentType]) {
    parts.push(CONTENT_TYPE_PROMPT[input.contentType])
  }

  // 4. Visual style
  if (input.visualStyle && VISUAL_STYLE_PROMPT[input.visualStyle]) {
    parts.push(VISUAL_STYLE_PROMPT[input.visualStyle])
  }

  // 5. Background
  if (input.bgStyle && BG_STYLE_PROMPT[input.bgStyle]) {
    parts.push(BG_STYLE_PROMPT[input.bgStyle])
  }

  // 6. Lighting
  if (input.lightingStyle && LIGHTING_PROMPT[input.lightingStyle]) {
    parts.push(LIGHTING_PROMPT[input.lightingStyle])
  }

  // 7. Composition
  if (input.composition && COMPOSITION_PROMPT[input.composition]) {
    parts.push(COMPOSITION_PROMPT[input.composition])
  }

  // 8. Camera style
  if (input.cameraStyle && CAMERA_PROMPT[input.cameraStyle]) {
    parts.push(CAMERA_PROMPT[input.cameraStyle])
  }

  // 9. Color tone
  if (input.colorTone && COLOR_TONE_PROMPT[input.colorTone]) {
    parts.push(COLOR_TONE_PROMPT[input.colorTone])
  }

  // 10. Mood
  if (input.moodTone && MOOD_PROMPT[input.moodTone]) {
    parts.push(MOOD_PROMPT[input.moodTone])
  }

  // 11. Target audience
  if (input.targetAudience && AUDIENCE_PROMPT[input.targetAudience]) {
    parts.push(AUDIENCE_PROMPT[input.targetAudience])
  }

  // 12. Platform spec
  const platSpec = input.platform ? PLATFORM_SPEC[input.platform] : null
  if (platSpec) parts.push(platSpec.note)

  // 13. Quality suffix
  parts.push(QUALITY_SUFFIX)

  // Build final prompt
  const basePrompt = parts.filter(Boolean).join(', ')
  const finalPrompt = input.customPrompt
    ? `${basePrompt}, ${input.customPrompt}`
    : basePrompt

  // Negative prompt
  const negPrompt = input.negativePrompt
    ? `${DEFAULT_NEGATIVE}, ${input.negativePrompt}`
    : DEFAULT_NEGATIVE

  // Recommended ratio from platform
  const recommendedRatio = platSpec?.ratio ?? input.ratio ?? '1:1'

  return {
    prompt:           finalPrompt,
    negativePrompt:   negPrompt,
    recommendedRatio,
  }
}

// ── Ratio to dimensions ────────────────────────────────────────
export function ratioDimensions(ratio: string): { width:number; height:number } {
  const map: Record<string,{width:number;height:number}> = {
    '1:1':  { width:1024, height:1024 },
    '4:5':  { width:896,  height:1120 },
    '9:16': { width:768,  height:1344 },
    '16:9': { width:1344, height:768  },
    '4:3':  { width:1152, height:864  },
  }
  return map[ratio] ?? { width:1024, height:1024 }
}

// ── Image credits per action ───────────────────────────────────
export const IMAGE_CREDITS: Record<string, number> = {
  generate:   1,
  regenerate: 1,
  upscale:    2,
}

// ── Plan image limits ──────────────────────────────────────────
export const PLAN_IMAGE_LIMITS: Record<string,{ daily:number; monthly:number; upscale:number }> = {
  free:     { daily:2,   monthly:5,   upscale:0 },
  starter:  { daily:2,   monthly:5,   upscale:0 },
  basic:    { daily:5,   monthly:20,  upscale:5 },
  pro:      { daily:20,  monthly:100, upscale:30 },
  business: { daily:50,  monthly:500, upscale:150 },
}