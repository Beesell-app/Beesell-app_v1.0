// @/lib/auth-middleware.ts
// ══════════════════════════════════════════════════════════════
// Simple auth middleware for API routes
// Validates JWT from Authorization header, injects userId
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AuthContext {
  userId: string
  email: string
}

/**
 * withAuth middleware
 * Validates JWT and passes userId to handler
 * 
 * Usage:
 * export const POST = withAuth(async (req, { userId }) => { ... })
 */
export function withAuth(
  handler: (
    req: NextRequest,
    ctx: AuthContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Get auth header
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'missing_auth_token' },
          { status: 401 }
        )
      }

      const token = authHeader.slice(7)

      // Verify token with Supabase
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user?.id) {
        return NextResponse.json(
          { error: 'invalid_token', message: error?.message },
          { status: 401 }
        )
      }

      // Call handler with context
      return await handler(req, {
        userId: user.id,
        email: user.email ?? '',
      })
    } catch (err) {
      console.error('[auth-middleware] error:', err)
      return NextResponse.json(
        { error: 'auth_failed', message: String(err) },
        { status: 500 }
      )
    }
  }
}

/**
 * Optional: withCredits middleware
 * Tracks and validates credit usage
 * Can be chained: withAuth(withCredits(...))
 */
export function withCredits(
  featureName: string,
  handler: (
    req: NextRequest,
    ctx: AuthContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: AuthContext) => {
    // Implementation depends on your credit system
    // For now, just pass through
    return await handler(req, context as AuthContext)
  }
}

/**
 * Optional: withDailyLimit middleware
 * Rate limit by day
 */
export function withDailyLimit(
  featureName: string,
  handler: (
    req: NextRequest,
    ctx: AuthContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: AuthContext) => {
    // Implementation depends on your rate limiting system
    return await handler(req, context as AuthContext)
  }
}