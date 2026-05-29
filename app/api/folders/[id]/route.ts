// apps/web-app/app/api/folders/[id]/route.ts
// PATCH  /api/folders/[id]  → rename / move / change color / reorder
// DELETE /api/folders/[id]  → delete (set children to root, keep contents)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db }            from '@/lib/db'
import { z }             from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function authenticate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await db.user.findUnique({
    where:  { id: user.id },
    select: { tenant_id: true },
  })
  if (!dbUser) return null

  return { userId: user.id, tenant_id: dbUser.tenant_id }
}

// ══════════════════════════════════════════════════════════════
// PATCH — rename / move / change color
// ══════════════════════════════════════════════════════════════
const PatchSchema = z.object({
  name:      z.string().min(1).max(100).trim().optional(),
  parentId:  z.string().uuid().nullable().optional(),
  color:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const raw    = await req.json()
    const parsed = PatchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const data = parsed.data

    // ── Verify ownership ──
    const folder = await db.folder.findUnique({
      where:  { id },
      select: { tenant_id: true, parentId: true },
    })

    if (!folder) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (folder.tenant_id !== auth.tenant_id) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // ── Validate move (parentId change) ──
    if (data.parentId !== undefined && data.parentId !== folder.parentId) {
      // Can't move to itself
      if (data.parentId === id) {
        return NextResponse.json(
          { error: 'INVALID_MOVE', message: 'Tidak bisa pindahkan folder ke dirinya sendiri' },
          { status: 400 },
        )
      }

      if (data.parentId !== null) {
        const newParent = await db.folder.findUnique({
          where:  { id: data.parentId },
          select: { tenant_id: true, parentId: true },
        })

        if (!newParent || newParent.tenant_id !== auth.tenant_id) {
          return NextResponse.json(
            { error: 'PARENT_NOT_FOUND' },
            { status: 400 },
          )
        }

        // Parent harus root level (parentId NULL)
        if (newParent.parentId !== null) {
          return NextResponse.json(
            {
              error: 'MAX_DEPTH_EXCEEDED',
              message: 'Folder hanya boleh maksimal 2 level',
            },
            { status: 400 },
          )
        }

        // Kalau folder ini punya children, dia tidak bisa di-move ke sub-level
        // (karena children-nya jadi level 3, illegal)
        const hasChildren = await db.folder.count({
          where: { parentId: id },
        }) > 0

        if (hasChildren) {
          return NextResponse.json(
            {
              error: 'HAS_CHILDREN',
              message: 'Folder yang punya sub-folder tidak bisa dipindah ke dalam folder lain. Pindah dulu sub-folder-nya, atau hapus.',
            },
            { status: 400 },
          )
        }
      }
    }

    // ── Update ──
    try {
      const updated = await db.folder.update({
        where: { id },
        data: {
          ...(data.name !== undefined      && { name: data.name }),
          ...(data.parentId !== undefined  && { parentId: data.parentId }),
          ...(data.color !== undefined     && { color: data.color }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
        select: {
          id:        true,
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
          ...updated,
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at.toISOString(),
        },
      })

    } catch (err: any) {
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'DUPLICATE_NAME', message: 'Folder dengan nama ini sudah ada di level yang sama' },
          { status: 409 },
        )
      }
      throw err
    }

  } catch (err: any) {
    console.error('[PATCH /api/folders/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message }, { status: 500 })
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE — delete folder
// Sub-folders & contents tidak ikut terhapus (set ke parent / root)
// ══════════════════════════════════════════════════════════════
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // ── Verify ownership ──
    const folder = await db.folder.findUnique({
      where:  { id },
      select: { tenant_id: true, parentId: true },
    })

    if (!folder) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (folder.tenant_id !== auth.tenant_id) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // ── Transaction: move children + contents, then delete ──
    await db.$transaction([
      // Move sub-folders ke parent (atau root kalau folder ini sudah root)
      db.folder.updateMany({
        where: { parentId: id },
        data:  { parentId: folder.parentId },
      }),

      // Move contents ke parent folder (atau root)
      db.content.updateMany({
        where: { folderId: id },
        data:  { folderId: folder.parentId },
      }),

      // Delete the folder
      db.folder.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[DELETE /api/folders/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL', message: err?.message }, { status: 500 })
  }
}