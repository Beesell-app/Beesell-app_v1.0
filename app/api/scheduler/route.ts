// app/api/scheduler/route.ts
// ══════════════════════════════════════════════════════════════
// MULTI-PLATFORM SCHEDULER API — Complete
// ══════════════════════════════════════════════════════════════
//
// GET  /api/scheduler?from=ISO&to=ISO&platform=&status=
// POST /api/scheduler { action: 'create'|'update'|'delete'|'reorder'|
//                                'approve'|'reject'|'best-time'|
//                                'trigger-repost'|'save-repost-config' }

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"
import { BEST_TIMES, type SchedulePlatformId } from "@/lib/scheduler/types"

export const dynamic     = "force-dynamic"
export const maxDuration = 30

// ── GET ───────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 })

    const { searchParams } = new URL(req.url)
    const from     = searchParams.get("from") ?? new Date().toISOString().split("T")[0]
    const to       = searchParams.get("to")   ?? ""
    const platform = searchParams.get("platform") as SchedulePlatformId | null
    const status   = searchParams.get("status")

    let query = supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", user.id)
      .gte("scheduled_at", from)
      .order("scheduled_at", { ascending: true })
      .limit(300)

    if (to)       query = query.lte("scheduled_at", to)
    if (status)   query = query.eq("status", status)
    if (platform) query = query.contains("platforms", [platform])

    const { data:posts, error } = await query
    if (error) throw error

    const { data:connections } = await supabase
      .from("platform_connections")
      .select("platform, status, scheduler_enabled, auto_publish")
      .eq("tenant_id", user.id)

    const { data:repostCfg } = await supabase
      .from("repost_configs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    const p = posts ?? []
    return NextResponse.json({
      posts:       p,
      repostConfig:repostCfg ?? null,
      connections: connections ?? [],
      stats: {
        total:     p.length,
        scheduled: p.filter(x => x.status === "scheduled").length,
        pending:   p.filter(x => x.status === "pending").length,
        published: p.filter(x => x.status === "published").length,
        failed:    p.filter(x => x.status === "failed").length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error:err?.message }, { status:500 })
  }
}

