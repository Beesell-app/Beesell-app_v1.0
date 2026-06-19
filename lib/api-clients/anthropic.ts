// lib/api-clients/anthropic.ts
// ══════════════════════════════════════════════════════════════
// Anthropic Claude Client — Haiku 4.5 + Sonnet 4.5 (PMSE)
// ══════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY tidak di-set')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

// ── Models ────────────────────────────────────────────────────
export const CLAUDE_MODELS = {
  // Cheap & fast — untuk Quick Tools (Caption/Hook/Hashtag/Script)
  light:  'claude-haiku-4-5',
  
  // Powerful — untuk Marketing Kit (Campaign/Audience)
  heavy:  'claude-sonnet-4-5',
  
  // Deep reasoning — untuk Budget Optimizer
  deep:   'claude-sonnet-4-5',
} as const

// ── Helper: Generate dengan Haiku (cheap, fast) ──────────────
export async function generateLight(opts: {
  systemPrompt: string
  userPrompt:   string
  maxTokens?:   number
  temperature?: number
}) {
  const res = await anthropic.messages.create({
    model:       CLAUDE_MODELS.light,
    max_tokens:  opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.8,
    system:      opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userPrompt }],
  })

  const block = res.content.find(b => b.type === 'text')
  return {
    text:  block && 'text' in block ? block.text : '',
    usage: res.usage,
  }
}

// ── Helper: Generate dengan Sonnet (heavy reasoning) ─────────
export async function generateHeavy(opts: {
  systemPrompt: string
  userPrompt:   string
  maxTokens?:   number
  temperature?: number
}) {
  const res = await anthropic.messages.create({
    model:       CLAUDE_MODELS.heavy,
    max_tokens:  opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.7,
    system:      opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userPrompt }],
  })

  const block = res.content.find(b => b.type === 'text')
  return {
    text:  block && 'text' in block ? block.text : '',
    usage: res.usage,
  }
}

// ── Helper: parse JSON output dari Claude ─────────────────────
export function parseClaudeJSON<T = any>(text: string): T | null {
  try {
    // Try direct parse
    return JSON.parse(text.trim())
  } catch {}

  // Try extract dari ```json``` block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (match) {
    try { return JSON.parse(match[1]) } catch {}
  }

  // Try find first { ... } object
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch {}
  }

  return null
}