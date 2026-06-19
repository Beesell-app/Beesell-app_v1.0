// lib/tools/access.ts
// ══════════════════════════════════════════════════════════════
// ACCESS CONTROL — Merges 3 sources of truth:
//   1. FEATURES (registry in studio-menu-config.ts) — static definitions
//   2. feature_flags_db (admin toggles) — dynamic on/off + per-tier
//   3. user_feature_grants (per-user overrides) — special access grants
//
// LOGIC:
//   • Tool in registry but NOT in feature_flags_db
//     → default enabled, access by tierRequired from registry
//   • feature_flags_db.status = 'disabled' or 'coming-soon'
//     → blocked (UI hides it)
//   • status = 'enabled'/'beta' + user tier sufficient → access OK
//   • status = 'enabled' but user tier insufficient → locked (upgrade)
//   • user_feature_grants[tool_id] = true → override tier check
//
// USED BY:
//   • /api/tools/access (UI request)
//   • Route handlers (server-side guard, anti-bypass)
//   • useFeatures() hook (sidebar/dashboard/studio)
//   • Studio page (show/hide tools)
// ══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'
import {
  FEATURES,
  meetsTier,
  type Tier,
  type FeatureItem,
} from '@/components/dashboard/studio-menu-config'
import { db } from '@/lib/db'
import { isSuperuserEmail } from '@/lib/feature-flags'

// ── Types ──────────────────────────────────────────────────────
export type ToolStatus = 'enabled' | 'disabled' | 'coming-soon' | 'beta'

export interface ToolAccess {
  tool_id:        string
  available:      boolean
  status:         ToolStatus
  beta:           boolean
  locked:         boolean
  reason:         string
  coming_soon_at: string | null
  credit?:        number
  tier_required?: Tier
}
/**
 * Access status for ONE tool for ONE user
 */
export interface ToolAccessEntry {
  status: ToolStatus; available: boolean; locked: boolean; beta: boolean; reason?: string
}

/**
 * Feature flag row from database
 */
export interface FeatureFlagRow {
  tool_id: string
  status: ToolStatus
  reason?: string
  coming_soon_at?: string | null
  available_starter?: boolean
  available_basic?: boolean
  available_pro?: boolean
  available_business?: boolean
  updated_at?: string
}

/**
 * User feature grant (override access for specific user)
 */
export interface UserFeatureGrantRow {
  id: string
  user_id: string
  tool_id: string
  granted: boolean
  granted_by?: string
  granted_at?: string
  expires_at?: string | null
}

// ── Tier Mapping ───────────────────────────────────────────────
const TIER_COLUMNS: Record<string, keyof FeatureFlagRow> = {
  free: 'available_starter',
  starter: 'available_starter',
  basic: 'available_basic',
  pro: 'available_pro',
  business: 'available_business',
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

/**
 * Get user's current tier from database
 * Falls back to 'starter' if not found or error
 */
export async function getUserTier(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_credits')
      .select('plan_tier')
      .eq('user_id', userId)
      .maybeSingle()

    const tier = (data?.plan_tier ?? 'starter').toString().toLowerCase()
    return tier
  } catch (err) {
    console.warn('[access] getUserTier error:', err)
    return 'starter'
  }
}

/**
 * Check if user is superuser (has owner/admin role)
 * Superusers bypass ALL access checks
 */
export async function isSuperuser(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('users').select('email').eq('id', userId).maybeSingle()
    return isSuperuserEmail(data?.email ?? null)   // hanya email di daftar = superuser
  } catch {
    return false
  }
}

/**
 * Get feature flag row from database
 * Returns null if not found
 */
export async function getFeatureFlag(
  toolId: string
): Promise<FeatureFlagRow | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('feature_flags_db')
      .select('*')
      .eq('tool_id', toolId)
      .maybeSingle()

    return data ?? null
  } catch (err) {
    console.warn('[access] getFeatureFlag error:', err)
    return null
  }
}

/**
 * Check if user has an active grant for a tool
 * Returns true if granted and not expired
 */
