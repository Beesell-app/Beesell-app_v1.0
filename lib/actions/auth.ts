'use server'
// lib/auth/actions.ts — SMTP-AWARE VERSION
//
// Root cause "Error sending confirmation email":
//   Supabase free tier built-in SMTP punya batasan:
//   • Rate limit: ~4 emails/hour per project
//   • Kalau sudah hit rate limit → signUp() berhasil tapi throw SMTP error
//   • Supabase TIDAK rollback user — user tetap dibuat di auth.users
//
// Solusi:
//   1. Deteksi SMTP error secara spesifik
//   2. Return state yang berbeda: user sudah dibuat, email gagal dikirim
//   3. Tampilkan UI untuk resend / coba lagi
//   4. JANGAN tampilkan sebagai "error pendaftaran" biasa

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z }            from 'zod'

export type AuthResult = {
  success?: boolean
  error?: string

  field?:
    | 'name'
    | 'email'
    | 'password'
    | 'passwordConfirm'

  hint?:
    | 'verify-email'
    | 'email-failed'
    | 'duplicate'
    | 'reset-password'

  email?: string
}

// ── Schemas ───────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(2, 'Nama minimal 2 karakter').max(60),
  email:    z.string().email('Format email tidak valid').toLowerCase(),
  password: z.string()
    .min(8,         'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Butuh 1 huruf kapital')
    .regex(/[0-9]/, 'Butuh 1 angka'),
})

const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi'),
})

// ── URL helpers ───────────────────────────────────────────────
function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
           ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
           ?? 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

function callbackUrl(): string {
  return `${siteUrl()}/auth/callback`
}

// ── SMTP error detector ───────────────────────────────────────
function isSmtpError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('error sending confirmation email') ||
    m.includes('error sending') ||
    m.includes('email sending') ||
    m.includes('smtp') ||
    m.includes('email rate limit') ||
    m.includes('unable to send email') ||
    m.includes('email service') ||
    m.includes('failed to deliver')
  )
}

// ── REGISTER ─────────────────────────────────────────────────
export async function registerAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const raw = {
    name:     String(formData.get('name')     ?? '').trim(),
    email:    String(formData.get('email')    ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { success: false, error: issue.message, field: issue.path[0] as AuthResult['field'] }
  }

  const { name, email, password } = parsed.data
  const sb = await createClient()

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data:            { full_name: name, name },
      emailRedirectTo: callbackUrl(),
    },
  })

  if (error) {
    console.error('[register] signUp error:', error.message)
    const m = error.message.toLowerCase()

    // ── SMTP / email sending error ────────────────────────
    // User SUDAH dibuat di Supabase, tapi email gagal dikirim.
    // Jangan tampilkan sebagai error biasa — user bisa resend.
    if (isSmtpError(error.message)) {
      console.warn('[register] SMTP error — user created but email failed:', email)
      return {
        success: false,
        hint:    'email-failed',
        email,
        error:   'Akun berhasil dibuat, tapi email verifikasi gagal dikirim. Coba kirim ulang atau hubungi support.',
      }
    }

    if (m.includes('already registered') || m.includes('already been registered') ||
        m.includes('email address is already') || m.includes('user already exists')) {
      return {
        success: false, field: 'email', hint: 'duplicate', email,
        error:   'Email sudah terdaftar. Silakan login atau gunakan "Lupa Password".',
      }
    }

    if (m.includes('rate limit') || m.includes('too many requests')) {
      return { success: false, email,
        error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }

    if (m.includes('invalid email') || m.includes('unable to validate email')) {
      return { success: false, field: 'email', email,
        error: 'Format email tidak valid.' }
    }

    if (m.includes('password')) {
      return { success: false, field: 'password', email,
        error: 'Password terlalu lemah.' }
    }

    return { success: false, email,
      error: `Pendaftaran gagal: ${error.message}` }
  }

  // Email duplicate via identities check (Supabase v2)
  if (data.user?.identities?.length === 0) {
    return {
      success: false, field: 'email', hint: 'duplicate', email,
      error:   'Email sudah terdaftar. Silakan login.',
    }
  }

  // Confirm email OFF → session langsung ada
  if (data.session) {
    redirect('/dashboard')
  }

  // Success → email terkirim → show verify screen
  return { success: true, hint: 'verify-email', email }
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const raw = {
    email:    String(formData.get('email')    ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  }
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { success: false, error: issue.message, field: issue.path[0] as AuthResult['field'] }
  }

  const sb = await createClient()
  const { error } = await sb.auth.signInWithPassword({
    email: parsed.data.email, password: parsed.data.password,
  })

  if (error) {
    console.error('[login] error:', error.message)
    const m = error.message.toLowerCase()
    if (m.includes('invalid login credentials') || m.includes('invalid password')) {
      return { success: false, field: 'password', hint: 'reset-password',
        error: 'Email atau password salah.' }
    }
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
      return { success: false, field: 'email', hint: 'verify-email',
        error: 'Email belum diverifikasi. Cek inbox atau kirim ulang email verifikasi.' }
    }
    if (m.includes('too many') || m.includes('rate limit')) {
      return { success: false, error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }
    return { success: false, error: 'Login gagal. Coba lagi.' }
  }

  redirect('/dashboard')
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const sb = await createClient()
  await sb.auth.signOut({ scope: 'local' })
  redirect('/login?message=Berhasil+logout')
}

