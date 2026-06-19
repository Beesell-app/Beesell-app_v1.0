// lib/replicate-version.ts
// ══════════════════════════════════════════════════════════════
// Replicate Dynamic Version Fetcher
// ══════════════════════════════════════════════════════════════
//
// MASALAH: Hardcoded version hash (e.g. "stability-ai/sdxl:39ed52f2...")
// selalu 422 "version does not exist" ketika model di-update oleh owner-nya.
//
// SOLUSI: Fetch latest_version.id dari API saat runtime, cache per cold start.
// Tidak ada hash yang bisa expired — selalu pakai versi terbaru.
//
// Usage:
//   import { getModelVersion } from '@/lib/replicate-version'
//
//   const version = await getModelVersion('stability-ai/sdxl', token)
//   // → "da77c9f2f88e72fcc91b3..." (latest, fetched once, cached)

type ModelId = string   // format: "owner/model-name"

// Module-level cache — persist per Lambda cold start
// Key: modelId, Value: version hash
const _versionCache = new Map<ModelId, string>()

/**
 * Fetch the latest version hash for a Replicate model.
 * Cached in memory — fetches only once per cold start.
 *
 * @param modelId   e.g. "stability-ai/sdxl"
 * @param token     REPLICATE_API_TOKEN
 * @returns         latest version hash string
 * @throws          Error if model not found or API fails
 */
export async function getModelVersion(
  modelId: string,
  token:   string,
): Promise<string> {
  // Return cached version if available
  const cached = _versionCache.get(modelId)
  if (cached) return cached

  const res = await fetch(
    `https://api.replicate.com/v1/models/${modelId}`,
    {
      headers: { Authorization: `Token ${token}` },
      signal:  AbortSignal.timeout(8_000),
    },
  )

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Model "${modelId}" tidak ditemukan di Replicate. Cek nama model.`)
    }
    if (res.status === 401) {
      throw new Error('REPLICATE_API_TOKEN tidak valid.')
    }
    throw new Error(`Gagal fetch version "${modelId}": HTTP ${res.status}`)
  }

  const data = await res.json() as {
    latest_version?: { id: string }
    name?:           string
  }

  const version = data.latest_version?.id
  if (!version) {
    throw new Error(`Model "${modelId}" tidak punya latest_version. Mungkin private atau belum ada deployment.`)
  }

  _versionCache.set(modelId, version)
  console.log(`[replicate-version] ${modelId.split('/')[1]}: ${version.slice(0, 16)}...`)
  return version
}

/**
 * Invalidate cached version for a model.
 * Call this when you receive a 422 "version does not exist" error
 * so the next request fetches a fresh version.
 */
export function invalidateModelVersion(modelId: string): void {
  _versionCache.delete(modelId)
  console.log(`[replicate-version] cache invalidated: ${modelId}`)
}

/**
 * Helper: parse error from Replicate prediction response
 * and handle version-related errors by invalidating cache.
 */
export function handleReplicateError(
  status:  number,
  body:    Record<string, unknown>,
  modelId: string,
): never {
  const detail = (body.detail ?? body.error ?? `HTTP ${status}`) as string

  if (status === 422 && detail.toLowerCase().includes('version')) {
    invalidateModelVersion(modelId)
    throw new Error('Model AI diperbarui. Refresh halaman dan generate ulang.')
  }
  if (status === 402) {
    throw new Error(
      'Saldo Replicate tidak mencukupi. ' +
      'Isi kredit di replicate.com/account/billing (minimal $5).',
    )
  }
  if (status === 429) {
    throw new Error(
      'Rate limit Replicate. Tambah payment method di replicate.com/account/billing ' +
      'untuk menghilangkan batasan ini.',
    )
  }
  if (status === 401) {
    throw new Error('REPLICATE_API_TOKEN tidak valid.')
  }
  throw new Error(detail)
}