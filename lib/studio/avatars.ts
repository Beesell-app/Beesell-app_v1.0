// CUSTOM AVATAR FEATURE — Upload + Collection
// ══════════════════════════════════════════════════════════════
// Two ways to create avatar:
// 1. User uploads own photo → AI converts to avatar
// 2. Choose from Beesell's pre-made avatar collection
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// DATA MODELS
// ══════════════════════════════════════════════════════════════

/**
 * Avatar source types
 */
export type AvatarSourceType = 'preset' | 'custom' | 'collection'

/**
 * Preset avatars (built-in, no upload needed)
 * These match your existing CHARACTER_FEMALE / CHARACTER_MALE
 */
export interface PresetAvatar {
  id: string // 'char-fem-01', 'char-male-02', etc
  name: string
  label: string
  icon: string // emoji
  age: string
  gender: 'female' | 'male'
  description: string
  avatarBg: string
  category: string // 'teenager', 'professional', 'homemaker', etc
  type: 'preset'
}

/**
 * Collection avatars (Beesell curated + trained)
 * Pre-processed, ready to use via D-ID
 */
export interface CollectionAvatar {
  id: string // 'coll-beauty-01', 'coll-tech-02'
  name: string
  label: string
  description: string
  thumbnail: string // Image URL for preview
  fullImage: string // Full-res image for D-ID
  dIdImageUrl: string // D-ID API compatible URL
  category: string // 'beauty', 'tech', 'fitness', 'fashion', 'general'
  subcategory?: string // 'skincare', 'makeup', 'skincare-guy', etc
  platform: string // 'tiktok', 'instagram', 'youtube', 'all'
  ethnicBackground: string // 'southeast-asian', 'indian', 'east-asian', 'caucasian', etc
  style: string // 'professional', 'casual', 'influencer', 'corporate'
  gender: 'female' | 'male' | 'other'
  type: 'collection'
  training_status: 'ready' | 'training' | 'pending'
}

/**
 * Custom uploaded avatar
 * User uploads photo → we process + store + return ID
 */
export interface CustomAvatar {
  id: string // 'custom-user-123-001'
  user_id: string
  name: string
  original_image_url: string // Uploaded by user (S3/R2)
  processed_image_url: string // After AI processing
  dIdImageUrl: string // D-ID ready URL
  created_at: string
  type: 'custom'
  status: 'processing' | 'ready' | 'failed'
  error_message?: string
}

/**
 * Union type: any avatar the system can use
 */
export type Avatar = PresetAvatar | CollectionAvatar | CustomAvatar

export function avatarType(avatar: Avatar): AvatarSourceType {
  return avatar.type
}

// ══════════════════════════════════════════════════════════════
// BEESELL AVATAR COLLECTION
// ══════════════════════════════════════════════════════════════

/**
 * Pre-curated avatars Beesell has trained + tested with D-ID
 * Ready for immediate use
 */

