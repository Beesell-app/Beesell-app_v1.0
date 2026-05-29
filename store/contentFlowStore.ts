// apps/web-app/store/contentFlowStore.ts
// ── Content Flow Store ─────────────────────────────────────────
// Shared state yang mengalir dari Image/Video generator → Caption generator
// Ketika image/video selesai, context produk otomatis tersedia di caption
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Engine types ───────────────────────────────────────────────
export type CaptionEngine =
  | 'caption'        // Caption standar
  | 'hook'           // Hook Generator — baris pertama yang viral
  | 'cta'            // CTA Generator — call-to-action
  | 'soft-selling'   // Soft Selling — edukasi → nurturing → close
  | 'hard-selling'   // Hard Selling — direct offer + urgency
  | 'description'    // Product Description AI
  | 'marketplace'    // Marketplace Copywriting (Shopee/Tokopedia)

export type ContentFlowStep = 'idle' | 'image' | 'video' | 'caption' | 'done'

export interface GeneratedImage {
  id:       string
  url:      string
  jobId?:   string
  mode:     string  // product | ugc | scene | before-after
  style:    string
  ratio:    string
  savedAt?: string
}

export interface GeneratedVideo {
  id:       string
  url:      string
  jobId?:   string
  duration: number
  savedAt?: string
}

export interface CaptionResult {
  id:      string
  engine:  CaptionEngine
  text:    string
  platform:string
  copiedAt?:string
}

export interface ContentFlowState {
  // ── Flow context ─────────────────────────────────────────────
  step:           ContentFlowStep   // current workflow step
  sessionId:      string            // unique session ID untuk link image+caption

  // ── Product context (di-carry ke semua step) ─────────────────
  productName:    string
  productDesc:    string
  productPrice:   string
  niche:          string
  targetAudience: string
  tone:           string
  language:       string
  emoji:          string
  ctaStyle:       string
  platform:       string

  // ── Generated assets ─────────────────────────────────────────
  images:         GeneratedImage[]
  selectedImage:  GeneratedImage | null
  videos:         GeneratedVideo[]
  selectedVideo:  GeneratedVideo | null

  // ── Caption results ───────────────────────────────────────────
  captions:       CaptionResult[]
  activeEngine:   CaptionEngine

  // ── UI state ──────────────────────────────────────────────────
  isGeneratingCaption: boolean
  captionError:        string | null

  // ── Actions ───────────────────────────────────────────────────
  setStep:          (step: ContentFlowStep) => void
  setProductContext: (ctx: Partial<Pick<ContentFlowState,
    'productName'|'productDesc'|'productPrice'|'niche'|'targetAudience'|
    'tone'|'language'|'emoji'|'ctaStyle'|'platform'>>) => void

  addImage:         (img: GeneratedImage) => void
  selectImage:      (img: GeneratedImage | null) => void
  addVideo:         (vid: GeneratedVideo) => void
  selectVideo:      (vid: GeneratedVideo | null) => void

  addCaption:       (cap: CaptionResult) => void
  setActiveEngine:  (eng: CaptionEngine) => void
  setGeneratingCaption: (v: boolean) => void
  setCaptionError:  (err: string | null) => void

  proceedToCaption: () => void   // dari image/video → caption
  reset:            () => void
}

const INITIAL: Omit<ContentFlowState, 
  'setStep'|'setProductContext'|'addImage'|'selectImage'|'addVideo'|'selectVideo'|
  'addCaption'|'setActiveEngine'|'setGeneratingCaption'|'setCaptionError'|
  'proceedToCaption'|'reset'> = {
  step:            'idle',
  sessionId:       '',
  productName:     '',
  productDesc:     '',
  productPrice:    '',
  niche:           '',
  targetAudience:  '',
  tone:            'casual',
  language:        'indonesian-casual',
  emoji:           'moderate',
  ctaStyle:        'medium',
  platform:        'instagram',
  images:          [],
  selectedImage:   null,
  videos:          [],
  selectedVideo:   null,
  captions:        [],
  activeEngine:    'caption',
  isGeneratingCaption: false,
  captionError:    null,
}

export const useContentFlowStore = create<ContentFlowState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setStep: (step) => set({ step }),

      setProductContext: (ctx) => set(ctx),

      addImage: (img) => set(s => ({
        images: [img, ...s.images.filter(i => i.id !== img.id)].slice(0, 20),
      })),

      selectImage: (img) => set({ selectedImage: img }),

      addVideo: (vid) => set(s => ({
        videos: [vid, ...s.videos.filter(v => v.id !== vid.id)].slice(0, 10),
      })),

      selectVideo: (vid) => set({ selectedVideo: vid }),

      addCaption: (cap) => set(s => ({
        captions: [cap, ...s.captions.filter(c => c.id !== cap.id)].slice(0, 30),
      })),

      setActiveEngine:       (eng) => set({ activeEngine: eng }),
      setGeneratingCaption:  (v)   => set({ isGeneratingCaption: v }),
      setCaptionError:       (err) => set({ captionError: err }),

      proceedToCaption: () => {
        set({ step: 'caption', captionError: null })
        // Scroll ke caption panel
        setTimeout(() => {
          document.getElementById('caption-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      },

      reset: () => set({
        ...INITIAL,
        sessionId: Math.random().toString(36).slice(2),
      }),
    }),
    {
      name:    'beesell-content-flow-v1',
      storage: createJSONStorage(() => sessionStorage),  // session only, tidak persist ke localStorage
      partialize: s => ({
        productName:   s.productName,
        productDesc:   s.productDesc,
        productPrice:  s.productPrice,
        niche:         s.niche,
        tone:          s.tone,
        language:      s.language,
        emoji:         s.emoji,
        ctaStyle:      s.ctaStyle,
        platform:      s.platform,
        images:        s.images.slice(0, 4),  // hanya 4 terakhir
        selectedImage: s.selectedImage,
      }),
    }
  )
)

// ── Engine metadata ────────────────────────────────────────────
export const ENGINE_META: Record<CaptionEngine, {
  label: string; icon: string; desc: string; color: string; bg: string
}> = {
  'caption':      { label:'Caption Standar',    icon:'✍️', desc:'Caption lengkap siap post',                color:'#2563EB', bg:'#EFF6FF' },
  'hook':         { label:'Hook Generator',     icon:'🎣', desc:'Baris pertama yang bikin orang berhenti scroll', color:'#D97706', bg:'#FFFBEB' },
  'cta':          { label:'CTA Generator',      icon:'🎯', desc:'Call-to-action yang mendorong aksi beli',   color:'#DC2626', bg:'#FEF2F2' },
  'soft-selling': { label:'Soft Selling',       icon:'💫', desc:'Edukasi → nurturing → closing halus',       color:'#7C3AED', bg:'#F5F3FF' },
  'hard-selling': { label:'Hard Selling',       icon:'🔥', desc:'Direct offer + urgency + FOMO kuat',       color:'#EF4444', bg:'#FEF2F2' },
  'description':  { label:'Deskripsi Produk',   icon:'📋', desc:'Deskripsi detail + benefit + specs',       color:'#059669', bg:'#ECFDF5' },
  'marketplace':  { label:'Marketplace Copy',   icon:'🛍️', desc:'Judul SEO + deskripsi Shopee/Tokopedia',   color:'#0284C7', bg:'#E0F2FE' },
}