'use client'
// apps/web-app/components/auth/GoogleLoginButton.tsx
// Reusable Google OAuth button
// Pakai di: /login dan /register
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { loginWithGoogleAction } from '@/lib/actions/auth'

interface Props {
  mode?: 'login' | 'register'  // cuma beda label text
}

export function GoogleLoginButton({ mode = 'login' }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await (loginWithGoogleAction as () => Promise<any>)()

        // Kalau action return URL redirect → arahkan browser
        if (result?.url) {
          window.location.href = result.url
          return
        }

        // Kalau return error
        if (result?.error) {
          console.error('[google-oauth]', result.error)
          window.location.href = `/login?error=${encodeURIComponent(result.error)}`
        }
      } catch (err: any) {
        // Next.js redirect() throw NEXT_REDIRECT — propagate
        if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
          throw err
        }
        console.error('[google-oauth] Error:', err)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        width: '100%', padding: '11px 16px', borderRadius: '12px',
        border: '1.5px solid #E2E8F0', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        fontSize: '14px', fontWeight: 500, color: '#334155',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        opacity: isPending ? 0.6 : 1,
        transition: 'all .15s',
      }}
    >
      {isPending ? (
        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menghubungkan...</>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
          </svg>
          {mode === 'login' ? 'Login dengan Google' : 'Daftar dengan Google'}
        </>
      )}
    </button>
  )
}