export const AVATAR_COLLECTION: CollectionAvatar[] = [
  // ─────────────────────────────────────────────────────
  // BEAUTY / SKINCARE CATEGORY
  // ─────────────────────────────────────────────────────
  {
    id: 'coll-beauty-01',
    name: 'Raya (Skincare Expert)',
    label: 'Raya',
    description: 'Makeup artist look, professional skincare product reviewer',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/raya-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/raya-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/raya-dId.jpg',
    category: 'beauty',
    subcategory: 'skincare',
    platform: 'tiktok,instagram,youtube',
    ethnicBackground: 'southeast-asian',
    style: 'influencer',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },
  {
    id: 'coll-beauty-02',
    name: 'Siti (Makeup Creator)',
    label: 'Siti',
    description: 'Makeup content creator, bubbly personality, Gen Z vibe',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/siti-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/siti-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/siti-dId.jpg',
    category: 'beauty',
    subcategory: 'makeup',
    platform: 'tiktok,instagram',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },
  {
    id: 'coll-beauty-03',
    name: 'Nita (Skincare Hijab)',
    label: 'Nita',
    description: 'Muslim woman, hijab style, skincare enthusiast',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/nita-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/nita-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/nita-dId.jpg',
    category: 'beauty',
    subcategory: 'skincare',
    platform: 'all',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },

  // ─────────────────────────────────────────────────────
  // TECH / GADGET CATEGORY
  // ─────────────────────────────────────────────────────
  {
    id: 'coll-tech-01',
    name: 'Rendra (Tech Reviewer)',
    label: 'Rendra',
    description: 'Tech savvy guy, casual shirt, authentic product reviewer vibe',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/rendra-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/rendra-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/rendra-dId.jpg',
    category: 'tech',
    subcategory: 'gadget',
    platform: 'youtube,instagram',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'male',
    type: 'collection',
    training_status: 'ready',
  },

  // ─────────────────────────────────────────────────────
  // FASHION CATEGORY
  // ─────────────────────────────────────────────────────
  {
    id: 'coll-fashion-01',
    name: 'Lia (Fashion Influencer)',
    label: 'Lia',
    description: 'Fashion blogger, trendy outfit, confident professional',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/lia-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/lia-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/lia-dId.jpg',
    category: 'fashion',
    platform: 'instagram,tiktok',
    ethnicBackground: 'southeast-asian',
    style: 'influencer',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },

  // ─────────────────────────────────────────────────────
  // HEALTH / FITNESS CATEGORY
  // ─────────────────────────────────────────────────────
  {
    id: 'coll-fitness-01',
    name: 'Ayu (Fitness Coach)',
    label: 'Ayu',
    description: 'Fitness trainer, energetic, health product specialist',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/ayu-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/ayu-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/ayu-dId.jpg',
    category: 'health',
    subcategory: 'fitness',
    platform: 'tiktok,youtube,instagram',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },

  // ─────────────────────────────────────────────────────
  // GENERAL / HOUSEWIFE CATEGORY
  // ─────────────────────────────────────────────────────
  {
    id: 'coll-general-01',
    name: 'Ibu Ratna (Homemaker)',
    label: 'Ibu Ratna',
    description: 'Middle-aged woman, relatable, trustworthy housewife vibe',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/ibu-ratna-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/ibu-ratna-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/ibu-ratna-dId.jpg',
    category: 'general',
    subcategory: 'homemaker',
    platform: 'all',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'female',
    type: 'collection',
    training_status: 'ready',
  },
  {
    id: 'coll-general-02',
    name: 'Pak Budi (General)',
    label: 'Pak Budi',
    description: 'Middle-aged man, casual, trustworthy everyday look',
    thumbnail: 'https://cdn.beesell.ai/avatars/thumbs/pak-budi-thumb.jpg',
    fullImage: 'https://cdn.beesell.ai/avatars/full/pak-budi-full.jpg',
    dIdImageUrl: 'https://cdn.beesell.ai/avatars/d-id/pak-budi-dId.jpg',
    category: 'general',
    platform: 'all',
    ethnicBackground: 'southeast-asian',
    style: 'casual',
    gender: 'male',
    type: 'collection',
    training_status: 'ready',
  },
]

// ══════════════════════════════════════════════════════════════
// GROUP COLLECTION BY CATEGORY + FILTER HELPERS
// ══════════════════════════════════════════════════════════════

export function getCollectionByCategory(category: string): CollectionAvatar[] {
  return AVATAR_COLLECTION.filter(a => a.category === category)
}

export function getCollectionByGender(gender: 'female' | 'male'): CollectionAvatar[] {
  return AVATAR_COLLECTION.filter(a => a.gender === gender)
}

export function getCollectionByPlatform(platform: string): CollectionAvatar[] {
  return AVATAR_COLLECTION.filter(a => a.platform.includes(platform))
}

export function getAvailableCategories(): string[] {
  const cats = new Set(AVATAR_COLLECTION.map(a => a.category))
  return Array.from(cats)
}

