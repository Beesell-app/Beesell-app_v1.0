// apps/web-app/lib/platform/token-encryption.ts
// ── AES-256-GCM token encryption ─────────────────────────────
// Uses native node:crypto — zero external dependencies
// Key derivation: PBKDF2 from PLATFORM_TOKEN_ENCRYPTION_KEY env var
// Format: base64(iv:authTag:ciphertext)
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'

const ALGORITHM  = 'aes-256-gcm'
const KEY_LEN    = 32   // 256 bits
const IV_LEN     = 12   // 96 bits (recommended for GCM)
const TAG_LEN    = 16   // 128 bits auth tag
const SEPARATOR  = ':'

// ── Key derivation ────────────────────────────────────────────
function deriveKey(): Buffer {
  const secret = process.env.PLATFORM_TOKEN_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    throw new Error(
      '[token-encryption] PLATFORM_TOKEN_ENCRYPTION_KEY must be ≥32 chars. ' +
      'Generate with: openssl rand -base64 48'
    )
  }

  // PBKDF2 to stretch key to 256 bits
  // Salt is fixed (derived from secret itself) so we don't need to store it
  const salt = Buffer.from(secret.slice(0, 16).padEnd(16, '0'), 'utf8')
  return pbkdf2Sync(secret, salt, 100_000, KEY_LEN, 'sha256')
}

// Cache derived key in module scope (only computed once per process)
let _cachedKey: Buffer | null = null
function getKey(): Buffer {
  if (!_cachedKey) _cachedKey = deriveKey()
  return _cachedKey
}

// ── Encrypt ───────────────────────────────────────────────────
export function encryptToken(plaintext: string): string {
  if (!plaintext) throw new Error('Cannot encrypt empty token')

  const key        = getKey()
  const iv         = randomBytes(IV_LEN)
  const cipher     = createCipheriv(ALGORITHM, key, iv)

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Encode as: base64(iv):base64(authTag):base64(ciphertext)
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(SEPARATOR)
}

// ── Decrypt ───────────────────────────────────────────────────
export function decryptToken(encrypted: string): string {
  if (!encrypted) throw new Error('Cannot decrypt empty value')

  const parts = encrypted.split(SEPARATOR)
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const [ivB64, tagB64, ciphertextB64] = parts
  const key        = getKey()
  const iv         = Buffer.from(ivB64, 'base64')
  const authTag    = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ciphertextB64, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])
    return plaintext.toString('utf8')
  } catch {
    throw new Error('Token decryption failed: invalid key or tampered data')
  }
}

// ── Encrypt/decrypt OAuthTokens object ───────────────────────
export interface EncryptedTokenBundle {
  accessTokenEnc:  string           // encrypted
  refresh_token:Enc: string | null    // encrypted or null
  expiresAt:       string | null    // ISO string (not encrypted, needed for scheduling)
  scope:           string | null
}

export function encryptTokenBundle(tokens: {
  access_token:  string
  refresh_token:?: string | null
  expiresAt?:   Date | null
  scope?:       string | null
}): EncryptedTokenBundle {
  return {
    accessTokenEnc:  encryptToken(tokens.accessToken),
    refresh_token:Enc: tokens.refresh_token: ? encryptToken(tokens.refresh_token:) : null,
    expiresAt:       tokens.expiresAt ? tokens.expiresAt.toISOString() : null,
    scope:           tokens.scope ?? null,
  }
}

export function decryptTokenBundle(bundle: EncryptedTokenBundle): {
  access_token:  string
  refresh_token: string | null
  expiresAt:    Date | null
  scope:        string | null
} {
  return {
    access_token:  decryptToken(bundle.accessTokenEnc),
    refresh_token: bundle.refresh_token:Enc ? decryptToken(bundle.refresh_token:Enc) : null,
    expiresAt:    bundle.expiresAt ? new Date(bundle.expiresAt) : null,
    scope:        bundle.scope,
  }
}

// ── Validation helper ─────────────────────────────────────────
export function isEncrypted(value: string): boolean {
  const parts = value.split(SEPARATOR)
  return parts.length === 3 && parts.every(p => p.length > 0)
}