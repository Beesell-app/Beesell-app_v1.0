// apps/web-app/lib/canvas/fabric-config.ts
// ── Fabric.js canvas configuration ──────────────────────────

// ══════════════════════════════════════════════════════════════
// CANVAS PRESETS — per platform
// ══════════════════════════════════════════════════════════════
export const CANVAS_PRESETS = {
  instagram_feed: {
    label:    'Instagram Feed',
    icon:     '📷',
    width:    1080,
    height:   1080,
    aspect:   '1:1',
    dpr:      2,       // display at 540×540, export at 1080×1080
  },
  instagram_reels: {
    label:    'Instagram Reels',
    icon:     '🎬',
    width:    1080,
    height:   1920,
    aspect:   '9:16',
    dpr:      2,
  },
  tiktok: {
    label:    'TikTok',
    icon:     '🎵',
    width:    1080,
    height:   1920,
    aspect:   '9:16',
    dpr:      2,
  },
} as const

export type CanvasPreset = keyof typeof CANVAS_PRESETS

// Display size (scaled down for editor)
export const DISPLAY_SCALE = 0.5     // 1080 → 540px display
export const GRID_SIZE     = 20      // px, snap grid spacing
export const SNAP_THRESHOLD = 10     // px, distance to trigger snap

// ══════════════════════════════════════════════════════════════
// LAYER SYSTEM
// ══════════════════════════════════════════════════════════════
export const LAYER_IDS = ['bg', 'photo', 'overlay', 'text', 'logo'] as const
export type LayerId = typeof LAYER_IDS[number]

export const LAYER_CONFIG: Record<LayerId, {
  label:    string
  icon:     string
  zIndex:   number    // Fabric.js canvas z-order
  lockable: boolean
  canDelete: boolean
}> = {
  bg: {
    label:    'Background',
    icon:     '🎨',
    zIndex:   0,
    lockable: true,
    canDelete: false,
  },
  photo: {
    label:    'Foto Produk',
    icon:     '🖼️',
    zIndex:   1,
    lockable: true,
    canDelete: true,
  },
  overlay: {
    label:    'Overlay',
    icon:     '🔲',
    zIndex:   2,
    lockable: true,
    canDelete: false,
  },
  text: {
    label:    'Teks',
    icon:     '✏️',
    zIndex:   3,
    lockable: false,
    canDelete: true,
  },
  logo: {
    label:    'Logo',
    icon:     '⭐',
    zIndex:   4,
    lockable: true,
    canDelete: true,
  },
}

// ══════════════════════════════════════════════════════════════
// TEXT PRESETS — quick-add text types
// ══════════════════════════════════════════════════════════════
export const TEXT_PRESETS = {
  product_name: {
    label:          'Nama Produk',
    defaultText:    'Nama Produk Kamu',
    fontSize:       64,
    fontWeight:     'bold',
    textAlign:      'center',
    fill:           '#FFFFFF',
    hasBackground:  false,
  },
  price: {
    label:          'Harga',
    defaultText:    'Rp 99.000',
    fontSize:       48,
    fontWeight:     'bold',
    textAlign:      'center',
    fill:           '#FFE600',
    hasBackground:  false,
  },
  tagline: {
    label:          'Tagline',
    defaultText:    'Teks promosi kamu',
    fontSize:       36,
    fontWeight:     'normal',
    textAlign:      'center',
    fill:           '#FFFFFF',
    hasBackground:  false,
  },
  store_name: {
    label:          'Nama Toko',
    defaultText:    'Nama Toko',
    fontSize:       28,
    fontWeight:     'normal',
    textAlign:      'left',
    fill:           '#FFFFFF',
    hasBackground:  false,
  },
  cta: {
    label:          'CTA Button',
    defaultText:    'Beli Sekarang!',
    fontSize:       40,
    fontWeight:     'bold',
    textAlign:      'center',
    fill:           '#FFFFFF',
    hasBackground:  true,   // render with bg rect
    bgColor:        '#2563EB',
    bgPadding:      20,
    bgRx:           12,     // border radius
  },
} as const

export type TextPreset = keyof typeof TEXT_PRESETS

// ══════════════════════════════════════════════════════════════
// FONT LIST (Google Fonts — preloaded)
// ══════════════════════════════════════════════════════════════
export const AVAILABLE_FONTS = [
  { family: 'DM Sans',        label: 'DM Sans (Default)' },
  { family: 'Fraunces',       label: 'Fraunces (Display)' },
  { family: 'Poppins',        label: 'Poppins' },
  { family: 'Montserrat',     label: 'Montserrat' },
  { family: 'Inter',          label: 'Inter' },
  { family: 'Playfair Display', label: 'Playfair Display' },
  { family: 'Bebas Neue',     label: 'Bebas Neue' },
  { family: 'Oswald',         label: 'Oswald' },
  { family: 'Raleway',        label: 'Raleway' },
  { family: 'Nunito',         label: 'Nunito' },
] as const

// ══════════════════════════════════════════════════════════════
// OVERLAY PRESETS
// ══════════════════════════════════════════════════════════════
export const OVERLAY_PRESETS = [
  { label: 'Transparan',       opacity: 0,    color: '#000000' },
  { label: 'Gelap ringan',     opacity: 0.2,  color: '#000000' },
  { label: 'Gelap sedang',     opacity: 0.45, color: '#000000' },
  { label: 'Gelap kuat',       opacity: 0.65, color: '#000000' },
  { label: 'Putih ringan',     opacity: 0.25, color: '#FFFFFF' },
  { label: 'Biru Navy',        opacity: 0.6,  color: '#0F172A' },
  { label: 'Gradient bawah',   opacity: 0.8,  color: 'gradient_bottom' },
] as const

// ══════════════════════════════════════════════════════════════
// HISTORY CONFIG
// ══════════════════════════════════════════════════════════════
export const HISTORY_MAX_STACK = 30

// ══════════════════════════════════════════════════════════════
// EXPORT CONFIG
// ══════════════════════════════════════════════════════════════
export const EXPORT_CONFIG = {
  format:     'png' as const,
  multiplier: 2,          // 2× = export at full 1080px
  quality:    1.0,
}