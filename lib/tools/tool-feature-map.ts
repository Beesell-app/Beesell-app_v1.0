// lib/tools/tool-feature-map.ts
// VERIFIKASI: setiap id di kanan HARUS sama persis dengan f.id di
// components/dashboard/studio-menu-config.ts (FEATURES). Ganti kalau beda.

export const TOOL_FEATURE_MAP = {
  '/studio/image/packshot':         'packshot',            // sudah pasti (HERO_IDS)
  '/studio/image/enhancer':         'product-enhancer',    // verifikasi
  '/studio/image/face-swap':        'face-swap',           // verifikasi
  '/studio/image/model-swap':       'model-swap',          // verifikasi
  '/studio/image/virtual-tryon':    'ai-tryon',            // verifikasi
  '/studio/image/product-to-model': 'product-to-model',    // verifikasi
  '/content/image':                 'ai-image-generator',  // sudah pasti (HERO_IDS)
  '/content/new':                   'ai-image-generator',  // verifikasi (atau id sendiri)
} as const