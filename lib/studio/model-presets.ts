// lib/studio/model-presets.ts
// Model presets untuk Product to Model AI
// Prompt strategy mengacu Fashn.ai: fokus model description, pose, background, lighting
// JANGAN describe produk — AI baca dari upload image

export interface ModelPreset {
  id:          string
  label:       string
  category:    'local-female' | 'local-male' | 'hijab' | 'child' | 'teen' | 'toddler' | 'baby' | 'global-female' | 'global-male'
  icon:        string
  desc:        string
  tags:        string[]
  ageRange:    string
  bodyType:    string
  skinTone:    string
  hairDesc:    string
  // Fashn.ai style prompt components
  basePrompt:  string      // full descriptive prompt (no product description)
  // Pose options
  defaultPose: string
  // Background options
  defaultBg:   string
  bestFor:     string[]
  popular?:    boolean
}

export interface PosePreset {
  id:    string
  label: string
  icon:  string
  desc:  string
  prompt:string
}

export interface BackgroundPreset {
  id:     string
  label:  string
  icon:   string
  desc:   string
  prompt: string
}

// ── POSE PRESETS ──────────────────────────────────────────────
export const POSE_PRESETS: PosePreset[] = [
  {
    id:'full-body-relaxed', label:'Full Body Santai', icon:'🧍', desc:'Berdiri santai, cocok untuk baju, dress, celana',
    prompt:'full body studio photo, model standing in a relaxed natural pose with one leg slightly forward, weight shifted to one side, hands hanging naturally by sides',
  },
  {
    id:'full-body-confident', label:'Full Body Confident', icon:'💪', desc:'Pose percaya diri, tegak, profesional',
    prompt:'full body studio photo, model standing tall with confident posture, shoulders back, looking directly at camera with a subtle smile',
  },
  {
    id:'three-quarter', label:'Tiga Perempat', icon:'↗️', desc:'Tampilan dari samping 45°, lebih dinamis',
    prompt:'three-quarter body view photo, model angled slightly to the side showing product from a flattering angle, three-quarter framing from mid-thigh upward',
  },
  {
    id:'upper-body', label:'Upper Body', icon:'👕', desc:'Setengah badan, cocok untuk atasan & aksesori',
    prompt:'upper body portrait photo, model framed from waist upward, arms relaxed with natural positioning, slightly angled toward camera',
  },
  {
    id:'walking', label:'Berjalan', icon:'🚶', desc:'Pose berjalan natural, cocok untuk fashion editorial',
    prompt:'full body photo of model walking naturally, mid-stride pose, arms in natural walking motion, dynamic movement captured',
  },
  {
    id:'sitting', label:'Duduk', icon:'🪑', desc:'Pose duduk elegan, cocok untuk fashion & lifestyle',
    prompt:'full body photo of model sitting gracefully on a simple surface, legs positioned elegantly, upper body upright with relaxed shoulders',
  },
  {
    id:'hands-in-pocket', label:'Tangan di Saku', icon:'🤙', desc:'Kasual dan stylish, satu tangan di saku',
    prompt:'full body photo, model with one hand resting lightly in pocket while the other arm hangs naturally by the side, relaxed casual stance',
  },
  {
    id:'crossed-arms', label:'Tangan Menyilang', icon:'🤗', desc:'Pose percaya diri dengan tangan menyilang',
    prompt:'upper body to three-quarter body photo, model with arms crossed confidently in front, smiling naturally at camera',
  },
]

