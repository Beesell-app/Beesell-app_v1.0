// apps/web-app/app/api/waitlist/route.ts
// POST /api/waitlist — submit email to waitlist
// Stores in DB + optional Resend welcome email
import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { db }           from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Schema = z.object({
  email: z.string().email('Email tidak valid').toLowerCase(),
  name:  z.string().max(100).optional(),
  role:  z.enum(['seller', 'affiliator', 'dropshipper', 'agency', 'other']).optional(),
})

export async function POST(req: Request) {
  try {
    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Input tidak valid' },
        { status: 400 },
      )
    }

    const { email, name, role } = parsed.data

    // Check if already registered — idempotent
    const existing = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count FROM waitlist WHERE email = ${email}
    `.catch(() => [{ count: BigInt(0) }])

    if (Number(existing[0]?.count ?? 0) > 0) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        message: 'Kamu sudah terdaftar! Kami akan hubungi segera.',
      })
    }

    // Insert to waitlist table
    await db.$executeRaw`
      INSERT INTO waitlist (email, name, role, ip, created_at)
      VALUES (
        ${email},
        ${name ?? null},
        ${role ?? null},
        ${req.headers.get('x-forwarded-for')?.split(',')[0] ?? null},
        NOW()
      )
    `.catch(async () => {
      // Table might not exist yet — create it
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS waitlist (
          id         SERIAL PRIMARY KEY,
          email      VARCHAR(255) UNIQUE NOT NULL,
          name       VARCHAR(100),
          role       VARCHAR(50),
          ip         VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
      await db.$executeRaw`
        INSERT INTO waitlist (email, name, role, ip, created_at)
        VALUES (${email}, ${name ?? null}, ${role ?? null}, ${null}, NOW())
        ON CONFLICT (email) DO NOTHING
      `
    })

    // Optional: send welcome email via Resend (if configured)
    if (process.env.RESEND_API_KEY && email) {
      fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    'BeeSell AI <hello@beesell.id>',
          to:      email,
          subject: '✅ Kamu sudah masuk waitlist BeeSell AI!',
          html: `
            <h2>Halo ${name ?? 'Kak'}! 👋</h2>
            <p>Terima kasih sudah daftar ke waitlist <strong>BeeSell AI</strong>!</p>
            <p>Kami akan kasih akses awal begitu platform siap. Stay tuned!</p>
            <p>Sementara itu, follow kami di Instagram untuk update terbaru.</p>
            <br/>
            <p>Salam,<br/>Tim BeeSell AI</p>
          `,
        }),
      }).catch(() => {})  // non-fatal
    }

    return NextResponse.json({
      success: true,
      message: 'Berhasil daftar! Kami akan segera menghubungi kamu.',
    })

  } catch (err: any) {
    console.error('[POST /api/waitlist]', err)
    return NextResponse.json({ error: 'INTERNAL', message: 'Coba lagi ya.' }, { status: 500 })
  }
}