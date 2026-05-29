// apps/web-app/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'dist', '**/*.live.test.ts'],
    pool: 'threads',
    maxThreads: 4,
    minThreads: 1,
    // ── Coverage ────────────────────────────────────────
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['lib/ai/**/*.ts', 'lib/quota/**/*.ts', 'lib/scraper/**/*.ts', 'lib/content/**/*.ts'],
    } as any,

    // ── Test isolation & Performance ───────────────────
    isolate: true,
    
    // Paksa TypeScript diam dengan cast ke 'any' agar tidak menghalangi Build
    ...({
      pool: 'threads',
      isolate: false,
    } as any),

    // Timeout per test 10s
    testTimeout: 10_000,
    hookTimeout: 10_000,

    // Reporter
    reporters: ['default'],
  } as any, // Cast seluruh blok test ke 'any'
})