// ── BACKGROUND PRESETS ────────────────────────────────────────
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id:'white-studio', label:'White Studio', icon:'⬜', desc:'Latar putih bersih, standar ecommerce',
    prompt:'clean white seamless studio background, professional studio lighting setup, bright and evenly lit',
  },
  {
    id:'light-gray', label:'Gray Studio', icon:'🩶', desc:'Abu-abu netral, modern dan elegan',
    prompt:'neutral light grey seamless studio background, balanced even studio lighting, clean minimal aesthetic',
  },
  {
    id:'beige-warm', label:'Beige Warm', icon:'🤎', desc:'Beige hangat, natural dan nyaman',
    prompt:'warm beige seamless background, soft warm studio lighting, natural and approachable atmosphere',
  },
  {
    id:'outdoor-natural', label:'Outdoor Natural', icon:'🌿', desc:'Setting outdoor natural, fresh',
    prompt:'outdoor natural setting with soft natural daylight, greenery in background slightly blurred, fresh open air atmosphere',
  },
  {
    id:'urban-street', label:'Urban Street', icon:'🏙️', desc:'Setting jalanan urban, streetwear style',
    prompt:'urban street background, city environment, natural outdoor daylight, lifestyle street photography aesthetic, background slightly out of focus',
  },
  {
    id:'cafe-indoor', label:'Cafe Indoor', icon:'☕', desc:'Suasana kafe hangat, lifestyle aesthetic',
    prompt:'cozy indoor cafe setting background, warm ambient lighting, bokeh background with cafe elements, warm and inviting atmosphere',
  },
  {
    id:'minimalist-home', label:'Minimalist Home', icon:'🏠', desc:'Rumah minimalis modern, relatable',
    prompt:'modern minimalist home interior background, natural window light, clean and contemporary indoor lifestyle setting, lifestyle photography',
  },
  {
    id:'pastel-gradient', label:'Pastel Gradient', icon:'🌸', desc:'Gradient pastel lembut, aesthetic dan modern',
    prompt:'soft pastel gradient background in peach or lavender tones, smooth color transition, modern studio aesthetic, Instagram worthy',
  },
  {
    id:'black-dramatic', label:'Black Dramatic', icon:'⬛', desc:'Latar hitam dramatis, luxury premium',
    prompt:'deep black seamless background, dramatic studio lighting with rim lighting effect, moody luxury atmosphere, high-end fashion photography',
  },
  {
    id:'beach-outdoor', label:'Beach Outdoor', icon:'🏖️', desc:'Setting pantai, santai dan lifestyle',
    prompt:'tropical beach outdoor setting, bright natural sunlight, sandy beach and ocean in background, lifestyle summer photography, shallow depth of field',
  },
]