// ══════════════════════════════════════════════════════════════
// DATABASE SCHEMA — Custom Avatars
// ══════════════════════════════════════════════════════════════

/**
 * CREATE TABLE user_custom_avatars (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL,
 *   name VARCHAR(100),
 *   original_image_url TEXT,        -- Original uploaded
 *   processed_image_url TEXT,       -- After AI processing (if needed)
 *   d_id_image_url TEXT,            -- D-ID compatible URL
 *   status VARCHAR(50) DEFAULT 'processing', -- processing/ready/failed
 *   error_message TEXT,
 *   api_response JSONB,             -- Full D-ID response
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   FOREIGN KEY (user_id) REFERENCES auth.users(id)
 * );
 *
 * CREATE TABLE user_avatar_usage (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL,
 *   avatar_id VARCHAR(100),         -- 'char-fem-01' OR 'coll-beauty-01' OR 'custom-123-001'
 *   avatar_type VARCHAR(20),        -- 'preset', 'collection', 'custom'
 *   used_in_job_id UUID,            -- ugc_generation_jobs.id
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   FOREIGN KEY (user_id) REFERENCES auth.users(id),
 *   FOREIGN KEY (used_in_job_id) REFERENCES ugc_generation_jobs(id)
 * );
 *
 * CREATE INDEX idx_user_custom_avatars ON user_custom_avatars(user_id)
 * CREATE INDEX idx_user_avatar_usage ON user_avatar_usage(user_id, avatar_type)
 */

// ══════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/studio/avatars
 * ─────────────────────────────────────────────────────────────
 * Fetch all available avatars for user
 *
 * Response:
 * {
 *   presets: [ PresetAvatar[] ],          // From CHARACTER_FEMALE/MALE
 *   collection: [ CollectionAvatar[] ],   // Beesell curated
 *   custom: [ CustomAvatar[] ]            // User uploaded
 * }
 */

/**
 * POST /api/studio/avatars/upload
 * ─────────────────────────────────────────────────────────────
 * User uploads custom avatar photo
 *
 * Request:
 * {
 *   file: File,              // JPEG/PNG, max 10MB
 *   name?: string            // Optional display name
 * }
 *
 * Response (202 - Processing):
 * {
 *   id: 'custom-user-123-001',
 *   status: 'processing',
 *   message: 'Avatar sedang diproses. Akan siap dalam 2-3 menit.'
 * }
 *
 * Or (200 - Immediate):
 * {
 *   id: 'custom-user-123-001',
 *   status: 'ready',
 *   d_id_image_url: '...',
 *   message: 'Avatar siap digunakan'
 * }
 *
 * Or (400 - Error):
 * {
 *   error: 'invalid_image',
 *   message: 'Foto harus JPG/PNG, ukuran min 512px'
 * }
 */

/**
 * GET /api/studio/avatars/:id/status
 * ─────────────────────────────────────────────────────────────
 * Poll custom avatar processing status
 *
 * Response:
 * {
 *   id: 'custom-user-123-001',
 *   status: 'ready' | 'processing' | 'failed',
 *   d_id_image_url: '...' (if ready),
 *   error_message: '...' (if failed)
 * }
 */

/**
 * DELETE /api/studio/avatars/:id
 * ─────────────────────────────────────────────────────────────
 * Delete custom avatar
 *
 * Response:
 * { success: true }
 */

// ══════════════════════════════════════════════════════════════
// UI FLOW — Character Selection (Step 3 — UPDATED)
// ══════════════════════════════════════════════════════════════