// ── POST ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 })

    const body   = await req.json()
    const action = body.action ?? "create"

    // ── best-time ───────────────────────────────────────────────
    if (action === "best-time") {
      const { platforms, niche, contentType } = body
      const staticSlots: Record<string, any[]> = {}
      ;(platforms as SchedulePlatformId[]).forEach(p => {
        staticSlots[p] = (BEST_TIMES[p] ?? []).slice(0, 3)
      })

      let aiTip = ""
      try {
        const ai  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const msg = await ai.messages.create({
          model:"claude-sonnet-4-20250514", max_tokens:300,
          messages:[{ role:"user", content:
            `Best posting time for Indonesian ${niche||"e-commerce"} seller.
Platforms: ${(platforms||[]).join(", ")} | Content: ${contentType||"video"}
Give 2 specific sentences in bahasa Indonesia about when and why. No markdown.` }],
        })
        aiTip = (msg.content[0] as any).text ?? ""
      } catch {}

      // Build next 7-day suggestions
      const suggestions: any[] = []
      const now = new Date()
      ;(platforms as SchedulePlatformId[]).forEach(p => {
        (BEST_TIMES[p] ?? []).slice(0,2).forEach(slot => {
          const d = new Date(now); d.setHours(slot.hour, 0, 0, 0)
          const todayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
          let ahead = (slot.dayOfWeek - todayIdx + 7) % 7
          if (ahead === 0 && d <= now) ahead = 7
          d.setDate(d.getDate() + ahead)
          suggestions.push({ platform:p, datetime:d.toISOString(), score:slot.score, label:slot.label })
        })
      })

      return NextResponse.json({
        staticSlots,
        suggestions: suggestions.sort((a,b) => b.score - a.score),
        aiTip,
      })
    }

    // ── create / update post ────────────────────────────────────
    if (action === "create" || action === "update") {
      const { id, title, caption="", hashtags=[], mediaUrls=[], mediaType="image",
        assetId, platforms, scheduledAt, timezone="Asia/Jakarta", requiresApproval=false } = body

      if (!title?.trim())     return NextResponse.json({ error:"Title wajib diisi" }, { status:400 })
      if (!platforms?.length) return NextResponse.json({ error:"Pilih minimal 1 platform" }, { status:400 })
      if (!scheduledAt)       return NextResponse.json({ error:"Waktu posting wajib diisi" }, { status:400 })

      const { data:profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
      const needsApproval    = requiresApproval && profile?.plan === "business"
      const status           = needsApproval ? "pending" : "scheduled"

      const row = {
        user_id:user.id, title:title.trim(), caption:caption.trim(),
        hashtags, media_urls:mediaUrls, media_type:mediaType,
        asset_id:assetId??null, platforms, scheduled_at:scheduledAt, timezone,
        status, requires_approval:needsApproval,
        approval_status:needsApproval?"pending":"none",
        is_repost:false, repost_count:0,
        updated_at:new Date().toISOString(),
      }

      let result
      if (id && action === "update") {
        const { data, error } = await supabase.from("scheduled_posts")
          .update(row).eq("id", id).eq("user_id", user.id).select().single()
        if (error) throw error; result = data
      } else {
        const { data, error } = await supabase.from("scheduled_posts")
          .insert({ ...row, created_at:new Date().toISOString() }).select().single()
        if (error) throw error; result = data
      }

      if (needsApproval) {
        try {
          await supabase.from("approval_logs").insert({
            post_id:result.id, user_id:user.id, action:"submitted",
            created_at:new Date().toISOString(),
          })
        } catch (_) {}
      }

      return NextResponse.json({ success:true, post:result, requiresApproval:needsApproval })
    }

    // ── reorder ─────────────────────────────────────────────────
    if (action === "reorder") {
      const { order } = body
      await Promise.all((order||[]).map(({ id, queuePosition }: any) =>
        supabase.from("scheduled_posts")
          .update({ queue_position:queuePosition, updated_at:new Date().toISOString() })
          .eq("id", id).eq("user_id", user.id)
      ))
      return NextResponse.json({ success:true })
    }

    // ── delete ──────────────────────────────────────────────────
    if (action === "delete") {
      const { id } = body
      await supabase.from("scheduled_posts").delete().eq("id", id).eq("user_id", user.id)
      return NextResponse.json({ success:true })
    }

    // ── approve / reject ────────────────────────────────────────
    if (action === "approve" || action === "reject") {
      const { postId, note } = body
      const approvalStatus = action === "approve" ? "approved" : "rejected"
      const postStatus     = action === "approve" ? "scheduled"  : "rejected"

      await supabase.from("scheduled_posts").update({
        approval_status: approvalStatus,
        approver_id:     user.id,
        approver_note:   note ?? null,
        approved_at:     action === "approve" ? new Date().toISOString() : null,
        status:          postStatus,
        updated_at:      new Date().toISOString(),
      }).eq("id", postId)

      try {
        await supabase.from("approval_logs").insert({
          post_id:postId, user_id:user.id, action:approvalStatus, note,
          created_at:new Date().toISOString(),
        })
      } catch (_) {}

      return NextResponse.json({ success:true })
    }

    // ── save-repost-config ──────────────────────────────────────
    if (action === "save-repost-config") {
      const { enabled, minPerformance, minDaysOld, maxReposts, platforms, scheduleGapDays } = body
      await supabase.from("repost_configs").upsert({
        user_id:user.id, enabled,
        min_performance:minPerformance??75,
        min_days_old:minDaysOld??30,
        max_reposts:maxReposts??3,
        platforms:platforms??["instagram","tiktok"],
        schedule_gap_days:scheduleGapDays??21,
        updated_at:new Date().toISOString(),
      }, { onConflict:"user_id" })
      return NextResponse.json({ success:true })
    }

    // ── trigger-repost ──────────────────────────────────────────
    if (action === "trigger-repost") {
      const { data:cfg } = await supabase.from("repost_configs")
        .select("*").eq("user_id", user.id).maybeSingle()

      if (!cfg?.enabled) return NextResponse.json({ reposted:0, message:"Auto-repost tidak aktif" })

      const { data:eligible } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "published")
        .gte("performance_score", cfg.min_performance)
        .lte("repost_count", cfg.max_reposts - 1)

      if (!eligible?.length) return NextResponse.json({ reposted:0, message:"Tidak ada konten eligible" })

      const now = new Date(); const reposts = []
      for (const post of eligible.slice(0,5)) {
        const daysSince = (now.getTime() - new Date(post.published_at||post.created_at).getTime()) / 86400000
        if (daysSince < cfg.min_days_old) continue

        const repostDate = new Date()
        repostDate.setDate(repostDate.getDate() + cfg.schedule_gap_days)
        repostDate.setHours(12, 0, 0, 0)

        const { data:repost } = await supabase.from("scheduled_posts").insert({
          user_id:user.id, title:`[Repost] ${post.title}`, caption:post.caption,
          hashtags:post.hashtags, media_urls:post.media_urls, media_type:post.media_type,
          platforms:(cfg.platforms as string[]).filter((p:string)=>(post.platforms as string[]).includes(p)),
          scheduled_at:repostDate.toISOString(), timezone:post.timezone,
          status:"scheduled", requires_approval:false, approval_status:"none",
          is_repost:true, original_post_id:post.id, repost_count:0,
          created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
        }).select().single()

        if (repost) {
          await supabase.from("scheduled_posts")
            .update({ repost_count:post.repost_count+1 }).eq("id", post.id)
          reposts.push(repost)
        }
      }

      return NextResponse.json({ success:true, reposted:reposts.length, posts:reposts })
    }

    return NextResponse.json({ error:`Action '${action}' tidak dikenal` }, { status:400 })

  } catch (err: any) {
    console.error("[scheduler POST]", err)
    return NextResponse.json({ error:err?.message ?? "Server error" }, { status:500 })
  }
}