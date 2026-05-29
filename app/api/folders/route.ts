// apps/web-app/app/api/folders/route.ts
// GET  /api/folders  → return folder tree dengan content count
// POST /api/folders  → create new folder
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { z }             from 'zod'
import type { Folder, CreateFolderInput } from '@/lib/folder-types'
import { DEFAULT_COLOR } from '@/lib/folder-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Auth helper ────────────────────────────────────────────
async function authenticate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true, role: true },
  })
  if (!dbUser) return null

  return { userId: user.id, tenant_id: dbUser.tenant_id, role: dbUser.role }
}

// ══════════════════════════════════════════════════════════════
// GET — fetch folder tree
// ══════════════════════════════════════════════════════════════
export async function GET() {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all folders (small dataset, max 2 level deep)
    const folders = await db.folder.findMany({
      where:  { tenant_id: auth.tenant_id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id:        true,
        tenant_id:  true,
        parentId:  true,
        name:      true,
        color:     true,
        sortOrder: true,
        created_at: true,
        updated_at: true,
      },
    })

    // Get content count per folder (single query)
    const contentCounts = await db.content.groupBy({
      by:      ['folderId'],
      where: {
        tenant_id:  auth.tenant_id,
        deleted_at: null,
        folderId:  { not: null },
      },
      _count:  { _all: true },
    })

    const countMap = new Map<string, number>()
    contentCounts.forEach(c => {
      if (c.folderId) countMap.set(c.folderId, c._count._all)
    })

    // Build tree structure
    const folderMap = new Map<string, Folder & { children: Folder[] }>()
    const roots: Array<Folder & { children: Folder[] }> = []

    // First pass: convert + initialize
    folders.forEach(f => {
      folderMap.set(f.id, {
        ...f,
        created_at:    f.created_at.toISOString(),
        updated_at:    f.updated_at.toISOString(),
        children:     [],
        contentCount: countMap.get(f.id) ?? 0,
      })
    })

    // Second pass: assign to parents
    folderMap.forEach(folder => {
      if (folder.parentId === null) {
        roots.push(folder)
      } else {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children.push(folder)
        } else {
          // Orphan (parent deleted) → treat as root
          roots.push(folder)
        }
      }
    })

    // Get root content count (folder_id IS NULL)
    const rootContentCount = await db.content.count({
      where: {
        tenant_id:  auth.tenant_id,
        deleted_at: null,
        folderId:  null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        roots,
        rootContentCount,
        totalFolders: folders.length,
      },
    })

  } catch (err: any) {
    console.error('[GET /api/folders]', err)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════
// POST — create folder
// ══════════════════════════════════════════════════════════════
const CreateSchema = z.object({
  name:     z.string().min(1).max(100).trim(),
  parentId: z.string().uuid().nullable().optional(),
  color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function POST(req: Request) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw    = await req.json()
    const parsed = CreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const { name, parentId, color } = parsed.data

    // ── Validate parent depth (max 2 level) ──
    if (parentId) {
      const parent = await db.folder.findUnique({
        where:  { id: parentId },
        select: { tenant_id: true, parentId: true },
      })

      if (!parent) {
        return NextResponse.json({ error: 'PARENT_NOT_FOUND' }, { status: 400 })
      }

      if (parent.tenant_id !== auth.tenant_id) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }

      if (parent.parentId !== null) {
        return NextResponse.json(
          {
            error: 'MAX_DEPTH_EXCEEDED',
            message: 'Folder hanya boleh maksimal 2 level. Tidak bisa buat sub-folder di dalam sub-folder.',
          },
          { status: 400 },
        )
      }
    }

    // ── Get max sortOrder di same level ──
    const maxOrder = await db.folder.findFirst({
      where:  { tenant_id: auth.tenant_id, parentId: parentId ?? null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // ── Create ──
    try {
      const created = await db.folder.create({
        data: {
          tenant_id:  auth.tenant_id,
          parentId:  parentId ?? null,
          name,
          color:     color ?? DEFAULT_COLOR,
          sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
        select: {
          id:        true,
          tenant_id:  true,
          parentId:  true,
          name:      true,
          color:     true,
          sortOrder: true,
          created_at: true,
          updated_at: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...created,
          created_at:    created.created_at.toISOString(),
          updated_at:    created.updated_at.toISOString(),
          children:     [],
          contentCount: 0,
        },
      })
    } catch (err: any) {
      // Handle unique constraint (duplicate name di same level)
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'DUPLICATE_NAME', message: 'Folder dengan nama ini sudah ada di level yang sama' },
          { status: 409 },
        )
      }
      throw err
    }

  } catch (err: any) {
    console.error('[POST /api/folders]', err)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message }, { status: 500 })
  }
}