export async function hasFeatureGrant(
  userId: string,
  toolId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_feature_grants')
      .select('granted, expires_at')
      .eq('user_id', userId)
      .eq('tool_id', toolId)
      .maybeSingle()

   if (!data) return false

    // Check if grant has expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) return false
    }

    return true
  } catch (err) {
    console.warn('[access] hasFeatureGrant error:', err)
    return false
  }
}

/**
 * Check if user's tier meets the requirement
 * tier 'pro' can access tools with tierRequired 'starter', 'basic', 'pro'
 */
export function tierMeets(userTier: string, required: Tier): boolean {
  return meetsTier(userTier, required)
}

// ══════════════════════════════════════════════════════════════
// MAIN ACCESS RESOLUTION
// ══════════════════════════════════════════════════════════════

/**
 * Get detailed access info for ONE tool
 * Includes: available, status, locked, reason, credit cost
 *
 * Decision tree:
 *   1. Is user superuser? → always available
 *   2. Does user have special grant? → available
 *   3. What's the global status?
 *      - disabled → unavailable
 *      - coming-soon → unavailable with ETA
 *      - enabled/beta → check tier
 *   4. Does user's tier meet requirement?
 *      - From feature_flags_db column (if exists)
 *      - From registry tierRequired (if flag doesn't exist)
 */
export async function getToolAccess(
  userId: string,
  toolId: string
): Promise<ToolAccess> {
  try {
    const superuser = await isSuperuser(userId)
    const userTier = await getUserTier(userId)
    const grant = await hasFeatureGrant(userId, toolId)
    const flagRow = await getFeatureFlag(toolId)
    const registryFeature = FEATURES.find(f => f.id === toolId)

    // Superuser always can
    if (superuser) {
      return {
        tool_id: toolId,
        available: true,
        status: flagRow?.status ?? 'enabled',
        beta: (flagRow?.status ?? 'enabled') === 'beta',
        locked: false,
        reason: '',
        coming_soon_at: null,
        credit: registryFeature?.credit,
        tier_required: registryFeature?.tierRequired,
      }
    }

    // Determine global status
    const status: ToolStatus = (flagRow?.status ?? 'enabled') as ToolStatus

    // Determine if available
    let available = false
    let locked = false
    let reason = ''

    if (status === 'disabled') {
      available = false
      reason = flagRow?.reason || 'Tool sedang dinonaktifkan.'
    } else if (status === 'coming-soon') {
      available = false
      reason = 'Fitur ini segera hadir.'
    } else {
      // enabled or beta — check tier
      if (grant) {
        // User has special grant
        available = true
      } else {
        // Check tier
        const tierCol = TIER_COLUMNS[userTier] || 'available_starter'
        const tierFromFlag = flagRow
          ? (flagRow[tierCol] === true)
          : (registryFeature
              ? tierMeets(userTier, registryFeature.tierRequired as Tier)
              : false)

        if (tierFromFlag) {
          available = true
        } else {
          available = false
          locked = true
          reason = `Upgrade ke ${registryFeature?.tierRequired || 'Pro'} untuk membuka fitur ini.`
        }
      }
    }

    return {
      tool_id: toolId,
      available,
      status,
      beta: status === 'beta',
      locked,
      reason,
      coming_soon_at: flagRow?.coming_soon_at ?? null,
      credit: registryFeature?.credit,
      tier_required: registryFeature?.tierRequired,
    }
  } catch (err) {
    console.error('[access] getToolAccess error:', err)
    // Fail-open: allow access if error
    return {
      tool_id: toolId,
      available: true,
      status: 'enabled',
      beta: false,
      locked: false,
      reason: '',
      coming_soon_at: null,
    }
  }
}

/**
 * Get access map for ALL tools for ONE user
 * Returns: { tier, access: { tool_id → ToolAccess } }
 *
 * Efficient: fetches all flags once instead of per-tool
 */
