// ================================================================
// lib/db.ts
// Prisma Client Singleton — FIXED & CLEAN (Next.js App Router)
// ================================================================

import { PrismaClient } from '@prisma/client'



const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// ================================================================
// Typed exports (AMAN — jangan dihapus)
// ================================================================

export type {
  Tenant,
  User,
  Folder,
  ScrapedProduct,
  SellerType,
  UserRole,
  Plan,
  Platform,
  ContentType,
  ContentStatus,
  JobType,
  JobStatus,
  Content,
  AiJob
} from '@prisma/client'