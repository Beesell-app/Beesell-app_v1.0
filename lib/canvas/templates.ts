// apps/web-app/lib/canvas/templates.ts
// ── 10 Template definitions ───────────────────────────────────
// Format: JSON-serializable, bisa di-load ke Fabric.js via template-renderer
// Setiap template punya:
//   - id, name, category, canvasSize
//   - palette (warna brand template)
//   - layers[]: ordered list of layer descriptors
//   - thumbnailSvg: inline SVG untuk preview gallery
//
// Layer descriptor fields:
//   type: 'rect' | 'text' | 'image_placeholder' | 'gradient_rect' | 'circle'
//   role: 'bg' | 'photo' | 'overlay' | 'text' | 'logo'
//   x,y,w,h: relative positions (0-1, multiplied by canvas size at render)
//   fill, opacity, text, fontSize, fontWeight, textAlign, fontFamily
//   rx: border radius
//   imageTag: 'product_photo' | 'logo' (untuk placeholder)

export type TemplateLayerType =
  | 'rect'
  | 'text'
  | 'image_placeholder'
  | 'gradient_rect'
  | 'circle'
  | 'line'

export interface TemplateLayer {
  type:          TemplateLayerType
  role:          'bg' | 'photo' | 'overlay' | 'text' | 'logo' | 'decoration'
  x:             number     // 0-1 relative to canvas width
  y:             number
  w:             number
  h:             number
  fill?:         string
  fill2?:        string     // for gradient (stop 2)
  gradientDir?:  'v' | 'h' | 'diagonal'
  opacity?:      number
  rx?:           number     // border radius (0-1 relative to min(w,h))
  // Text fields
  text?:         string
  fontSize?:     number     // relative to canvas height (0-1)
  fontWeight?:   'normal' | 'bold'
  fontStyle?:    'normal' | 'italic'
  fontFamily?:   string
  textAlign?:    'left' | 'center' | 'right'
  letterSpacing?: number
  // Image placeholder
  imageTag?:     'product_photo' | 'logo'
  objectFit?:    'cover' | 'contain'
  // Decoration
  strokeColor?:  string
  strokeWidth?:  number
}

export type TemplateCategory =
  | 'instagram_feed'
  | 'instagram_story'
  | 'tiktok'
  | 'shopee_banner'
  | 'tokopedia_banner'
  | 'universal'

export interface TemplateDefinition {
  id:            string
  name:          string
  description:   string
  category:      TemplateCategory
  categoryLabel: string
  canvas: {
    width:  number
    height: number
  }
  palette: {
    primary:   string
    secondary: string
    bg:        string
    text:      string
    accent:    string
  }
  fonts: string[]         // Google Font families used
  tags:  string[]
  layers: TemplateLayer[]
}

