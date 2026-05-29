// apps/web-app/lib/api-error.ts
// ── Standardized API error handling ──────────────────────────
// Maps error codes → user-friendly Indonesian messages
// Use in all fetch() calls + API routes

// ── Error codes from BeeSell APIs ────────────────────────────
export type Apierror_Code =
  | 'QUOTA_EXCEEDED'
  | 'PLAN_LIMIT'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'PLATFORM_NOT_CONNECTED'
  | 'TOKEN_EXPIRED'
  | 'NO_CONNECTION'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

// ── Parsed error from API response ────────────────────────────
export interface ApiError {
  code:        Apierror_Code | string
  message:     string          // user-friendly Indonesian
  technical?:  string          // original error for devs
  action?:     { label: string; href: string }
  retryable:   boolean
}

// ── User-friendly error messages ──────────────────────────────
const ERROR_MESSAGES: Record<string, Omit<ApiError, 'technical'>> = {
  QUOTA_EXCEEDED: {
    code:      'QUOTA_EXCEEDED',
    message:   'Kuota harian/bulanan kamu sudah habis.',
    action:    { label: 'Upgrade Plan', href: '/settings/billing' },
    retryable: false,
  },
  PLAN_LIMIT: {
    code:      'PLAN_LIMIT',
    message:   'Fitur ini tidak tersedia di plan kamu.',
    action:    { label: 'Lihat Plan', href: '/settings/billing' },
    retryable: false,
  },
  VALIDATION_ERROR: {
    code:      'VALIDATION_ERROR',
    message:   'Data yang dimasukkan tidak valid. Periksa kembali.',
    retryable: false,
  },
  NOT_FOUND: {
    code:      'NOT_FOUND',
    message:   'Data tidak ditemukan.',
    retryable: false,
  },
  UNAUTHORIZED: {
    code:      'UNAUTHORIZED',
    message:   'Sesi kamu sudah habis. Silakan login ulang.',
    action:    { label: 'Login', href: '/login' },
    retryable: false,
  },
  PLATFORM_NOT_CONNECTED: {
    code:      'PLATFORM_NOT_CONNECTED',
    message:   'Platform belum terhubung. Hubungkan dulu di Pengaturan.',
    action:    { label: 'Hubungkan Platform', href: '/settings/connections' },
    retryable: false,
  },
  TOKEN_EXPIRED: {
    code:      'TOKEN_EXPIRED',
    message:   'Koneksi platform kamu sudah expired. Sambungkan ulang.',
    action:    { label: 'Sambungkan Ulang', href: '/settings/connections' },
    retryable: false,
  },
  RATE_LIMITED: {
    code:      'RATE_LIMITED',
    message:   'Terlalu banyak request. Tunggu sebentar.',
    retryable: true,
  },
  NETWORK_ERROR: {
    code:      'NETWORK_ERROR',
    message:   'Koneksi internet bermasalah. Periksa koneksi kamu.',
    retryable: true,
  },
  TIMEOUT: {
    code:      'TIMEOUT',
    message:   'Request timeout. Coba lagi.',
    retryable: true,
  },
  INTERNAL: {
    code:      'INTERNAL',
    message:   'Terjadi kesalahan server. Tim kami sudah diberitahu.',
    retryable: true,
  },
}

// ── Parse API error response ──────────────────────────────────
export async function parseApiError(response: Response): Promise<ApiError> {
  let body: any = {}
  try {
    body = await response.clone().json()
  } catch {}

  const code = body.error ?? mapStatusToCode(response.status)
  const preset = ERROR_MESSAGES[code]

  // Special handling for quota exceeded with custom data
  if (code === 'QUOTA_EXCEEDED' && body.resetAt) {
    const resetDate = new Date(body.resetAt)
    const isToday   = resetDate.toDateString() === new Date().toDateString()
    const resetStr  = isToday
      ? `Reset pukul 00:00 WIB`
      : `Reset ${resetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`

    return {
      code:      'QUOTA_EXCEEDED',
      message:   `Kuota ${body.metric ?? ''} habis (${body.used}/${body.limit}). ${resetStr}.`,
      action:    { label: 'Upgrade Plan', href: '/settings/billing' },
      retryable: false,
    }
  }

  return {
    code:      code as Apierror_Code,
    message:   preset?.message ?? body.message ?? 'Terjadi kesalahan yang tidak diketahui.',
    technical: body.message,
    action:    preset?.action,
    retryable: preset?.retryable ?? true,
  }
}

function mapStatusToCode(status: number): string {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'PLAN_LIMIT'
  if (status === 404) return 'NOT_FOUND'
  if (status === 422) return 'VALIDATION_ERROR'
  if (status === 429) return 'QUOTA_EXCEEDED'
  if (status >= 500)  return 'INTERNAL'
  return 'UNKNOWN'
}

// ── Fetch wrapper with error handling ────────────────────────
export async function fetchApi<T>(
  url:     string,
  options?: RequestInit,
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const error = await parseApiError(res)
      return { data: null, error }
    }

    const data = await res.json()
    return { data, error: null }

  } catch (err: any) {
    // Network errors, CORS, etc.
    const isTimeout = err.name === 'AbortError'
    return {
      data:  null,
      error: {
        code:      isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        message:   ERROR_MESSAGES[isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'].message,
        technical: err.message,
        retryable: true,
      },
    }
  }
}

// ── Hook: standardized error display ─────────────────────────
// Usage in components:
//   const { errorToast } = useErrorHandler()
//   const { data, error } = await fetchApi('/api/something')
//   if (error) { errorToast(error); return }
import { useCallback } from 'react'
import { useRouter }   from 'next/navigation'

export function useErrorHandler() {
  const router = useRouter()

  const handleError = useCallback((error: ApiError) => {
    // Redirect for auth errors
    if (error.code === 'UNAUTHORIZED') {
      router.push('/login')
      return
    }

    // Return formatted message for display
    return error.message
  }, [router])

  return { handleError }
}