// ── MODEL PRESETS ─────────────────────────────────────────────
export const MODEL_PRESETS: ModelPreset[] = [

  // ════ LOCAL FEMALE — INDONESIA ════════════════════════════

  {
    id:'wanita-asia-muda', label:'Wanita Asia Muda',
    category:'local-female', icon:'👩', popular:true,
    desc:'Wanita Indonesia muda, kulit sawo matang, rambut hitam lurus panjang',
    tags:['Indonesia','Lokal','Fashion','Skincare','Casual'],
    ageRange:'22-28 tahun', bodyType:'Ramping proporsional', skinTone:'Sawo matang hangat', hairDesc:'Hitam lurus panjang sebahu',
    basePrompt:'Young adult Indonesian woman aged 22-26, medium warm brown skin with golden undertones, long straight black hair falling just past the shoulders, almond-shaped dark brown eyes, natural makeup with subtle definition, slender proportional build, friendly and approachable expression, soft natural smile',
    defaultPose:'full-body-relaxed', defaultBg:'white-studio',
    bestFor:['Dress', 'Blouse', 'Skincare', 'Fashion casual', 'Marketplace'],
  },
  {
    id:'wanita-asia-dewasa', label:'Wanita Asia Dewasa',
    category:'local-female', icon:'👩‍💼', popular:true,
    desc:'Wanita Indonesia dewasa, tampilan profesional elegan',
    tags:['Profesional','Formal','Corporate','Premium'],
    ageRange:'30-40 tahun', bodyType:'Proporsional', skinTone:'Sawo matang medium', hairDesc:'Hitam berombak medium',
    basePrompt:'Adult Indonesian woman aged 32-38, warm medium brown skin, shoulder-length wavy dark hair neatly styled, confident professional expression, well-groomed appearance with light natural makeup, proportional figure with poised posture, trustworthy and elegant look',
    defaultPose:'three-quarter', defaultBg:'white-studio',
    bestFor:['Batik', 'Blazer', 'Formal wear', 'Aksesoris', 'Brand premium'],
  },
  {
    id:'wanita-asia-curvy', label:'Wanita Asia Curvy',
    category:'local-female', icon:'🧍‍♀️',
    desc:'Wanita Indonesia curvy, body positivity representation',
    tags:['Curvy','Plus size','Body positive','Inklusif'],
    ageRange:'25-35 tahun', bodyType:'Curvy full-figured', skinTone:'Sawo matang', hairDesc:'Hitam panjang',
    basePrompt:'Young adult Indonesian woman aged 25-32 with a curvy full-figured body type, warm medium brown skin, long dark hair, confident and joyful expression, body-positive representation, natural makeup, standing tall with good posture showcasing her natural curves',
    defaultPose:'full-body-confident', defaultBg:'white-studio',
    bestFor:['Fashion plus size', 'Dress', 'Baju kurung', 'All-size fashion'],
  },

  // ════ HIJAB ════════════════════════════════════════════════

  {
    id:'hijab-muda', label:'Hijab Wanita Muda',
    category:'hijab', icon:'🧕', popular:true,
    desc:'Wanita berhijab muda Indonesia, casual modern dan stylish',
    tags:['Hijab','Muslim','Indonesia','Modest fashion'],
    ageRange:'20-28 tahun', bodyType:'Ramping', skinTone:'Sawo matang', hairDesc:'Berhijab (tidak terlihat)',
    basePrompt:'Young adult Indonesian Hijabi woman aged 20-26, wearing a neat plain hijab draped elegantly, warm medium brown skin, dark expressive eyes, natural makeup, slender build, friendly warm smile, modest fashion representation',
    defaultPose:'full-body-relaxed', defaultBg:'white-studio',
    bestFor:['Hijab fashion', 'Gamis', 'Tunik', 'Baju muslim', 'Modest wear'],
  },
  {
    id:'hijab-dewasa', label:'Hijab Wanita Dewasa',
    category:'hijab', icon:'🧕', popular:true,
    desc:'Wanita berhijab dewasa, tampilan elegan dan profesional',
    tags:['Hijab','Dewasa','Profesional','Elegant'],
    ageRange:'30-40 tahun', bodyType:'Proporsional', skinTone:'Sawo matang medium', hairDesc:'Berhijab rapi',
    basePrompt:'Adult Indonesian Hijabi woman aged 30-38, wearing a neatly styled plain hijab, medium warm brown skin, confident and elegant expression, professional but approachable appearance, light natural makeup, proportional figure, poised and trustworthy demeanor',
    defaultPose:'three-quarter', defaultBg:'beige-warm',
    bestFor:['Gamis formal', 'Modest fashion premium', 'Busana muslim dewasa'],
  },

  // ════ LOCAL MALE — INDONESIA ════════════════════════════════

  {
    id:'pria-asia-muda', label:'Pria Asia Muda',
    category:'local-male', icon:'👨', popular:true,
    desc:'Pria Indonesia muda, tampilan casual stylish',
    tags:['Indonesia','Pria','Casual','Fashion','Youth'],
    ageRange:'22-28 tahun', bodyType:'Atletis slim', skinTone:'Sawo matang', hairDesc:'Hitam pendek rapi',
    basePrompt:'Young adult Indonesian man aged 22-27, warm medium brown skin, short neat black hair, clean-shaven or very light stubble, athletic slim build with good posture, natural relaxed expression with subtle smile, casual-cool appearance',
    defaultPose:'full-body-relaxed', defaultBg:'white-studio',
    bestFor:['Kaos', 'Kemeja', 'Jaket', 'Celana', 'Sneakers', 'Fashion pria'],
  },
  {
    id:'pria-asia-dewasa', label:'Pria Asia Dewasa',
    category:'local-male', icon:'👨‍💼',
    desc:'Pria Indonesia dewasa, tampilan profesional percaya diri',
    tags:['Profesional','Formal','Dewasa','Corporate'],
    ageRange:'32-42 tahun', bodyType:'Proporsional', skinTone:'Sawo matang medium', hairDesc:'Hitam pendek, rapi',
    basePrompt:'Adult Indonesian man aged 33-40, warm medium brown skin, short neat dark hair slightly groomed, light stubble, confident professional expression, well-built proportional physique, approachable but authoritative presence, natural and trustworthy demeanor',
    defaultPose:'three-quarter', defaultBg:'white-studio',
    bestFor:['Batik pria', 'Kemeja formal', 'Jas', 'Aksesoris pria premium'],
  },

  // ════ CHILDREN ══════════════════════════════════════════════

  {
    id:'anak-perempuan-remaja', label:'Remaja Perempuan Asia',
    category:'teen', icon:'👧', popular:true,
    desc:'Remaja perempuan Indonesia 13-17 tahun, fresh dan ceria',
    tags:['Remaja','Teen','Perempuan','Youth'],
    ageRange:'13-17 tahun', bodyType:'Slim remaja', skinTone:'Sawo matang cerah', hairDesc:'Hitam panjang lurus',
    basePrompt:'Asian teenage girl aged 14-16, fair warm skin with golden undertones, long straight black hair often in a ponytail or down, bright curious eyes, fresh youthful appearance with no makeup or very natural look, slim teenage build, cheerful and energetic expression',
    defaultPose:'full-body-relaxed', defaultBg:'beige-warm',
    bestFor:['Pakaian remaja perempuan', 'School fashion', 'Casual teen wear', 'Aksesoris remaja'],
  },
  {
    id:'anak-laki-remaja', label:'Remaja Laki-laki Asia',
    category:'teen', icon:'👦',
    desc:'Remaja laki-laki Indonesia 13-17 tahun, sporty casual',
    tags:['Remaja','Teen','Laki-laki','Youth','Sporty'],
    ageRange:'13-17 tahun', bodyType:'Slim atletis remaja', skinTone:'Sawo matang', hairDesc:'Hitam pendek rambut',
    basePrompt:'Asian teenage boy aged 14-16, warm medium brown skin, short neat dark hair, bright youthful eyes, fresh teenage appearance, slim-athletic teenage build, casual and energetic expression, active and sporty vibe',
    defaultPose:'full-body-relaxed', defaultBg:'white-studio',
    bestFor:['Pakaian remaja laki-laki', 'Sporty wear', 'Casual teen', 'Seragam sekolah'],
  },
  {
    id:'anak-kecil', label:'Anak Kecil (5-10 th)',
    category:'child', icon:'🧒', popular:true,
    desc:'Anak Indonesia 5-10 tahun, menggemaskan dan ceria',
    tags:['Anak','Kecil','Cute','Adorable','Kids'],
    ageRange:'5-10 tahun', bodyType:'Anak-anak', skinTone:'Sawo matang cerah', hairDesc:'Hitam pendek atau dikuncir',
    basePrompt:'Indonesian child aged 6-9 years old, warm light brown skin, dark bright eyes, short dark hair or hair in small pigtails, adorably cute facial features, happy cheerful expression, small children\'s proportions, playful and energetic personality',
    defaultPose:'full-body-relaxed', defaultBg:'white-studio',
    bestFor:['Baju anak', 'Seragam sekolah', 'Baju main', 'Aksesoris anak'],
  },
  {
    id:'anak-balita', label:'Balita (2-4 tahun)',
    category:'toddler', icon:'👶',
    desc:'Balita Indonesia 2-4 tahun, menggemaskan chubby',
    tags:['Balita','Toddler','Baby face','Cute'],
    ageRange:'2-4 tahun', bodyType:'Balita chubby', skinTone:'Sawo matang cerah', hairDesc:'Hitam pendek halus',
    basePrompt:'Indonesian toddler aged 2-4 years old, light warm brown skin with a rosy tint, soft fine dark hair, big dark innocent eyes, chubby adorable toddler features, round baby face, cherubic and cute expression, small toddler proportions',
    defaultPose:'full-body-relaxed', defaultBg:'beige-warm',
    bestFor:['Baju bayi & balita', 'Pakaian anak kecil', 'Aksesoris bayi'],
  },
  {
    id:'bayi', label:'Bayi (0-12 bulan)',
    category:'baby', icon:'🍼',
    desc:'Bayi Indonesia 0-12 bulan, imut dan menggemaskan',
    tags:['Bayi','Baby','Newborn','Infant'],
    ageRange:'0-12 bulan', bodyType:'Bayi mungil', skinTone:'Kulit bayi cerah', hairDesc:'Rambut bayi tipis hitam',
    basePrompt:'Indonesian baby aged 3-10 months old, delicate light warm skin, fine thin dark hair, large innocent baby eyes, perfectly round baby face, chubby baby cheeks and arms, adorably tiny baby proportions, peaceful or happily smiling expression',
    defaultPose:'sitting', defaultBg:'beige-warm',
    bestFor:['Baju bayi', 'Pampers', 'Aksesoris bayi', 'Perlengkapan bayi'],
  },

  // ════ GLOBAL — WHITE ════════════════════════════════════════

  {
    id:'wanita-kulit-putih', label:'Wanita Berkulit Putih',
    category:'global-female', icon:'👱‍♀️',
    desc:'Wanita Eropa/Barat, kulit cerah, tampilan internasional',
    tags:['Western','International','Caucasian','Global'],
    ageRange:'24-32 tahun', bodyType:'Proporsional', skinTone:'Kulit cerah terang', hairDesc:'Blonde atau cokelat',
    basePrompt:'Young adult European woman aged 24-30, fair light skin with subtle warm undertones, blonde or light brown hair at shoulder length, blue or green eyes, natural light makeup, proportional slender build, friendly approachable expression, international fashion model aesthetic',
    defaultPose:'three-quarter', defaultBg:'white-studio',
    bestFor:['Brand internasional', 'Ekspor produk', 'Western market', 'Premium brand'],
  },
  {
    id:'pria-kulit-putih', label:'Pria Berkulit Putih',
    category:'global-male', icon:'👱‍♂️',
    desc:'Pria Eropa/Barat, kulit cerah, tampilan internasional',
    tags:['Western','International','Caucasian','Global'],
    ageRange:'26-34 tahun', bodyType:'Atletis proporsional', skinTone:'Kulit cerah', hairDesc:'Cokelat atau hitam',
    basePrompt:'Young adult European man aged 26-32, fair skin with light freckles, short brown or dark hair neatly styled, defined jawline, light stubble, athletic proportional build, confident friendly expression, international model appearance',
    defaultPose:'full-body-confident', defaultBg:'white-studio',
    bestFor:['Brand internasional', 'Western market', 'Premium fashion pria'],
  },

  // ════ GLOBAL — BLACK ════════════════════════════════════════

  {
    id:'wanita-kulit-hitam', label:'Wanita Berkulit Hitam',
    category:'global-female', icon:'👩🏿',
    desc:'Wanita Afrika/Karibia, kulit gelap cantik, tampilan kuat dan elegan',
    tags:['African','Black','Melanin','Diversity','Global'],
    ageRange:'24-32 tahun', bodyType:'Proporsional atletis', skinTone:'Kulit cokelat gelap', hairDesc:'Natural afro atau braids',
    basePrompt:'Young adult African-American or West African woman aged 24-30, deep rich brown skin with beautiful warm undertones, natural afro-textured hair or braids, striking expressive dark eyes, strong elegant bone structure, confident and powerful presence, natural makeup highlighting her features, graceful and strong feminine expression',
    defaultPose:'three-quarter', defaultBg:'white-studio',
    bestFor:['Brand global', 'Diversity campaign', 'Beauty produk melanin', 'Fashion inklusif'],
  },
  {
    id:'pria-kulit-hitam', label:'Pria Berkulit Hitam',
    category:'global-male', icon:'👨🏿',
    desc:'Pria Afrika/Karibia, kulit gelap, tampilan kuat dan percaya diri',
    tags:['African','Black','Melanin','Diversity','Global'],
    ageRange:'25-35 tahun', bodyType:'Atletis kuat', skinTone:'Kulit cokelat gelap', hairDesc:'Buzz cut atau natural',
    basePrompt:'Young adult Nigerian or Kenyan man aged 25-33, deep rich brown skin, short buzz cut or natural low-cut hair, high cheekbones, strong defined jawline, athletic muscular build with confident posture, powerful and charismatic expression, friendly approachable smile',
    defaultPose:'full-body-confident', defaultBg:'white-studio',
    bestFor:['Brand global', 'Diversity campaign', 'Fashion inklusif', 'Sportswear'],
  },
]