// ── GOOGLE ────────────────────────────────────────────────────
export async function googleSignInAction(): Promise<AuthResult> {
  const sb = await createClient()
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:  callbackUrl(),
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error || !data?.url) {
    console.error('[google] error:', error?.message)
    return { success: false, error: 'Google login gagal. Coba lagi.' }
  }
  redirect(data.url)
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
export async function forgotPasswordAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!z.string().email().safeParse(email).success) {
    return { success: false, field: 'email', error: 'Masukkan email yang valid.' }
  }
  const sb = await createClient()
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${callbackUrl()}?type=recovery`,
  }).catch(e => console.error('[forgot]', e?.message))
  return { success: true }
}

// ── RESET PASSWORD ────────────────────────────────────────────
export async function resetPasswordAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const pw  = String(formData.get('password')        ?? '')
  const pw2 = String(formData.get('passwordConfirm') ?? '')
  if (pw !== pw2) return { success: false, field: 'passwordConfirm', error: 'Password tidak cocok.' }
  if (!z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).safeParse(pw).success) {
    return { success: false, field: 'password', error: 'Password minimal 8 karakter, 1 kapital, 1 angka.' }
  }
  const sb = await createClient()
  const { error } = await sb.auth.updateUser({ password: pw })
  if (error) return { success: false, error: 'Gagal ubah password. Link mungkin sudah kedaluwarsa.' }
  redirect('/dashboard')
}

// ── RESEND VERIFICATION ───────────────────────────────────────
export async function resendVerificationAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !z.string().email().safeParse(email).success) {
    return { success: false, field: 'email', error: 'Masukkan email yang valid.' }
  }
  const sb = await createClient()
  const { error } = await sb.auth.resend({
    type: 'signup', email,
    options: { emailRedirectTo: callbackUrl() },
  })
  if (error) {
    const m = error.message.toLowerCase()
    if (m.includes('already confirmed')) return { success: false, error: 'Email sudah terverifikasi. Silakan login.' }
    if (m.includes('rate limit') || m.includes('too many')) return { success: false, error: 'Terlalu sering. Tunggu beberapa menit.' }
    if (isSmtpError(error.message)) return { success: false, error: 'Email server sedang sibuk. Coba lagi dalam 5 menit.' }
    return { success: false, error: 'Gagal kirim ulang. Coba lagi.' }
  }
  return { success: true }
}