/**
 * Current Step 3 only shows presets (CHARACTER_FEMALE/MALE)
 *
 * NEW Step 3 with custom avatar support:
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ Pilih Avatar Karakter                              │
 * ├─────────────────────────────────────────────────────┤
 * │                                                     │
 * │ [Preset] [Collection] [Upload Custom] ← Tabs      │
 * │                                                     │
 * │ IF PRESET TAB SELECTED:                             │
 * │  [👩 Wanita] [👨 Pria] ← Gender filter             │
 * │                                                     │
 * │  ┌──────┬──────┬──────┬──────┐                     │
 * │  │ 👩   │ 👩   │ 👩   │ 👩   │  (Existing presets)│
 * │  │ Rini │ Ayu  │ Siti │ Nita │                    │
 * │  └──────┴──────┴──────┴──────┘                     │
 * │                                                     │
 * │ IF COLLECTION TAB SELECTED:                        │
 * │  [Beauty] [Tech] [Fashion] [Fitness] [General]     │
 * │                                                     │
 * │  ┌──────────────────────────────┐                  │
 * │  │ 👩 Raya (Skincare Expert)   │                  │
 * │  │ Makeup artist, professional  │                  │
 * │  │ Ready to use ✓               │                  │
 * │  └──────────────────────────────┘                  │
 * │                                                     │
 * │  ┌──────────────────────────────┐                  │
 * │  │ 👩 Siti (Makeup Creator)    │                  │
 * │  │ Bubbly, Gen Z vibe           │                  │
 * │  │ Ready to use ✓               │                  │
 * │  └──────────────────────────────┘                  │
 * │                                                     │
 * │ IF UPLOAD CUSTOM TAB SELECTED:                     │
 * │  ┌────────────────────────────┐                    │
 * │  │ Upload Foto Sendiri        │                    │
 * │  │                            │                    │
 * │  │ [📸 Pilih File]            │                    │
 * │  │                            │                    │
 * │  │ Format: JPG, PNG           │                    │
 * │  │ Ukuran: Min 512px, Max 10MB│                    │
 * │  │                            │                    │
 * │  │ [Upload]                   │                    │
 * │  └────────────────────────────┘                    │
 * │                                                     │
 * │ OR - Avatar Anda Sebelumnya:                        │
 * │  ┌──────────────────────────────┐                  │
 * │  │ 📷 Foto Saya 1             │                    │
 * │  │ Uploaded 2 hari lalu       │                    │
 * │  │ [✓ Gunakan] [🗑️ Hapus]    │                    │
 * │  └──────────────────────────────┘                  │
 * │                                                     │
 * └─────────────────────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════
// UPLOAD FLOW
// ══════════════════════════════════════════════════════════════

/**
 * 1. User clicks "Upload" tab in Step 3
 * 2. User selects photo from device
 * 3. Client validates:
 *    - File type (JPG/PNG only)
 *    - File size (max 10MB)
 *    - Image dimensions (min 512×512px)
 * 4. Show preview
 * 5. User clicks "Lanjutkan" or "Cancel"
 * 6. POST to /api/studio/avatars/upload with FormData
 * 7. Server:
 *    a) Upload to R2/S3 (original_image_url)
 *    b) Send to D-ID API for processing
 *    c) Create database record with status 'processing'
 *    d) Return custom avatar ID
 * 8. UI shows: "Avatar sedang diproses..."
 * 9. Client polls /api/studio/avatars/:id/status every 3 seconds
 * 10. When ready (status='ready'), show "Avatar siap ✓"
 * 11. User can now select it as character
 *
 * Processing time: 2-5 minutes depending on D-ID queue
 */

// ══════════════════════════════════════════════════════════════
// UPDATED PAGE FLOW
// ══════════════════════════════════════════════════════════════

/**
 * Step 1: Content Type ───────────────────────────────────
 * Step 2: Upload Product ────────────────────────────────
 * Step 3: Choose Avatar (NEW - 3 tabs)
 *         ├─ Preset (existing CHARACTER_FEMALE/MALE)
 *         ├─ Collection (Beesell curated: Raya, Siti, etc)
 *         └─ Custom (User upload)
 * Step 4: Language ──────────────────────────────────
 * Step 5: Script ─────────────────────────────────
 * Step 6: Video Preset ──────────────────────────
 * Step 7: Duration (with credit cost) ──────────
 * Step 8: Review & Generate ──────────────────────
 *
 * Form State (added):
 *   avatarSource: 'preset' | 'collection' | 'custom'
 *   characterId: 'char-fem-01' | 'coll-beauty-01' | 'custom-123-001'
 *   customAvatarUploadProgress: 0-100
 */