// ── Category definitions ──────────────────────────────────────
export const MODEL_CATEGORIES = {
  'local-female': { label:'Wanita Lokal',    icon:'👩',  desc:'Wanita Indonesia' },
  'hijab':        { label:'Wanita Hijab',    icon:'🧕',  desc:'Muslimah Indonesia' },
  'local-male':   { label:'Pria Lokal',      icon:'👨',  desc:'Pria Indonesia' },
  'child':        { label:'Anak Kecil',      icon:'🧒',  desc:'Usia 5-10 tahun' },
  'teen':         { label:'Remaja',          icon:'👧',  desc:'Usia 13-17 tahun' },
  'toddler':      { label:'Balita & Bayi',   icon:'👶',  desc:'Usia 0-4 tahun' },
  'baby':         { label:'Bayi',            icon:'🍼',  desc:'Usia 0-12 bulan' },
  'global-female':{ label:'Wanita Global',   icon:'🌍',  desc:'Model internasional' },
  'global-male':  { label:'Pria Global',     icon:'🌍',  desc:'Model internasional' },
} as const

export const MODEL_PRESET_MAP = Object.fromEntries(MODEL_PRESETS.map(p => [p.id, p]))
export const POSE_MAP          = Object.fromEntries(POSE_PRESETS.map(p => [p.id, p]))
export const BG_MAP            = Object.fromEntries(BACKGROUND_PRESETS.map(p => [p.id, p]))

