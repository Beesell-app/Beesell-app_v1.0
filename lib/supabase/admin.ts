// lib/supabase/admin.ts
// ── Supabase ADMIN client — bypass RLS ───────────────────────
// Gunakan HANYA di server-side API routes untuk operasi yang butuh
// akses penuh: create tenant, create user record, dsb.
//
// JANGAN gunakan di client-side atau expose ke browser.
// JANGAN gunakan untuk operasi yang seharusnya dibatasi per-user.

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Singleton — buat sekali, reuse
let adminClient: ReturnType<typeof createClient> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env from Supabase → Project Settings → API → service_role key.'
    )
  }

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken:    false,
      persistSession:      false,
      detectSessionInUrl:  false,
    },
  })

  return adminClient
}