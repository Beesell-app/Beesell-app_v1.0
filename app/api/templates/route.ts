// apps/web-app/app/api/templates/route.ts
// GET /api/templates — list semua templates
// Bisa filter by category: /api/templates?category=instagram_feed
import { NextResponse } from 'next/server'
import { TEMPLATES, CATEGORY_LABELS, type TemplateCategory } from '@/lib/canvas/templates'
import { generateTemplateSvg } from '@/lib/canvas/thumbnail-svg'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Auth check (templates bisa diakses semua user login)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as TemplateCategory | null

    let templates = TEMPLATES
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // Serialize dengan SVG thumbnail (inline)
    const result = templates.map(t => ({
      id:            t.id,
      name:          t.name,
      description:   t.description,
      category:      t.category,
      categoryLabel: t.categoryLabel,
      canvas:        t.canvas,
      palette:       t.palette,
      fonts:         t.fonts,
      tags:          t.tags,
      // SVG thumbnail di-generate server-side (no Fabric needed)
      thumbnailSvg:  generateTemplateSvg(t, 360),
    }))

    return NextResponse.json({
      success:   true,
      total:     result.length,
      templates: result,
      categories: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
        value,
        label,
        count: TEMPLATES.filter(t => t.category === value).length,
      })),
    })
  } catch (err) {
    console.error('[GET /api/templates]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}