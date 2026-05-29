// apps/web-app/vitest.setup.ts
// Global setup for all tests
import { vi, beforeEach, afterEach } from 'vitest'

// ── Mock environment variables ─────────────────────────
process.env.OPENAI_API_KEY      = 'test-key'
process.env.FIRECRAWL_API_KEY   = 'test-firecrawl-key'
process.env.REPLICATE_API_TOKEN = 'test-replicate-token'
process.env.DATABASE_URL        = 'postgresql://postgres.zlidhkmrsixuhoudybdq:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgress?pgbouncer=true'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

// ── Global beforeEach: reset mocks ─────────────────────
beforeEach(() => {
  // Clear all mock call history but keep implementations
  vi.clearAllMocks()
  // Paksa agar fitur cache dianggap aktif
  process.env.PINECONE_API_KEY = 'mock-key'
  process.env.PINECONE_ENVIRONMENT = 'us-east-1'
  process.env.PINECONE_INDEX = 'mock-index'
})

afterEach(() => {
  // Restore any mocked timers/fetches
  vi.useRealTimers()
})

// ── Suppress console noise in tests (optional) ─────────
// Uncomment kalau output console terlalu ramai
// global.console.error = vi.fn()
// global.console.warn  = vi.fn()