// apps/web-app/__tests__/_helpers/mock-redis.ts
// In-memory Redis mock untuk Upstash
// Drop-in replacement: import dari sini, pass ke import yang butuh redis client
import { vi } from 'vitest'

interface Entry {
  value:  any
  expiry: number | null
}

class MockRedis {
  private store = new Map<string, Entry>()

  async get(key: string) {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: any, opts?: { ex?: number; px?: number; nx?: boolean }) {
    if (opts?.nx && this.store.has(key)) return null

    const expiry = opts?.ex ? Date.now() + opts.ex * 1000
                : opts?.px ? Date.now() + opts.px
                : null

    this.store.set(key, { value, expiry })
    return 'OK'
  }

  async del(...keys: string[]) {
    let count = 0
    for (const k of keys) {
      if (this.store.delete(k)) count++
    }
    return count
  }

  async incr(key: string) {
    const entry = this.store.get(key)
    const newVal = (Number(entry?.value) || 0) + 1
    this.store.set(key, { value: newVal, expiry: entry?.expiry ?? null })
    return newVal
  }

  async decr(key: string) {
    const entry = this.store.get(key)
    const newVal = (Number(entry?.value) || 0) - 1
    this.store.set(key, { value: newVal, expiry: entry?.expiry ?? null })
    return newVal
  }

  async incrby(key: string, by: number) {
    const entry = this.store.get(key)
    const newVal = (Number(entry?.value) || 0) + by
    this.store.set(key, { value: newVal, expiry: entry?.expiry ?? null })
    return newVal
  }

  async decrby(key: string, by: number) {
    const entry = this.store.get(key)
    const newVal = (Number(entry?.value) || 0) - by
    this.store.set(key, { value: newVal, expiry: entry?.expiry ?? null })
    return newVal
  }

  async expire(key: string, seconds: number) {
    const entry = this.store.get(key)
    if (!entry) return 0
    entry.expiry = Date.now() + seconds * 1000
    this.store.set(key, entry)
    return 1
  }

  async exists(key: string) {
    const entry = this.store.get(key)
    if (!entry) return 0
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key)
      return 0
    }
    return 1
  }

  async eval(_script: string, _keys: string[], _args: any[]) {
    // Stub for Lua scripts (quota dual-key check)
    return 1
  }

  async pipeline() {
    const ops: Array<() => Promise<any>> = []
    const pipeline: any = {
      get:    (k: string) => { ops.push(() => this.get(k)); return pipeline },
      set:    (k: string, v: any, opts?: any) => { ops.push(() => this.set(k, v, opts)); return pipeline },
      incr:   (k: string) => { ops.push(() => this.incr(k)); return pipeline },
      del:    (k: string) => { ops.push(() => this.del(k)); return pipeline },
      expire: (k: string, s: number) => { ops.push(() => this.expire(k, s)); return pipeline },
      exec:   async () => {
        const results = []
        for (const op of ops) results.push(await op())
        return results
      },
    }
    return pipeline
  }

  // Test helper: clear all data
  __clear() {
    this.store.clear()
  }

  // Test helper: inspect store
  __debug() {
    return Object.fromEntries(this.store.entries())
  }
}

export const mockRedis = new MockRedis()

// Mock Redis.fromEnv() to return our mock
export const redisMockSetup = () => {
  vi.mock('@upstash/redis', () => ({
    Redis: {
      fromEnv: () => mockRedis,
    },
  }))
}