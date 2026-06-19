// lib/runway/client.ts
// ══════════════════════════════════════════════════════════════
// RUNWAY ML Gen-3 — SDK Client & Task Builders
// ══════════════════════════════════════════════════════════════
//
// Runway Gen-3 Alpha Turbo API:
//   POST /v1/image_to_video   → create generation task
//   GET  /v1/tasks/{id}       → poll task status
//   DELETE /v1/tasks/{id}     → cancel task
//
// Supported models:
//   gen3a_turbo  → fastest, best for fashion/commerce (5–10s clips)
//   gen3a        → higher quality, slower
//
// Auth: Authorization: Bearer RUNWAYML_API_SECRET
// Docs: https://docs.dev.runwayml.com/

// ── Types ─────────────────────────────────────────────────────
export type RunwayModel = 'gen3a_turbo' | 'gen3a'

export type RunwayTaskStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'THROTTLED'

export interface RunwayTask {
  id:         string
  status:     RunwayTaskStatus
  progress?:  number          // 0–1 when RUNNING
  output?:    string[]        // video URLs when SUCCEEDED
  failure?:   string          // reason when FAILED
  createdAt:  string
  updatedAt:  string
  // Passed-through for our tracking
  model:      RunwayModel
  options?:   Record<string, unknown>
}

// ── Input types per feature ────────────────────────────────────
export interface RunwayImageToVideoInput {
  /** Base64 data-URI OR public URL of source image */
  imageUri:    string
  /** Optional second image to anchor the final frame */
  endImageUri?:string
  /** Natural-language motion prompt (optional; fewer words = more natural) */
  promptText?: string
  /** Duration in seconds: 5 or 10 */
  duration:    5 | 10
  /** Width pixels — Runway enforces aspect ratio from input image */
  ratio?:      '1280:768' | '768:1280' | '1:1'
  /** Seed for reproducibility */
  seed?:       number
  /** Watermark removal (paid tier only) */
  watermark?:  boolean
}

export interface RunwayTextToVideoInput {
  promptText:  string
  promptImage?:string
  duration:    5 | 10
  ratio?:      '1280:768' | '768:1280' | '1:1'
  seed?:       number
}

// ── Runway API client ──────────────────────────────────────────
export class RunwayClient {
  private readonly apiKey:  string
  private readonly baseUrl: string = 'https://api.dev.runwayml.com/v1'
  private readonly model:   RunwayModel

  constructor(apiKey: string, model: RunwayModel = 'gen3a_turbo') {
    if (!apiKey) throw new Error('RUNWAYML_API_SECRET is required')
    this.apiKey = apiKey
    this.model  = model
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    }
  }

  // ── Image to Video ─────────────────────────────────────────
  async createImageToVideoTask(input: RunwayImageToVideoInput): Promise<RunwayTask> {
    const body: Record<string, unknown> = {
      model:         this.model,
      promptImage:   input.imageUri,
      duration:      input.duration,
      ratio:         input.ratio ?? '768:1280',       // 9:16 default (vertical)
      watermark:     input.watermark ?? false,
    }
    if (input.promptText?.trim())  body.promptText  = input.promptText.trim()
    if (input.endImageUri)         body.lastFrameImage = input.endImageUri
    if (input.seed != null)        body.seed         = input.seed

    return this._post('/image_to_video', body)
  }

  // ── Text to Video ──────────────────────────────────────────
  async createTextToVideoTask(input: RunwayTextToVideoInput): Promise<RunwayTask> {
    const body: Record<string, unknown> = {
      model:         this.model,
      promptText:    input.promptText,
      duration:      input.duration,
      ratio:         input.ratio ?? '768:1280',
      watermark:     false,
    }
    if (input.promptImage) body.promptImage = input.promptImage
    if (input.seed != null) body.seed = input.seed

    return this._post('/image_to_video', body)
  }

  // ── Get task status ────────────────────────────────────────
  async getTask(taskId: string): Promise<RunwayTask> {
    const res  = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      headers: this.headers(),
      // No cache — always fresh status
      cache: 'no-store',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new RunwayError(`GET /tasks/${taskId} failed: ${res.status}`, res.status, err)
    }
    return res.json()
  }

  // ── Cancel task ────────────────────────────────────────────
  async cancelTask(taskId: string): Promise<void> {
    await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method:  'DELETE',
      headers: this.headers(),
    })
  }

  // ── Internal POST ──────────────────────────────────────────
  private async _post(path: string, body: unknown): Promise<RunwayTask> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: this.headers(),
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new RunwayError(
        `POST ${path} failed: ${res.status} — ${err?.message ?? JSON.stringify(err)}`,
        res.status,
        err,
      )
    }
    return res.json()
  }
}

// ── Custom error ───────────────────────────────────────────────
export class RunwayError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: unknown,
  ) {
    super(message)
    this.name = 'RunwayError'
  }
}

// ── Factory ────────────────────────────────────────────────────
export function createRunwayClient(model: RunwayModel = 'gen3a_turbo'): RunwayClient {
  const key = process.env.RUNWAYML_API_SECRET
  if (!key) throw new RunwayError('RUNWAYML_API_SECRET env var not set', 500, {})
  return new RunwayClient(key, model)
}

// ── Motion prompt builders (per existing preset IDs) ──────────
export function buildRunwayPrompt(presetId: string, customPrompt?: string): string {
  if (customPrompt?.trim()) return customPrompt.trim()

  // Map existing motion preset IDs to Runway-optimised prompts
  const PROMPT_MAP: Record<string, string> = {
    'auto':            '',   // no prompt = Gen-3 natural motion
    'subtle-breathe':  'subtle natural breathing, chest rises gently, stillness',
    'fabric-sway':     'fabric gently swaying in light breeze, soft cloth movement',
    'garment-flutter': 'garment fabric flutters softly, natural material motion',
    'hair-wind':       'hair blowing gently in light wind, model stands still',
    'model-turn':      'model slowly turns to show outfit from front to side view',
    'model-walk':      'model walks slowly toward camera, confident catwalk stride',
    'raise-hand':      'model raises hand gracefully to touch fabric, smooth motion',
    'camera-drift-in': 'slow gentle zoom in toward subject, cinematic drift',
    'camera-pan-right':'camera pans slowly left to right, smooth horizontal movement',
    'camera-orbit':    'camera orbits slowly around subject, 360 tracking shot',
    'tiktok-bounce':   'dynamic energetic movement, slight camera bounce, lively',
    'reels-slow-mo':   'dramatic slow motion, graceful fashion movement',
    'story-zoom':      'quick subtle zoom reveal, attention-grabbing',
    'product-rotate':  'product slowly rotates 360 degrees on clean background',
    'floating-product':'product floats gently with subtle parallax depth',
    'packshot-spin':   'product spins slowly, studio lighting shifts subtly',
    // UGC presets
    'soft-selling':    'natural talking head, subtle breathing, warm gestures',
    'hard-selling':    'energetic presenter, dynamic movement, engaging expression',
    'storytelling':    'emotional storytelling delivery, natural movements',
    'ugc-review':      'casual authentic review style, natural hand gestures',
  }
  return PROMPT_MAP[presetId] ?? ''
}