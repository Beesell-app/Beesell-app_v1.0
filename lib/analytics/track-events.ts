// apps/web-app/lib/analytics/track-events.ts
// ── Where to add track() calls in existing code ───────────────
// This file shows the exact integration points.
// Add these calls to the files mentioned.

// ════════════════════════════════════════════════════════════
// 1. CAPTION GENERATION — app/api/generate/text/route.ts
// ════════════════════════════════════════════════════════════
//
// After successful generation (server-side PostHog via API):
//
//   import { PostHog } from 'posthog-node'
//   const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)
//   await ph.capture({
//     distinctId: ctx.userId,
//     event:      'caption_generate_success',
//     properties: {
//       platform:     params.platform,
//       content_goal: params.contentGoal,
//       model,
//       cached:       false,
//       duration_ms:  Date.now() - startTime,
//       variants:     params.variants,
//     },
//   })
//   await ph.shutdown()
//
// On client side (ConfigPanel.tsx / useGenerateCaption hook):
//   import { track } from '@/lib/analytics/posthog'
//
//   // Before generate:
//   track.caption_generate_started({
//     platform:     params.platform,
//     content_goal: params.contentGoal,
//     tone:         params.tone,
//     language:     params.language,
//     input_mode:   activeTab,
//     has_brand_kit: brandKitEnabled,
//     variants:     params.variants,
//   })
//
//   // On success:
//   track.caption_generate_success({ ... })
//
//   // On quota exceeded:
//   track.quota_exceeded({ metric: 'caption', limit: err.limit, plan: ctx.plan })
//   track.upgrade_modal_shown({ current_plan: ctx.plan, suggested_plan: nextPlan })

// ════════════════════════════════════════════════════════════
// 2. AUTH — app/(auth)/register/page.tsx + login/page.tsx
// ════════════════════════════════════════════════════════════
//
//   // After successful registration:
//   track.auth_registered({ plan: 'free', invite_code: code || undefined })
//
//   // After successful login:
//   track.auth_logged_in()
//
//   // After logout (useFeedbackOnLogout hook):
//   track.auth_logged_out({ feedback_given: feedbackSubmitted })
//   resetUser()  // clears PostHog identity

// ════════════════════════════════════════════════════════════
// 3. SCHEDULER — lib/hooks/useScheduler.ts
// ════════════════════════════════════════════════════════════
//
//   // In useScheduleContent onSuccess:
//   track.content_scheduled({ platform: payload.platform, source: 'drag' })
//
//   // In useRescheduleContent onSuccess:
//   track.content_rescheduled()
//
//   // In useUnscheduleContent onSuccess:
//   track.content_unscheduled()

// ════════════════════════════════════════════════════════════
// 4. PLATFORM CONNECTIONS — components/platform/PlatformCard.tsx
// ════════════════════════════════════════════════════════════
//
//   // On connect button click:
//   track.platform_connect_started({ platform: cfg.id })
//
//   // After popup closes (assume connected):
//   track.platform_connected({ platform: cfg.id })
//
//   // On disconnect:
//   track.platform_disconnected({ platform: cfg.id })

// ════════════════════════════════════════════════════════════
// 5. TEMPLATE EDITOR — components/editor/TemplateGallery.tsx
// ════════════════════════════════════════════════════════════
//
//   // On template select:
//   track.template_selected({ template_id: templateId, category: template.category })
//
//   // On export:
//   track.template_exported({ template_id: activeTemplateId, format: 'png' })

// ════════════════════════════════════════════════════════════
// 6. LIBRARY SEARCH — lib/hooks/useSearch.ts
// ════════════════════════════════════════════════════════════
//
//   // After search returns:
//   track.library_searched({
//     match_type:   data.searchMeta?.matchType ?? 'fts',
//     result_count: data.total,
//   })

// ════════════════════════════════════════════════════════════
// 7. NPS SURVEY — components/feedback/NpsSurvey.tsx
// ════════════════════════════════════════════════════════════
//
//   // On submit:
//   track.nps_submitted({
//     score,
//     category: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor',
//     day:      surveyDay,
//   })

// ════════════════════════════════════════════════════════════
// 8. ONBOARDING — app/api/onboarding/route.ts (POST handler)
// ════════════════════════════════════════════════════════════
//
//   // After marking step complete (server-side):
//   const stepNumber = STEPS.findIndex(s => s.key === step) + 1
//   // via posthog-node:
//   await ph.capture({
//     distinctId: me.userId,
//     event:      'onboarding_step_completed',
//     properties: { step, step_number: stepNumber },
//   })
//
//   // If all done:
//   await ph.capture({ distinctId: me.userId, event: 'onboarding_completed', properties: { days_to_complete: daysSinceRegister } })

export {}