// apps/web-app/lib/ai/image/flux-models.ts
// ── Map quality-tier model key → model Replicate/Flux asli ──
export type FluxModelKey = 'flux-schnell' | 'flux-dev' | 'flux-pro'

export interface FluxModelDef {
  key: FluxModelKey
  replicate: string        // slug model resmi owner/name (tanpa version = pakai latest)
  version?: string | null  // isi hash kalau mau pin versi tertentu
  label: string
}

export const FLUX_MODELS: Record<FluxModelKey, FluxModelDef> = {
  'flux-schnell': { key:'flux-schnell', replicate:'black-forest-labs/flux-schnell', version:null, label:'FLUX.1 [schnell]' },
  'flux-dev':     { key:'flux-dev',     replicate:'black-forest-labs/flux-dev',     version:null, label:'FLUX.1 [dev]' },
  'flux-pro':     { key:'flux-pro',     replicate:'black-forest-labs/flux-1.1-pro', version:null, label:'FLUX1.1 [pro]' },
}

export const isFluxModelKey = (x: unknown): x is FluxModelKey =>
  x === 'flux-schnell' || x === 'flux-dev' || x === 'flux-pro'

export type FluxAspect = '1:1' | '4:5' | '9:16' | '16:9' | '4:3'
const ASPECTS: Record<FluxAspect, number> = { '1:1':1, '4:5':0.8, '9:16':0.5625, '16:9':1.7778, '4:3':1.3333 }

/** width/height (hasil scale quality) → preset aspect_ratio terdekat */
export function aspectFromWH(w: number, h: number): FluxAspect {
  const r = w / h
  let best: FluxAspect = '1:1', diff = Infinity
  for (const [k, v] of Object.entries(ASPECTS) as [FluxAspect, number][]) {
    const dd = Math.abs(r - v)
    if (dd < diff) { diff = dd; best = k }
  }
  return best
}

export interface FluxBuildParams {
  prompt: string
  aspectRatio: FluxAspect
  outputFormat?: 'png' | 'jpg' | 'webp'
  refImageUrl?: string      // img2img (hanya didukung dev & pro)
}

/** Bangun input native Replicate per model (Flux abaikan negative_prompt). */
export function buildFluxInput(key: FluxModelKey, p: FluxBuildParams): Record<string, unknown> {
  const fmt  = p.outputFormat ?? 'png'
  const base = { prompt: p.prompt, aspect_ratio: p.aspectRatio, output_format: fmt }

  switch (key) {
    case 'flux-schnell':
      return { ...base, num_outputs: 1, num_inference_steps: 4, go_fast: true, output_quality: 90, megapixels: '1' }

    case 'flux-dev':
      return {
        ...base, num_outputs: 1, num_inference_steps: 28, guidance: 3, output_quality: 90, megapixels: '1',
        ...(p.refImageUrl ? { image: p.refImageUrl, prompt_strength: 0.85 } : {}),
      }

    case 'flux-pro':
      return {
        ...base, output_quality: 90, safety_tolerance: 2, prompt_upsampling: false,
        ...(p.refImageUrl ? { image_prompt: p.refImageUrl } : {}),
      }
  }
}