export async function getToolAccessMap(userId: string): Promise<{
  tier: string
  superuser: boolean
  access: Record<string, ToolAccess>
}> {
  try {
    const supabase = await createClient()
    const superuser = await isSuperuser(userId)
    const userTier = await getUserTier(userId)
    const tierCol = TIER_COLUMNS[userTier] || 'available_starter'

    // Fetch all feature flags at once
    const { data: flagRows } = await supabase
      .from('feature_flags_db')
      .select('*')

    const flagMap: Record<string, FeatureFlagRow> = {}
    for (const f of flagRows ?? []) {
      flagMap[f.tool_id] = f
    }

    // Fetch all grants for user at once
    const { data: grantRows } = await supabase
      .from('user_feature_grants')
      .select('tool_id, granted, expires_at')
      .eq('user_id', userId)
      .eq('granted', true)

    const grantMap: Record<string, boolean> = {}
    for (const g of grantRows ?? []) {
      // Check expiration
      if (g.expires_at) {
        const expiresAt = new Date(g.expires_at)
        if (expiresAt >= new Date()) {
          grantMap[g.tool_id] = true
        }
      } else {
        grantMap[g.tool_id] = true
      }
    }

    const access: Record<string, ToolAccess> = {}

    // 1. Build access for all registry features
    for (const regFeature of FEATURES) {
      const flag = flagMap[regFeature.id]
      const granted = grantMap[regFeature.id] === true
      const status: ToolStatus = (flag?.status ?? 'enabled') as ToolStatus

      let available = false
      let locked = false
      let reason = ''

      // Superuser bypass
      if (superuser) {
        available = true
      } else if (status === 'disabled') {
        reason = flag?.reason || 'Tool dinonaktifkan.'
      } else if (status === 'coming-soon') {
        reason = 'Fitur ini segera hadir.'
      } else {
        // enabled or beta
        if (granted) {
          available = true
        } else {
          // Check tier from flag or registry
          const tierOk = flag
            ? (flag[tierCol as keyof FeatureFlagRow] === true)
            : tierMeets(userTier, regFeature.tierRequired as Tier)

          if (tierOk) {
            available = true
          } else {
            locked = true
            reason = `Upgrade ke ${TIER_LABELS[regFeature.tierRequired] || regFeature.tierRequired} untuk membuka fitur ini.`
          }
        }
      }

      access[regFeature.id] = {
        tool_id: regFeature.id,
        available,
        status,
        beta: status === 'beta',
        locked,
        reason,
        coming_soon_at: flag?.coming_soon_at ?? null,
        credit: regFeature.credit,
        tier_required: regFeature.tierRequired,
      }
    }

    // 2. Handle flags NOT in registry (shouldn't happen, but handle gracefully)
    for (const flag of flagRows ?? []) {
      if (access[flag.tool_id]) continue // Already processed

      const status: ToolStatus = (flag.status ?? 'enabled') as ToolStatus
      let available = false
      let locked = false
      let reason = ''

      if (superuser) {
        available = true
      } else if (status === 'disabled') {
        reason = flag.reason || 'Tool dinonaktifkan.'
      } else if (status === 'coming-soon') {
        reason = 'Fitur ini segera hadir.'
      } else {
        const tierOk = flag[tierCol as keyof FeatureFlagRow] === true
        if (tierOk) {
          available = true
        } else {
          locked = true
          reason = 'Upgrade paket untuk membuka fitur ini.'
        }
      }

      access[flag.tool_id] = {
        tool_id: flag.tool_id,
        available,
        status,
        beta: status === 'beta',
        locked,
        reason,
        coming_soon_at: flag.coming_soon_at ?? null,
      }
    }

    return { tier: userTier, superuser, access }
  } catch (err) {
    console.error('[access] getToolAccessMap error:', err)
    // Fail-open: grant all access if error
    const access: Record<string, ToolAccess> = {}
    for (const f of FEATURES) {
      access[f.id] = {
        tool_id: f.id,
        available: true,
        status: 'enabled',
        beta: false,
        locked: false,
        reason: '',
        coming_soon_at: null,
        credit: f.credit,
        tier_required: f.tierRequired,
      }
    }
    return { tier: 'starter', superuser: false, access }
  }
}

