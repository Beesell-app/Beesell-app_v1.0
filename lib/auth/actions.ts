'use server'
// lib/auth/actions.ts
// Server Actions for all auth flows.
// These run on the server — safe to use DB, cookies, redirects.

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z }            from 'zod'

export type AuthResult = {
  success: boolean
  error?:  string
  field?:  'name' | 'email' | 'password' | 'passwordConfirm'
  hint?:   'verify-email' | 'duplicate' | 'reset-password' | 'use-google'
}

// ── Validators ────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(2, 'Nama minimal 2 karakter').max(60, 'Nama terlalu panjang'),
  email:    z.string().email('Format email tidak valid').toLowerCase(),
  password: z.string()
    .min(8,         'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus ada minimal 1 huruf kapital')
    .regex(/[0-9]/, 'Harus ada minimal 1 angka'),
})
const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi'),
})

// ── URL helpers ───────────────────────────────────────────────
function siteUrl(): string {
  // Prefer explicit env var, then Vercel auto-detected URL, then localhost
  const url = process.env.NEXT_PUBLIC_APP_URL
           ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
           ?? 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

// This MUST match exactly what's whitelisted in Supabase Dashboard → Redirect URLs
function callbackUrl(): string {
  return `${siteUrl()}/auth/callback`
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
      // This metadata gets passed to the trigger (016_auto_create_user)
      data: { full_name: name, name },
      // MUST match whitelisted URL in Supabase Dashboard
      emailRedirectTo: callbackUrl(),
    },
  })

  if (error) {
    console.error('[register] signUp error:', error.message)
    const m = error.message.toLowerCase()

    if (m.includes('already registered') || m.includes('already been registered') ||
        m.includes('email address is already') || m.includes('user already exists')) {
      return {
        success: false,
        field:   'email',
        hint:    'duplicate',
        error:   'Email sudah terdaftar. Silakan login atau gunakan "Lupa Password".',
      }
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return { success: false, error: 'Terlalu banyak percobaan. Tunggu beberapa menit dan coba lagi.' }
    }
    if (m.includes('invalid email') || m.includes('unable to validate email')) {
      return { success: false, field: 'email', error: 'Format email tidak valid atau tidak dapat dikirimi email.' }
    }
    if (m.includes('password')) {
      return { success: false, field: 'password', error: 'Password terlalu lemah. Gunakan kombinasi huruf dan angka.' }
    }
    return { success: false, error: `Pendaftaran gagal: ${error.message}` }
  }

  // Supabase v2 behavior: if email already exists but unverified → identities is empty array
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      success: false,
      field:   'email',
      hint:    'duplicate',
      error:   'Email sudah terdaftar. Cek inbox untuk link verifikasi atau silakan login.',
    }
  }

  // "Confirm email" OFF in Supabase → session created immediately → go to app
  // Middleware will redirect to /onboarding since onboarding_done = false
  if (data.session) {
    redirect('/dashboard')
  }

  // "Confirm email" ON → Supabase sent verification email → show "check email" screen
  return { success: true, hint: 'verify-email' }
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
    email:    parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    console.error('[login] signIn error:', error.message)
    const m = error.message.toLowerCase()

    if (m.includes('invalid login credentials') || m.includes('invalid password')) {
      return {
        success: false,
        field:   'password',
        hint:    'reset-password',
        error:   'Email atau password salah.',
      }
    }
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
      return {
        success: false,
        field:   'email',
        hint:    'verify-email',
        error:   'Email belum diverifikasi. Cek inbox atau klik "Kirim ulang email verifikasi".',
      }
    }
    if (m.includes('too many') || m.includes('rate limit')) {
      return { success: false, error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }
    return { success: false, error: 'Login gagal. Coba lagi.' }
  }

  // Middleware will check onboarding_done and redirect accordingly:
  // onboarding_done = false → /onboarding
  // onboarding_done = true  → /dashboard
  redirect('/dashboard')
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  const sb = await createClient()
  await sb.auth.signOut({ scope: 'local' })
  redirect('/login?message=Berhasil+logout')
}

// ── GOOGLE OAUTH ─────────────────────────────────────────────
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
    console.error('[google] OAuth error:', error?.message)
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

  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) {
    return { success: false, field: 'email', error: 'Masukkan email yang valid.' }
  }

  const sb = await createClient()
  // Always succeed to avoid email enumeration
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
  const password        = String(formData.get('password')        ?? '')
  const passwordConfirm = String(formData.get('passwordConfirm') ?? '')

  if (password !== passwordConfirm) {
    return { success: false, field: 'passwordConfirm', error: 'Password tidak cocok.' }
  }

  const ok = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).safeParse(password)
  if (!ok.success) {
    return { success: false, field: 'password', error: 'Password minimal 8 karakter, 1 kapital, 1 angka.' }
  }

  const sb = await createClient()
  const { error } = await sb.auth.updateUser({ password })

  if (error) {
    console.error('[reset]', error.message)
    return { success: false, error: 'Gagal ubah password. Link mungkin sudah kedaluwarsa. Minta reset baru.' }
  }

  redirect('/dashboard')
}

// ── RESEND VERIFICATION EMAIL ─────────────────────────────────
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
    type:    'signup',
    email,
    options: { emailRedirectTo: callbackUrl() },
  })

  if (error) {
    const m = error.message.toLowerCase()
    console.error('[resend]', error.message)
    if (m.includes('already confirmed')) {
      return { success: false, error: 'Email sudah terverifikasi. Silakan login.' }
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return { success: false, error: 'Terlalu sering. Tunggu beberapa menit sebelum kirim ulang.' }
    }
    return { success: false, error: 'Gagal kirim ulang. Coba lagi beberapa menit.' }
  }

  return { success: true }
}