export const POPULAR_MODELS = MODEL_PRESETS.filter(m => m.popular).map(m => m.id)

// ── Build final prompt (Fashn.ai style) ──────────────────────
export function buildProductToModelPrompt(opts: {
  model:        ModelPreset
  pose:         PosePreset
  background:   BackgroundPreset
  customPrompt: string   // user's extra detail about product wearing/interaction
  lighting:     string
}): string {
  const { model, pose, background, customPrompt, lighting } = opts

  const parts: string[] = []

  // 1. Pose + framing (first per Fashn.ai guidance)
  parts.push(pose.prompt)

  // 2. Model description (age, skin, hair, build)
  parts.push(model.basePrompt)

  // 3. Background + lighting
  parts.push(background.prompt)
  if (lighting) parts.push(lighting)

  // 4. Custom product interaction (optional — only if user specified)
  if (customPrompt.trim()) {
    parts.push(customPrompt.trim())
  }

  // 5. Quality boosters
  parts.push('professional fashion photography, high resolution, sharp focus, commercial product photography quality')

  return parts.join(', ')
}

export function buildNegativePrompt(): string {
  return [
    'bad anatomy, deformed body, extra limbs, missing limbs, mutation',
    'blurry, low quality, low resolution, pixelated, grainy',
    'text, watermark, logo, signature',
    'nudity, explicit content, inappropriate',
    'unrealistic proportions, distorted face, ugly',
    'floating, disconnected, artifacts',
    'wrong garment, changed product, different clothing color or pattern',
  ].join(', ')
}