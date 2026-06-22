import crypto from 'crypto'
import type { NextRequest } from 'next/server'

const SALT = process.env.SMART_LINK_IP_SALT ?? 'beesell-default-salt'

export function hashIp(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? req.headers.get('x-real-ip') ?? 'unknown'
  return crypto.createHash('sha256').update(ip + SALT).digest('hex').slice(0, 32)
}

export function parseDevice(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  if (/mobile/i.test(ua))      return 'mobile'
  return 'desktop'
}

export function getVisitorId(req: NextRequest): { visitorId: string; isNew: boolean } {
  const existing = req.cookies.get('bsl_vid')?.value
  return existing ? { visitorId: existing, isNew: false }
                  : { visitorId: crypto.randomUUID(), isNew: true }
}

export function genSlug(len = 7): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789' // tanpa karakter ambigu
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}