// ══════════════════════════════════════════════════════════════
// SERVER-SIDE GUARD (anti-bypass)
// ══════════════════════════════════════════════════════════════

/**
 * Guard function for route handlers
 * Call this BEFORE allowing tool operation
 *
 * Returns: { allowed, status, reason, tier }
 *
 * Usage:
 *   const guard = await checkToolAllowed(userId, 'ugc-generator')
 *   if (!guard.allowed) return NextResponse.json({ error: guard.reason }, { status: 403 })
 */
export async function checkToolAllowed(
  userId: string,
  toolId: string
): Promise<{
  allowed: boolean
  status: ToolStatus
  reason: string
  tier: string
}> {
  try {
    const access = await getToolAccess(userId, toolId)
    const tier = await getUserTier(userId)

    return {
      allowed: access.available,
      status: access.status,
      reason: access.reason,
      tier,
    }
  } catch (err) {
    console.error('[access] checkToolAllowed error:', err)
    // Fail-open
    return {
      allowed: true,
      status: 'enabled',
      reason: '',
      tier: 'starter',
    }
  }
}

// ══════════════════════════════════════════════════════════════
// FEATURE-SPECIFIC HELPERS
// ══════════════════════════════════════════════════════════════

/**
 * Get feature from registry by ID
 */
export function getFeatureById(toolId: string): FeatureItem | undefined {
  return FEATURES.find(f => f.id === toolId)
}

/**
 * Check if user can use metered tool (with credit cost)
 * Returns: { canUse, reason, creditNeeded, creditBalance }
 */
export async function checkMeteredToolAllowed(
  userId: string,
  toolId: string
): Promise<{
  canUse: boolean
  reason: string
  creditNeeded: number
  creditBalance: number
}> {
  try {
    const access = await getToolAccess(userId, toolId)
    const feature = getFeatureById(toolId)

    if (!access.available) {
      return {
        canUse: false,
        reason: access.reason,
        creditNeeded: feature?.credit ?? 0,
        creditBalance: 0,
      }
    }

    // Check credit balance
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    const balance = data?.balance ?? 0
    const needed = feature?.credit ?? 0

    return {
      canUse: balance >= needed,
      reason:
        balance < needed
          ? `Butuh ${needed} kredit. Saldo: ${balance}`
          : '',
      creditNeeded: needed,
      creditBalance: balance,
    }
  } catch (err) {
    console.error('[access] checkMeteredToolAllowed error:', err)
    return {
      canUse: false,
      reason: 'Error checking credit.',
      creditNeeded: 0,
      creditBalance: 0,
    }
  }
}

// ══════════════════════════════════════════════════════════════
// EXAMPLE: UGC GENERATOR FLOW
// ══════════════════════════════════════════════════════════════
/*

// In route handler (POST /api/studio/video/ugc):
export const POST = async (req: NextRequest) => {
  const userId = ... // from auth middleware
  const toolId = 'ugc-generator'

  // 1. Check if tool is available
  const guard = await checkToolAllowed(userId, toolId)
  if (!guard.allowed) {
    return NextResponse.json(
      { error: guard.reason },
      { status: 403 }
    )
  }

  // 2. Check if user has credits (for metered tool)
  const { canUse, reason, creditNeeded } = await checkMeteredToolAllowed(userId, toolId)
  if (!canUse) {
    return NextResponse.json(
      { error: reason },
      { status: 402 } // Payment Required
    )
  }

  // 3. Deduct credits
  const supabase = createClient()
  const { data: current } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()

  await supabase
    .from('user_credits')
    .update({ balance: current.balance - creditNeeded })
    .eq('user_id', userId)

  // 4. Proceed with generation
  try {
    const result = await generateUGCVideo(...)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    // 5. Refund on error
    await supabase
      .from('user_credits')
      .update({ balance: current.balance })
      .eq('user_id', userId)

    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}

*/