// ══════════════════════════════════════════════════════════════
// STEP 8 SUMMARY (UPDATED)
// ══════════════════════════════════════════════════════════════

/**
 * Summary card now shows:
 *
 * ┌─────────────────────────────────┐
 * │ Jenis Konten:    Testimonial    │
 * │ Avatar:          Raya           │
 * │                  (Collection)   │
 * │ Bahasa:          Indonesia      │
 * │ Preset Video:    Authentic      │
 * │ Durasi:          30 Detik       │
 * │ Credits Needed:  30 ✓           │
 * └─────────────────────────────────┘
 *
 * Avatar preview:
 * ┌──────────────────┐
 * │ 👩 RAYA          │
 * │ Skincare Expert  │
 * │ (Collection)     │
 * └──────────────────┘
 */

// ══════════════════════════════════════════════════════════════
// IMPLEMENTATION CHECKLIST
// ══════════════════════════════════════════════════════════════

/**
 * Database:
 * [ ] Create user_custom_avatars table
 * [ ] Create user_avatar_usage table
 * [ ] Add migrations
 *
 * API Routes:
 * [ ] GET /api/studio/avatars (list all)
 * [ ] POST /api/studio/avatars/upload (upload custom)
 * [ ] GET /api/studio/avatars/:id/status (poll status)
 * [ ] DELETE /api/studio/avatars/:id (delete custom)
 *
 * Frontend:
 * [ ] Update Step 3 with 3 tabs (Preset/Collection/Custom)
 * [ ] Add upload component in Custom tab
 * [ ] Add polling logic for processing status
 * [ ] Show avatar preview in all tabs
 * [ ] Update form state to track avatarSource + characterId
 * [ ] Update Step 8 summary to show avatar source
 *
 * API Route (/api/studio/video/ugc):
 * [ ] Accept characterId (can be preset/collection/custom)
 * [ ] Fetch avatar URL (from table or constant)
 * [ ] Pass to D-ID with correct image URL
 * [ ] Track which avatar was used (for analytics)
 *
 * Analytics:
 * [ ] Track avatar popularity (preset vs collection vs custom)
 * [ ] Track custom avatar processing time
 * [ ] Track custom avatar failure rate
 * [ ] Surface insights in admin dashboard
 */

// ══════════════════════════════════════════════════════════════
// COST CONSIDERATION — Does custom avatar add cost?
// ══════════════════════════════════════════════════════════════

/**
 * NO ADDITIONAL COST for user:
 * - D-ID pricing same whether preset, collection, or custom
 * - Upload to R2/S3: minimal cost (< Rp10)
 * - Processing via D-ID: no extra fee
 *
 * Beesell costs:
 * - Custom avatar processing: D-ID API call (already in COGS)
 * - Custom avatar storage: R2 storage (negligible)
 * - Custom avatar UI/infra: one-time dev cost
 *
 * So: NO CHANGE to 30-credit cost or COGS calculation
 * It's purely a feature add-on with no cost impact
 */

export const CUSTOM_AVATAR_SUMMARY = {
  feature: 'Custom Avatar Upload + Collection',
  userCost: 'No additional cost',
  cogImpact: 'None',
  creditCost: '30 credits (same as before)',
  timeline: '2-5 minutes processing',
  platforms: {
    collection: 'Immediate (pre-trained)',
    custom: 'Deferred (D-ID processes)',
    preset: 'Immediate (built-in)'
  },
  benefits: [
    'User can use own face/branding',
    'More authentic for personal brands',
    'Beesell collection provides fallback',
    'Increases conversion (choice = engagement)'
  ]
}