// ══════════════════════════════════════════════════════════════
// 01. IG_PRODUCT_BOLD
// Dark navy background, product center, bold price, CTA button
// ══════════════════════════════════════════════════════════════
const IG_PRODUCT_BOLD: TemplateDefinition = {
  id:            'ig_product_bold',
  name:          'Product Bold',
  description:   'Dark background, foto produk center, harga besar. Cocok untuk flash sale.',
  category:      'instagram_feed',
  categoryLabel: 'Instagram Feed',
  canvas:        { width: 1080, height: 1080 },
  palette: { primary: '#0F172A', secondary: '#2563EB', bg: '#0F172A', text: '#FFFFFF', accent: '#FFE600' },
  fonts:   ['Poppins', 'DM Sans'],
  tags:    ['dark', 'bold', 'sale', 'instagram'],
  layers: [
    // Background dark navy
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#0F172A' },
    // Decorative circles (blur dot effect)
    { type: 'circle', role: 'decoration', x: 0.75, y: 0.15, w: 0.5, h: 0.5, fill: '#2563EB', opacity: 0.12 },
    { type: 'circle', role: 'decoration', x: -0.1, y: 0.6,  w: 0.4, h: 0.4, fill: '#7C3AED', opacity: 0.10 },
    // Accent line top
    { type: 'rect', role: 'decoration', x: 0.08, y: 0.06, w: 0.08, h: 0.006, fill: '#FFE600', rx: 0.5 },
    // Product photo (placeholder center-ish)
    { type: 'image_placeholder', role: 'photo', x: 0.15, y: 0.18, w: 0.70, h: 0.50, imageTag: 'product_photo', objectFit: 'contain' },
    // Semi overlay bottom for text readability
    { type: 'gradient_rect', role: 'overlay', x: 0, y: 0.60, w: 1, h: 0.40, fill: '#0F172A', fill2: 'transparent', gradientDir: 'v', opacity: 0.9 },
    // Product name
    { type: 'text', role: 'text', x: 0.5, y: 0.695, w: 0.85, h: 0.07, text: 'Nama Produk Kamu', fontSize: 0.05, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#FFFFFF' },
    // Price — yellow, large
    { type: 'text', role: 'text', x: 0.5, y: 0.775, w: 0.7, h: 0.09, text: 'Rp 99.000', fontSize: 0.08, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#FFE600' },
    // Was price (strikethrough placeholder)
    { type: 'text', role: 'text', x: 0.5, y: 0.855, w: 0.5, h: 0.05, text: 'Normal Rp 199.000', fontSize: 0.030, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#94A3B8' },
    // CTA button
    { type: 'rect', role: 'decoration', x: 0.25, y: 0.895, w: 0.50, h: 0.072, fill: '#2563EB', rx: 0.15 },
    { type: 'text', role: 'text', x: 0.5, y: 0.930, w: 0.48, h: 0.05, text: 'Order Sekarang', fontSize: 0.035, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#FFFFFF' },
    // Logo placeholder
    { type: 'image_placeholder', role: 'logo', x: 0.04, y: 0.04, w: 0.12, h: 0.08, imageTag: 'logo', objectFit: 'contain' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 02. IG_MINIMAL_WHITE
// Clean white, luxury minimal, foto pojok kanan
// ══════════════════════════════════════════════════════════════
const IG_MINIMAL_WHITE: TemplateDefinition = {
  id:            'ig_minimal_white',
  name:          'Minimal White',
  description:   'Clean minimalist putih. Cocok untuk produk premium, fashion, beauty.',
  category:      'instagram_feed',
  categoryLabel: 'Instagram Feed',
  canvas:        { width: 1080, height: 1080 },
  palette: { primary: '#FFFFFF', secondary: '#0F172A', bg: '#FAFAFA', text: '#0F172A', accent: '#2563EB' },
  fonts:   ['Playfair Display', 'DM Sans'],
  tags:    ['minimal', 'white', 'luxury', 'fashion'],
  layers: [
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#FAFAFA' },
    // Left block color strip
    { type: 'rect', role: 'decoration', x: 0, y: 0, w: 0.045, h: 1, fill: '#0F172A' },
    // Photo right-top
    { type: 'image_placeholder', role: 'photo', x: 0.42, y: 0.05, w: 0.55, h: 0.65, imageTag: 'product_photo', objectFit: 'contain' },
    // Brand name
    { type: 'text', role: 'text', x: 0.24, y: 0.10, w: 0.36, h: 0.06, text: 'NAMA TOKO', fontSize: 0.025, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8', letterSpacing: 4 },
    // Product name serif
    { type: 'text', role: 'text', x: 0.24, y: 0.17, w: 0.38, h: 0.22, text: 'Nama Produk Kamu', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Playfair Display', textAlign: 'left', fill: '#0F172A' },
    // Tagline
    { type: 'text', role: 'text', x: 0.24, y: 0.42, w: 0.36, h: 0.06, text: 'Kualitas terpercaya untuk kebutuhan kamu sehari-hari', fontSize: 0.020, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#475569' },
    // Divider line
    { type: 'line', role: 'decoration', x: 0.24, y: 0.52, w: 0.14, h: 0, strokeColor: '#0F172A', strokeWidth: 0.003 },
    // Price
    { type: 'text', role: 'text', x: 0.24, y: 0.55, w: 0.36, h: 0.09, text: 'Rp 299.000', fontSize: 0.06, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#0F172A' },
    // CTA text
    { type: 'text', role: 'text', x: 0.24, y: 0.65, w: 0.28, h: 0.05, text: 'Shop Now →', fontSize: 0.025, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#2563EB' },
    // Bottom grid / pattern strip
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.90, w: 0.90, h: 0.003, fill: '#E2E8F0' },
    { type: 'text', role: 'text', x: 0.5, y: 0.93, w: 0.88, h: 0.05, text: 'www.tokosaya.com  ·  @namatoko', fontSize: 0.020, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#94A3B8' },
    // Logo small
    { type: 'image_placeholder', role: 'logo', x: 0.85, y: 0.90, w: 0.10, h: 0.07, imageTag: 'logo', objectFit: 'contain' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 03. IG_PROMO_SALE
// Energy merah-oranye, flash sale vibes, diskon besar
// ══════════════════════════════════════════════════════════════
const IG_PROMO_SALE: TemplateDefinition = {
  id:            'ig_promo_sale',
  name:          'Flash Sale',
  description:   'Energetik merah-oranye. Untuk flash sale dan diskon besar.',
  category:      'instagram_feed',
  categoryLabel: 'Instagram Feed',
  canvas:        { width: 1080, height: 1080 },
  palette: { primary: '#DC2626', secondary: '#F97316', bg: '#DC2626', text: '#FFFFFF', accent: '#FFE600' },
  fonts:   ['Bebas Neue', 'Montserrat'],
  tags:    ['sale', 'promo', 'red', 'energetic'],
  layers: [
    // BG gradient red → orange
    { type: 'gradient_rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#DC2626', fill2: '#F97316', gradientDir: 'diagonal' },
    // Top badge "FLASH SALE"
    { type: 'rect', role: 'decoration', x: 0.15, y: 0.03, w: 0.70, h: 0.10, fill: '#FFE600', rx: 0.08 },
    { type: 'text', role: 'text', x: 0.5, y: 0.078, w: 0.68, h: 0.07, text: '⚡ FLASH SALE ⚡', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#DC2626', letterSpacing: 4 },
    // Product photo
    { type: 'image_placeholder', role: 'photo', x: 0.10, y: 0.15, w: 0.80, h: 0.48, imageTag: 'product_photo', objectFit: 'contain' },
    // Discount badge circle
    { type: 'circle', role: 'decoration', x: 0.72, y: 0.12, w: 0.22, h: 0.22, fill: '#FFFFFF', opacity: 1 },
    { type: 'text', role: 'text', x: 0.83, y: 0.185, w: 0.18, h: 0.12, text: '50%\nOFF', fontSize: 0.055, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#DC2626' },
    // Dark overlay bottom
    { type: 'rect', role: 'overlay', x: 0, y: 0.62, w: 1, h: 0.38, fill: '#1A0000', opacity: 0.5 },
    // Product name
    { type: 'text', role: 'text', x: 0.5, y: 0.650, w: 0.90, h: 0.08, text: 'NAMA PRODUK KAMU', fontSize: 0.055, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 3 },
    // Price row
    { type: 'text', role: 'text', x: 0.32, y: 0.740, w: 0.35, h: 0.07, text: 'Rp 49.000', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFE600' },
    { type: 'text', role: 'text', x: 0.73, y: 0.750, w: 0.25, h: 0.05, text: 'Rp 99.000', fontSize: 0.032, fontWeight: 'normal', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFBABA' },
    // CTA
    { type: 'rect', role: 'decoration', x: 0.15, y: 0.830, w: 0.70, h: 0.085, fill: '#FFFFFF', rx: 0.10 },
    { type: 'text', role: 'text', x: 0.5, y: 0.865, w: 0.68, h: 0.06, text: 'ORDER SEKARANG!', fontSize: 0.040, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#DC2626', letterSpacing: 2 },
    // Scarcity
    { type: 'text', role: 'text', x: 0.5, y: 0.940, w: 0.80, h: 0.05, text: '🔥 Stok terbatas! Jangan sampai kehabisan', fontSize: 0.022, fontWeight: 'normal', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFE600' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 04. STORY_GRADIENT
// 9:16 — purple-blue gradient, text center, CTA bawah
// ══════════════════════════════════════════════════════════════
const STORY_GRADIENT: TemplateDefinition = {
  id:            'story_gradient',
  name:          'Story Gradient',
  description:   'Gradient ungu-biru estetik. Cocok untuk story promosi soft selling.',
  category:      'instagram_story',
  categoryLabel: 'Instagram Story',
  canvas:        { width: 1080, height: 1920 },
  palette: { primary: '#7C3AED', secondary: '#2563EB', bg: '#4C1D95', text: '#FFFFFF', accent: '#F0ABFC' },
  fonts:   ['Poppins', 'DM Sans'],
  tags:    ['gradient', 'story', 'aesthetic', 'purple'],
  layers: [
    { type: 'gradient_rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#4C1D95', fill2: '#1E40AF', gradientDir: 'v' },
    // Decorative circles
    { type: 'circle', role: 'decoration', x: 0.6, y: 0.02, w: 0.7, h: 0.7, fill: '#7C3AED', opacity: 0.3 },
    { type: 'circle', role: 'decoration', x: -0.2, y: 0.6, w: 0.6, h: 0.6, fill: '#2563EB', opacity: 0.2 },
    // Brand name top
    { type: 'text', role: 'text', x: 0.5, y: 0.058, w: 0.80, h: 0.045, text: 'NAMA TOKO', fontSize: 0.020, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#E9D5FF', letterSpacing: 5 },
    // Decorative line
    { type: 'rect', role: 'decoration', x: 0.35, y: 0.11, w: 0.30, h: 0.002, fill: '#E9D5FF', opacity: 0.5 },
    // Product photo center
    { type: 'image_placeholder', role: 'photo', x: 0.10, y: 0.14, w: 0.80, h: 0.45, imageTag: 'product_photo', objectFit: 'contain' },
    // Tag/label
    { type: 'rect', role: 'decoration', x: 0.30, y: 0.61, w: 0.40, h: 0.04, fill: '#FFFFFF', opacity: 0.15, rx: 0.5 },
    { type: 'text', role: 'text', x: 0.5, y: 0.617, w: 0.38, h: 0.04, text: '✨ NEW ARRIVAL ✨', fontSize: 0.016, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#F0ABFC' },
    // Product name
    { type: 'text', role: 'text', x: 0.5, y: 0.665, w: 0.85, h: 0.10, text: 'Nama Produk Kamu', fontSize: 0.055, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#FFFFFF' },
    // Tagline
    { type: 'text', role: 'text', x: 0.5, y: 0.755, w: 0.78, h: 0.07, text: 'Deskripsi singkat produk yang bikin orang penasaran', fontSize: 0.025, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#C4B5FD' },
    // Price
    { type: 'text', role: 'text', x: 0.5, y: 0.830, w: 0.60, h: 0.07, text: 'Mulai Rp 99.000', fontSize: 0.040, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#FFFFFF' },
    // CTA button
    { type: 'rect', role: 'decoration', x: 0.15, y: 0.89, w: 0.70, h: 0.065, fill: '#FFFFFF', rx: 0.08 },
    { type: 'text', role: 'text', x: 0.5, y: 0.915, w: 0.68, h: 0.04, text: 'Swipe Up untuk Order 👆', fontSize: 0.028, fontWeight: 'bold', fontFamily: 'Poppins', textAlign: 'center', fill: '#7C3AED' },
    // Bottom safe zone
    { type: 'text', role: 'text', x: 0.5, y: 0.965, w: 0.70, h: 0.03, text: '@namatoko', fontSize: 0.016, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#E9D5FF', opacity: 0.7 },
  ],
}

// ══════════════════════════════════════════════════════════════
// 05. STORY_SPLIT
// 9:16 — atas foto (60%), bawah info + harga (40%)
// ══════════════════════════════════════════════════════════════
const STORY_SPLIT: TemplateDefinition = {
  id:            'story_split',
  name:          'Story Split',
  description:    'Foto atas 60%, info produk bawah 40%. Clean dan informatif.',
  category:      'instagram_story',
  categoryLabel: 'Instagram Story',
  canvas:        { width: 1080, height: 1920 },
  palette: { primary: '#0F172A', secondary: '#2563EB', bg: '#F8FAFC', text: '#0F172A', accent: '#2563EB' },
  fonts:   ['Fraunces', 'DM Sans'],
  tags:    ['split', 'clean', 'story', 'info'],
  layers: [
    // Top photo section bg
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 0.62, fill: '#E2E8F0' },
    // Bottom info section
    { type: 'rect', role: 'decoration', x: 0, y: 0.62, w: 1, h: 0.38, fill: '#0F172A' },
    // Photo
    { type: 'image_placeholder', role: 'photo', x: 0.05, y: 0.04, w: 0.90, h: 0.56, imageTag: 'product_photo', objectFit: 'contain' },
    // Rounded tab connector
    { type: 'rect', role: 'decoration', x: 0.35, y: 0.605, w: 0.30, h: 0.045, fill: '#0F172A', rx: 0.8 },
    // Logo top
    { type: 'image_placeholder', role: 'logo', x: 0.04, y: 0.03, w: 0.12, h: 0.07, imageTag: 'logo', objectFit: 'contain' },
    // Bottom: store name
    { type: 'text', role: 'text', x: 0.08, y: 0.645, w: 0.65, h: 0.040, text: 'NAMA TOKO', fontSize: 0.018, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8', letterSpacing: 4 },
    // Product name
    { type: 'text', role: 'text', x: 0.08, y: 0.690, w: 0.84, h: 0.12, text: 'Nama Produk Kamu', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Fraunces', textAlign: 'left', fill: '#FFFFFF' },
    // Tagline
    { type: 'text', role: 'text', x: 0.08, y: 0.800, w: 0.75, h: 0.06, text: 'Deskripsi benefit produk singkat padat', fontSize: 0.025, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8' },
    // Divider
    { type: 'rect', role: 'decoration', x: 0.08, y: 0.860, w: 0.84, h: 0.002, fill: '#334155' },
    // Price row
    { type: 'text', role: 'text', x: 0.08, y: 0.875, w: 0.50, h: 0.06, text: 'Rp 149.000', fontSize: 0.048, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#FFFFFF' },
    // CTA
    { type: 'rect', role: 'decoration', x: 0.60, y: 0.873, w: 0.32, h: 0.055, fill: '#2563EB', rx: 0.12 },
    { type: 'text', role: 'text', x: 0.76, y: 0.892, w: 0.30, h: 0.04, text: 'DM Kami', fontSize: 0.026, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#FFFFFF' },
    // Handle bottom
    { type: 'text', role: 'text', x: 0.5, y: 0.948, w: 0.84, h: 0.04, text: 'Tap link di bio atau DM @namatoko', fontSize: 0.018, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#475569' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 06. TIKTOK_VIRAL
// 9:16 — hook besar di atas, foto produk, bottom CTA
// ══════════════════════════════════════════════════════════════
const TIKTOK_VIRAL: TemplateDefinition = {
  id:            'tiktok_viral',
  name:          'TikTok Viral Hook',
  description:   'Hook teks besar di atas. Pattern konten viral TikTok affiliator.',
  category:      'tiktok',
  categoryLabel: 'TikTok',
  canvas:        { width: 1080, height: 1920 },
  palette: { primary: '#000000', secondary: '#FE2C55', bg: '#000000', text: '#FFFFFF', accent: '#25F4EE' },
  fonts:   ['Bebas Neue', 'Montserrat'],
  tags:    ['tiktok', 'viral', 'hook', 'black'],
  layers: [
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#000000' },
    // TikTok diagonal accent
    { type: 'rect', role: 'decoration', x: -0.1, y: 0.0, w: 0.5, h: 0.006, fill: '#FE2C55', opacity: 0.8 },
    { type: 'rect', role: 'decoration', x: 0.6,  y: 0.0, w: 0.5, h: 0.006, fill: '#25F4EE', opacity: 0.8 },
    // HOOK text
    { type: 'text', role: 'text', x: 0.5, y: 0.05, w: 0.88, h: 0.14, text: 'POV: Kamu akhirnya\nnemu ini 👀', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 2 },
    // Product photo
    { type: 'image_placeholder', role: 'photo', x: 0.05, y: 0.20, w: 0.90, h: 0.52, imageTag: 'product_photo', objectFit: 'contain' },
    // Gradient overlay bottom
    { type: 'gradient_rect', role: 'overlay', x: 0, y: 0.65, w: 1, h: 0.35, fill: '#000000', fill2: 'transparent', gradientDir: 'v', opacity: 0.95 },
    // Product name
    { type: 'text', role: 'text', x: 0.5, y: 0.735, w: 0.85, h: 0.08, text: 'Nama Produk Kamu', fontSize: 0.048, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFFFFF' },
    // Price
    { type: 'text', role: 'text', x: 0.5, y: 0.810, w: 0.65, h: 0.07, text: 'Cuma Rp 99.000!', fontSize: 0.050, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FE2C55' },
    // Social proof
    { type: 'text', role: 'text', x: 0.5, y: 0.870, w: 0.80, h: 0.05, text: '⭐⭐⭐⭐⭐  1.500+ terjual', fontSize: 0.026, fontWeight: 'normal', fontFamily: 'Montserrat', textAlign: 'center', fill: '#25F4EE' },
    // CTA strip
    { type: 'rect', role: 'decoration', x: 0, y: 0.915, w: 1, h: 0.060, fill: '#FE2C55' },
    { type: 'text', role: 'text', x: 0.5, y: 0.937, w: 0.90, h: 0.04, text: 'LINK DI BIO • KLIK KERANJANG • DM KAMI', fontSize: 0.030, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 3 },
    // Safe zone bottom
    { type: 'text', role: 'text', x: 0.5, y: 0.970, w: 0.70, h: 0.03, text: '@namatoko', fontSize: 0.018, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#94A3B8' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 07. SHOPEE_FLASH_SALE
// 800×400 banner — oranye Shopee, diskon, produk, urgensi
// ══════════════════════════════════════════════════════════════
const SHOPEE_FLASH_SALE: TemplateDefinition = {
  id:            'shopee_flash_sale',
  name:          'Shopee Flash Sale',
  description:   'Banner Shopee 800×400. Warna oranye khas Shopee, info flash sale.',
  category:      'shopee_banner',
  categoryLabel: 'Shopee Banner',
  canvas:        { width: 800, height: 400 },
  palette: { primary: '#EE4D2D', secondary: '#FF6B35', bg: '#EE4D2D', text: '#FFFFFF', accent: '#FFD700' },
  fonts:   ['Montserrat', 'DM Sans'],
  tags:    ['shopee', 'banner', 'sale', 'orange'],
  layers: [
    { type: 'gradient_rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#EE4D2D', fill2: '#FF6B35', gradientDir: 'h' },
    // Wave decoration
    { type: 'circle', role: 'decoration', x: 0.55, y: -0.3, w: 0.9, h: 1.8, fill: '#FF8A65', opacity: 0.25 },
    // Flash sale badge
    { type: 'rect', role: 'decoration', x: 0.03, y: 0.08, w: 0.22, h: 0.22, fill: '#FFD700', rx: 0.08 },
    { type: 'text', role: 'text', x: 0.14, y: 0.12, w: 0.20, h: 0.16, text: '⚡\nFLASH\nSALE', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#EE4D2D' },
    // Discount %
    { type: 'text', role: 'text', x: 0.07, y: 0.33, w: 0.20, h: 0.30, text: 'UP TO\n60%\nOFF', fontSize: 0.080, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFFFFF' },
    // Vertical divider
    { type: 'rect', role: 'decoration', x: 0.285, y: 0.10, w: 0.004, h: 0.80, fill: '#FFFFFF', opacity: 0.30 },
    // Product photo
    { type: 'image_placeholder', role: 'photo', x: 0.30, y: 0.03, w: 0.38, h: 0.94, imageTag: 'product_photo', objectFit: 'contain' },
    // Right info panel
    { type: 'text', role: 'text', x: 0.74, y: 0.10, w: 0.24, h: 0.20, text: 'Nama\nProduk', fontSize: 0.065, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFFFFF' },
    { type: 'text', role: 'text', x: 0.74, y: 0.35, w: 0.24, h: 0.22, text: 'Rp 49.000', fontSize: 0.070, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#FFD700' },
    { type: 'text', role: 'text', x: 0.74, y: 0.58, w: 0.24, h: 0.14, text: 'Rp 99.000', fontSize: 0.040, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#FFCDD2' },
    // Limited stock
    { type: 'rect', role: 'decoration', x: 0.68, y: 0.74, w: 0.30, h: 0.18, fill: '#FFFFFF', rx: 0.10 },
    { type: 'text', role: 'text', x: 0.83, y: 0.79, w: 0.28, h: 0.12, text: 'BELI\nSEKARANG', fontSize: 0.045, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#EE4D2D' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 08. TOKOPEDIA_GREEN
// 800×400 — hijau Tokopedia, clean professional
// ══════════════════════════════════════════════════════════════
const TOKOPEDIA_GREEN: TemplateDefinition = {
  id:            'tokopedia_green',
  name:          'Tokopedia Banner',
  description:   'Banner Tokopedia 800×400. Hijau official, tampilan clean & terpercaya.',
  category:      'tokopedia_banner',
  categoryLabel: 'Tokopedia Banner',
  canvas:        { width: 800, height: 400 },
  palette: { primary: '#03AC0E', secondary: '#00880F', bg: '#03AC0E', text: '#FFFFFF', accent: '#FFD700' },
  fonts:   ['Montserrat', 'DM Sans'],
  tags:    ['tokopedia', 'banner', 'green', 'clean'],
  layers: [
    { type: 'gradient_rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#03AC0E', fill2: '#00880F', gradientDir: 'h' },
    // Circle decoration
    { type: 'circle', role: 'decoration', x: 0.7, y: -0.2, w: 0.8, h: 1.6, fill: '#00A30C', opacity: 0.3 },
    { type: 'circle', role: 'decoration', x: -0.1, y: 0.5, w: 0.4, h: 0.8, fill: '#05C214', opacity: 0.2 },
    // Product photo left
    { type: 'image_placeholder', role: 'photo', x: 0.02, y: 0.04, w: 0.42, h: 0.92, imageTag: 'product_photo', objectFit: 'contain' },
    // Right info
    { type: 'text', role: 'text', x: 0.50, y: 0.08, w: 0.48, h: 0.08, text: '✓ TERPERCAYA', fontSize: 0.040, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'left', fill: '#FFFFFF', opacity: 0.8, letterSpacing: 2 },
    { type: 'text', role: 'text', x: 0.50, y: 0.18, w: 0.48, h: 0.24, text: 'Nama Produk Kamu', fontSize: 0.080, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'left', fill: '#FFFFFF' },
    { type: 'text', role: 'text', x: 0.50, y: 0.43, w: 0.48, h: 0.14, text: 'Deskripsi singkat benefit produk yang menarik', fontSize: 0.038, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#FFFFFF', opacity: 0.85 },
    // Divider
    { type: 'rect', role: 'decoration', x: 0.50, y: 0.59, w: 0.16, h: 0.004, fill: '#FFFFFF', opacity: 0.4 },
    // Price
    { type: 'text', role: 'text', x: 0.50, y: 0.62, w: 0.48, h: 0.20, text: 'Rp 149.000', fontSize: 0.095, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'left', fill: '#FFD700' },
    // CTA
    { type: 'rect', role: 'decoration', x: 0.50, y: 0.80, w: 0.28, h: 0.16, fill: '#FFFFFF', rx: 0.10 },
    { type: 'text', role: 'text', x: 0.64, y: 0.84, w: 0.26, h: 0.10, text: 'Beli\nSekarang', fontSize: 0.042, fontWeight: 'bold', fontFamily: 'Montserrat', textAlign: 'center', fill: '#03AC0E' },
    // Logo placeholder
    { type: 'image_placeholder', role: 'logo', x: 0.86, y: 0.82, w: 0.12, h: 0.14, imageTag: 'logo', objectFit: 'contain' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 09. PRODUCT_REVIEW
// 1:1 — testimonial / review style, bintang, quote text
// ══════════════════════════════════════════════════════════════
const PRODUCT_REVIEW: TemplateDefinition = {
  id:            'product_review',
  name:          'Testimoni / Review',
  description:   'Template review produk. Foto + bintang + kutipan pelanggan nyata.',
  category:      'universal',
  categoryLabel: 'Universal',
  canvas:        { width: 1080, height: 1080 },
  palette: { primary: '#FAFAFA', secondary: '#F59E0B', bg: '#FFFBF0', text: '#1C1C1C', accent: '#F59E0B' },
  fonts:   ['Playfair Display', 'DM Sans'],
  tags:    ['review', 'testimoni', 'trust', 'social-proof'],
  layers: [
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#FFFBF0' },
    // Top banner
    { type: 'rect', role: 'decoration', x: 0, y: 0, w: 1, h: 0.08, fill: '#1C1C1C' },
    { type: 'text', role: 'text', x: 0.5, y: 0.022, w: 0.80, h: 0.05, text: 'APA KATA MEREKA 💬', fontSize: 0.030, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#F59E0B', letterSpacing: 3 },
    // Product photo (left, card style)
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.10, w: 0.38, h: 0.45, fill: '#F1F5F9', rx: 0.04 },
    { type: 'image_placeholder', role: 'photo', x: 0.07, y: 0.11, w: 0.36, h: 0.43, imageTag: 'product_photo', objectFit: 'contain' },
    // Right panel info
    { type: 'text', role: 'text', x: 0.52, y: 0.115, w: 0.44, h: 0.06, text: '⭐⭐⭐⭐⭐', fontSize: 0.045, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#F59E0B' },
    { type: 'text', role: 'text', x: 0.52, y: 0.175, w: 0.44, h: 0.07, text: '5.0 / 5.0', fontSize: 0.048, fontWeight: 'bold', fontFamily: 'Playfair Display', textAlign: 'left', fill: '#1C1C1C' },
    { type: 'text', role: 'text', x: 0.52, y: 0.245, w: 0.44, h: 0.04, text: 'Dari 2.400 ulasan', fontSize: 0.020, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#64748B' },
    // Divider
    { type: 'rect', role: 'decoration', x: 0.52, y: 0.300, w: 0.22, h: 0.003, fill: '#E2E8F0' },
    // Product name
    { type: 'text', role: 'text', x: 0.52, y: 0.315, w: 0.44, h: 0.12, text: 'Nama Produk', fontSize: 0.060, fontWeight: 'bold', fontFamily: 'Playfair Display', textAlign: 'left', fill: '#1C1C1C' },
    // Price
    { type: 'text', role: 'text', x: 0.52, y: 0.440, w: 0.40, h: 0.06, text: 'Rp 149.000', fontSize: 0.042, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#1C1C1C' },
    // Quote box 1
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.58, w: 0.88, h: 0.14, fill: '#FFF8E1', rx: 0.03 },
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.58, w: 0.006, h: 0.14, fill: '#F59E0B' },
    { type: 'text', role: 'text', x: 0.115, y: 0.600, w: 0.76, h: 0.10, text: '"Produknya bagus banget, pengiriman cepet, packagingnya aman. Udah repeat order 3x!"', fontSize: 0.024, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#334155' },
    { type: 'text', role: 'text', x: 0.115, y: 0.700, w: 0.40, h: 0.03, text: '— Sari D., Jakarta ✓ Pembeli terverifikasi', fontSize: 0.018, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8' },
    // Quote box 2
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.75, w: 0.88, h: 0.12, fill: '#FFF8E1', rx: 0.03 },
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.75, w: 0.006, h: 0.12, fill: '#F59E0B' },
    { type: 'text', role: 'text', x: 0.115, y: 0.770, w: 0.76, h: 0.08, text: '"Kualitasnya diluar ekspektasi, worth it banget! Recommended buat yang masih ragu."', fontSize: 0.024, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#334155' },
    // CTA
    { type: 'rect', role: 'decoration', x: 0.15, y: 0.885, w: 0.70, h: 0.075, fill: '#1C1C1C', rx: 0.09 },
    { type: 'text', role: 'text', x: 0.50, y: 0.913, w: 0.68, h: 0.05, text: 'Buktikan Sendiri →', fontSize: 0.035, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#FFFFFF' },
    { type: 'text', role: 'text', x: 0.50, y: 0.965, w: 0.80, h: 0.04, text: 'DM atau klik link di bio @namatoko', fontSize: 0.018, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#94A3B8' },
  ],
}

// ══════════════════════════════════════════════════════════════
// 10. BEFORE_AFTER
// 1:1 — split kiri/kanan before vs after
// ══════════════════════════════════════════════════════════════
const BEFORE_AFTER: TemplateDefinition = {
  id:            'before_after',
  name:          'Before & After',
  description:   'Split layout sebelum vs sesudah. Cocok untuk produk skincare/cleaning.',
  category:      'universal',
  categoryLabel: 'Universal',
  canvas:        { width: 1080, height: 1080 },
  palette: { primary: '#0F172A', secondary: '#16A34A', bg: '#0F172A', text: '#FFFFFF', accent: '#16A34A' },
  fonts:   ['Bebas Neue', 'DM Sans'],
  tags:    ['before-after', 'skincare', 'transformation', 'split'],
  layers: [
    { type: 'rect', role: 'bg', x: 0, y: 0, w: 1, h: 1, fill: '#0F172A' },
    // BEFORE panel (left)
    { type: 'rect', role: 'decoration', x: 0.02, y: 0.12, w: 0.46, h: 0.72, fill: '#1E293B', rx: 0.025 },
    { type: 'image_placeholder', role: 'photo', x: 0.03, y: 0.13, w: 0.44, h: 0.55, imageTag: 'product_photo', objectFit: 'cover' },
    { type: 'rect', role: 'decoration', x: 0.06, y: 0.70, w: 0.14, h: 0.05, fill: '#DC2626', rx: 0.1 },
    { type: 'text', role: 'text', x: 0.13, y: 0.712, w: 0.12, h: 0.04, text: 'BEFORE', fontSize: 0.020, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 2 },
    { type: 'text', role: 'text', x: 0.25, y: 0.72, w: 0.22, h: 0.08, text: 'Sebelum pakai produk', fontSize: 0.022, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8' },
    // AFTER panel (right)
    { type: 'rect', role: 'decoration', x: 0.52, y: 0.12, w: 0.46, h: 0.72, fill: '#1E293B', rx: 0.025 },
    { type: 'image_placeholder', role: 'photo', x: 0.53, y: 0.13, w: 0.44, h: 0.55, imageTag: 'product_photo', objectFit: 'cover' },
    { type: 'rect', role: 'decoration', x: 0.56, y: 0.70, w: 0.12, h: 0.05, fill: '#16A34A', rx: 0.1 },
    { type: 'text', role: 'text', x: 0.62, y: 0.712, w: 0.10, h: 0.04, text: 'AFTER', fontSize: 0.020, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 2 },
    { type: 'text', role: 'text', x: 0.75, y: 0.72, w: 0.22, h: 0.08, text: 'Sesudah pakai produk', fontSize: 0.022, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'left', fill: '#94A3B8' },
    // Center divider
    { type: 'rect', role: 'decoration', x: 0.488, y: 0.12, w: 0.024, h: 0.72, fill: '#0F172A' },
    { type: 'circle', role: 'decoration', x: 0.46, y: 0.44, w: 0.08, h: 0.08, fill: '#FFFFFF' },
    { type: 'text', role: 'text', x: 0.50, y: 0.455, w: 0.06, h: 0.05, text: 'VS', fontSize: 0.032, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#0F172A' },
    // Header
    { type: 'rect', role: 'decoration', x: 0.02, y: 0.02, w: 0.96, h: 0.085, fill: '#16A34A', rx: 0.025 },
    { type: 'text', role: 'text', x: 0.5, y: 0.042, w: 0.94, h: 0.055, text: '✨ TRANSFORMASI NYATA', fontSize: 0.050, fontWeight: 'bold', fontFamily: 'Bebas Neue', textAlign: 'center', fill: '#FFFFFF', letterSpacing: 4 },
    // Bottom CTA
    { type: 'text', role: 'text', x: 0.5, y: 0.86, w: 0.85, h: 0.045, text: 'Nama Produk Ajaib Kamu', fontSize: 0.040, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#FFFFFF' },
    { type: 'text', role: 'text', x: 0.5, y: 0.91, w: 0.70, h: 0.04, text: 'Rp 89.000  •  Garansi Puas atau Uang Kembali', fontSize: 0.022, fontWeight: 'normal', fontFamily: 'DM Sans', textAlign: 'center', fill: '#94A3B8' },
    { type: 'rect', role: 'decoration', x: 0.30, y: 0.950, w: 0.40, h: 0.038, fill: '#16A34A', rx: 0.12 },
    { type: 'text', role: 'text', x: 0.50, y: 0.963, w: 0.38, h: 0.030, text: 'Coba Sekarang →', fontSize: 0.022, fontWeight: 'bold', fontFamily: 'DM Sans', textAlign: 'center', fill: '#FFFFFF' },
  ],
}

// ══════════════════════════════════════════════════════════════
// REGISTRY — all templates
// ══════════════════════════════════════════════════════════════
export const TEMPLATES: TemplateDefinition[] = [
  IG_PRODUCT_BOLD,
  IG_MINIMAL_WHITE,
  IG_PROMO_SALE,
  STORY_GRADIENT,
  STORY_SPLIT,
  TIKTOK_VIRAL,
  SHOPEE_FLASH_SALE,
  TOKOPEDIA_GREEN,
  PRODUCT_REVIEW,
  BEFORE_AFTER,
]

export const TEMPLATES_BY_ID: Record<string, TemplateDefinition> =
  Object.fromEntries(TEMPLATES.map(t => [t.id, t]))

export const TEMPLATES_BY_CATEGORY: Record<TemplateCategory, TemplateDefinition[]> = {
  instagram_feed:     TEMPLATES.filter(t => t.category === 'instagram_feed'),
  instagram_story:    TEMPLATES.filter(t => t.category === 'instagram_story'),
  tiktok:             TEMPLATES.filter(t => t.category === 'tiktok'),
  shopee_banner:      TEMPLATES.filter(t => t.category === 'shopee_banner'),
  tokopedia_banner:   TEMPLATES.filter(t => t.category === 'tokopedia_banner'),
  universal:          TEMPLATES.filter(t => t.category === 'universal'),
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  instagram_feed:   'Instagram Feed',
  instagram_story:  'Instagram Story',
  tiktok:           'TikTok',
  shopee_banner:    'Shopee Banner',
  tokopedia_banner: 'Tokopedia Banner',
  universal:        'Universal',
}