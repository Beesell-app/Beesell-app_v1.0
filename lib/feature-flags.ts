// lib/feature-flags.ts
// ══════════════════════════════════════════════════════════════
// Feature Flags + Superuser Detection
// 
// Single source of truth untuk:
//   - SUPERUSER_EMAILS (hardcoded fallback)
//   - Feature flag tool on/off
//   - Helpers: isSuperuserEmail, isToolAccessible, shouldShowLock
// ══════════════════════════════════════════════════════════════

export type ToolStatus = 'enabled' | 'disabled' | 'coming-soon' | 'beta'
export type UserRole = 'guest' | 'user' | 'support' | 'admin' | 'superuser'

interface FeatureFlag {
  status:        ToolStatus
  reason?:       string
  comingSoonAt?: string
}

// ══════════════════════════════════════════════════════════════
// SUPERUSER EMAILS — Hardcoded fallback (always lowercase)
// ══════════════════════════════════════════════════════════════
// ⚠️ Update di sini SEKALI, otomatis effect di:
//    - lib/admin-auth.ts (server-side guard)
//    - hooks/use-user-role.ts (client-side detect)
//    - /api/auth/role (server-side check)
//    - middleware (bypass logic)
// ══════════════════════════════════════════════════════════════
export const SUPERUSER_EMAILS: readonly string[] = [
  'besties.aegle@gmail.com',
] as const

// ══════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ══════════════════════════════════════════════════════════════
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Writing AI
  'caption':           { status: 'enabled' },
  'hook':              { status: 'enabled' },
  'hashtag':           { status: 'enabled' },
  'tiktok-script':     { status: 'enabled' },

  // Quick Tools
  'remove-bg':         { status: 'enabled' },
  'subtitle':          { status: 'enabled' },
  'resize':            { status: 'enabled' },

  // Image AI
  'packshot':          { status: 'enabled' },
  'enhancer':          { status: 'enabled' },
  'upscale':           { status: 'enabled' },
  'relight':           { status: 'enabled' },
  'remove-object':     { status: 'enabled' },
  'virtual-tryon':     { status: 'enabled' },
  'product-to-model':  { status: 'enabled' },
  'ai-image-generator': { status: 'enabled' },
  'face-swap':          { status: 'enabled' },
  'model-swap':         { status: 'enabled' },

  // Video AI
  'ugc-generator':     { status: 'enabled' },
  'image-to-video':    { status: 'enabled' },
  'ugc':               { status: 'enabled' },  // legacy route alias
  'tiktok':            { status: 'enabled' },  // legacy route alias
  'generator':         { status: 'enabled' },  // legacy route alias

  // Marketing Kit
  'campaign-builder':  { status: 'enabled' },
  'audience-intel':    { status: 'enabled' },
  'budget-optimizer':  { status: 'enabled' },
  'scheduler':         { status: 'enabled' },
  'asset-library':     { status: 'enabled' },
  'analytics':          { status: 'enabled' },

  // Disabled
  'talking-head':      {
    status: 'coming-soon',
    reason: 'D-ID HD pricing negative margin — re-launch Q3 2026',
    comingSoonAt: '2026-09-01',
  },
}

// ══════════════════════════════════════════════════════════════
// FEATURE FLAG HELPERS
// ══════════════════════════════════════════════════════════════
export function isToolEnabled(toolId: string): boolean {
  return FEATURE_FLAGS[toolId]?.status === 'enabled'
}

export function showInDashboard(toolId: string): boolean {
  const flag = FEATURE_FLAGS[toolId]
  if (!flag) return false
  return flag.status === 'enabled' || flag.status === 'beta'
}

export function getToolStatus(toolId: string): ToolStatus {
  return FEATURE_FLAGS[toolId]?.status ?? 'disabled'
}

export function getDisabledReason(toolId: string): string | undefined {
  return FEATURE_FLAGS[toolId]?.reason
}

// ══════════════════════════════════════════════════════════════
// SUPERUSER HELPERS — Dipakai di server + client
// ══════════════════════════════════════════════════════════════

/**
 * Cek apakah email adalah superuser (hardcoded list)
 * @example
 *   if (isSuperuserEmail(user.email)) { ... bypass ... }
 */
export function isSuperuserEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPERUSER_EMAILS.includes(email.toLowerCase())
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'superuser' || role === 'admin'
}

export function isSuperuserRole(role: UserRole): boolean {
  return role === 'superuser'
}

// ══════════════════════════════════════════════════════════════
// TOOL ACCESSIBILITY — Superuser bypass tier requirements
// ══════════════════════════════════════════════════════════════
const TIER_ORDER: Record<string, number> = {
  starter:  0,
  basic:    1,
  pro:      2,
  business: 3,
}

/**
 * Cek apakah user dengan tier + role bisa akses tool
 * ⚡ Superuser/admin ALWAYS unlocked
 */
export function isToolAccessible(
  userTier:         string,
  toolTierRequired: string,
  userRole:         UserRole = 'user',
): boolean {
  // Superuser/admin bypass semua
  if (userRole === 'superuser' || userRole === 'admin') return true

  const userLevel = TIER_ORDER[userTier] ?? 0
  const requiredLevel = TIER_ORDER[toolTierRequired] ?? 0
  return userLevel >= requiredLevel
}

/**
 * Cek apakah tool harus tampil locked di UI
 * ⚡ Superuser/admin TIDAK PERNAH lihat lock icon
 */
export function shouldShowLock(
  userTier:         string,
  toolTierRequired: string,
  userRole:         UserRole = 'user',
): boolean {
  if (userRole === 'superuser' || userRole === 'admin') return false

  const userLevel = TIER_ORDER[userTier] ?? 0
  const requiredLevel = TIER_ORDER[toolTierRequired] ?? 0
  return userLevel < requiredLevel
}