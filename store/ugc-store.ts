// stores/ugc-store.ts
// ══════════════════════════════════════════════════════════════
// UGC VIDEO GENERATOR — Zustand Store
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  UgcStep, UgcFormState, GenerationStatus,
  ContentTypeId, LanguageId, AccentId,
  VideoPresetId, DurationSec, SubtitleStyle,
  CtaOverlay, MusicCategory, ScriptMode,
  ProductCategoryId, OutputResolution,
} from '@/lib/studio/ugc/types'

// ── Initial form state ────────────────────────────────────────
const INITIAL_FORM: UgcFormState = {
  contentType:     null,
  productImages:   [],
  character:       null,
  language:        'indonesia',
  accent:          'natural-id',
  scriptMode:      'auto',
  autoScriptInput: { productName:'', targetMarket:'', mainBenefit:'', painPoint:'' },
  manualScript:    '',
  generatedScript: '',
  videoPreset:     null,
  productCategory: null,
  duration:        30,
  subtitleStyle:   'tiktok',
  ctaOverlay:      'shop-now',
  musicCategory:   'trending',
}

// ── Store interface ───────────────────────────────────────────
interface UgcStore {
  // Navigation
  currentStep:       UgcStep
  completedSteps:    Set<UgcStep>
  setStep:           (step: UgcStep) => void
  nextStep:          () => void
  prevStep:          () => void
  markStepComplete:  (step: UgcStep) => void

  // Form state
  form: UgcFormState

  // Step 1
  setContentType:    (id: ContentTypeId) => void

  // Step 2
  addProductImage:   (file: File) => void
  removeProductImage:(index: number) => void
  clearProductImages:() => void

  // Step 3
  setCharacter:      (id: string) => void

  // Step 4
  setLanguage:       (lang: LanguageId) => void
  setAccent:         (accent: AccentId) => void

  // Step 5
  setScriptMode:     (mode: ScriptMode) => void
  setAutoScriptField:(field: keyof UgcFormState['autoScriptInput'], value: string) => void
  setManualScript:   (script: string) => void
  setGeneratedScript:(script: string) => void

  // Step 6
  setVideoPreset:    (id: VideoPresetId) => void
  setProductCategory:(id: ProductCategoryId) => void

  // Step 7
  setDuration:       (sec: DurationSec) => void

  // Extras
  setSubtitleStyle:  (style: SubtitleStyle) => void
  setCtaOverlay:     (cta: CtaOverlay) => void
  setMusicCategory:  (cat: MusicCategory) => void

  // Generation
  status:            GenerationStatus
  statusMessage:     string
  progress:          number
  videoUrl:          string | null
  selectedResolution:OutputResolution
  setStatus:         (s: GenerationStatus, msg?: string, pct?: number) => void
  setVideoUrl:       (url: string | null) => void
  setResolution:     (res: OutputResolution) => void

  // Script generation
  isScriptLoading:   boolean
  setScriptLoading:  (v: boolean) => void

  // Reset
  reset:             () => void
}

// ── Store implementation ──────────────────────────────────────
export const useUgcStore = create<UgcStore>()(
  devtools(
    (set, get) => ({
      // Navigation
      currentStep:    1,
      completedSteps: new Set(),

      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set(s => ({ currentStep: Math.min(8, s.currentStep + 1) as UgcStep })),
      prevStep: () => set(s => ({ currentStep: Math.max(1, s.currentStep - 1) as UgcStep })),
      markStepComplete: (step) => set(s => ({
        completedSteps: new Set([...s.completedSteps, step])
      })),

      // Form
      form: { ...INITIAL_FORM },

      // Step 1
      setContentType: (id) => set(s => ({ form: { ...s.form, contentType: id } })),

      // Step 2
      addProductImage: (file) => set(s => ({
        form: { ...s.form, productImages: [...s.form.productImages, file].slice(0, 5) }
      })),
      removeProductImage: (index) => set(s => ({
        form: { ...s.form, productImages: s.form.productImages.filter((_, i) => i !== index) }
      })),
      clearProductImages: () => set(s => ({ form: { ...s.form, productImages: [] } })),

      // Step 3
      setCharacter: (id) => set(s => ({ form: { ...s.form, character: id } })),

      // Step 4
      setLanguage: (lang) => {
        const accentMap: Record<LanguageId, AccentId> = {
          indonesia: 'natural-id',
          english:   'american-en',
        }
        set(s => ({ form: { ...s.form, language: lang, accent: accentMap[lang] } }))
      },
      setAccent: (accent) => set(s => ({ form: { ...s.form, accent } })),

      // Step 5
      setScriptMode: (mode) => set(s => ({ form: { ...s.form, scriptMode: mode } })),
      setAutoScriptField: (field, value) => set(s => ({
        form: { ...s.form, autoScriptInput: { ...s.form.autoScriptInput, [field]: value } }
      })),
      setManualScript: (script) => set(s => ({ form: { ...s.form, manualScript: script } })),
      setGeneratedScript: (script) => set(s => ({ form: { ...s.form, generatedScript: script } })),

      // Step 6
      setVideoPreset: (id) => set(s => ({ form: { ...s.form, videoPreset: id } })),
      setProductCategory: (id) => set(s => ({ form: { ...s.form, productCategory: id } })),

      // Step 7
      setDuration: (sec) => set(s => ({ form: { ...s.form, duration: sec } })),

      // Extras
      setSubtitleStyle: (style) => set(s => ({ form: { ...s.form, subtitleStyle: style } })),
      setCtaOverlay:    (cta)   => set(s => ({ form: { ...s.form, ctaOverlay: cta } })),
      setMusicCategory: (cat)   => set(s => ({ form: { ...s.form, musicCategory: cat } })),

      // Generation
      status:            'idle',
      statusMessage:     '',
      progress:          0,
      videoUrl:          null,
      selectedResolution:'vertical',

      setStatus: (s, msg = '', pct = 0) => set({ status: s, statusMessage: msg, progress: pct }),
      setVideoUrl: (url) => set({ videoUrl: url }),
      setResolution: (res) => set({ selectedResolution: res }),

      // Script loading
      isScriptLoading: false,
      setScriptLoading: (v) => set({ isScriptLoading: v }),

      // Reset
      reset: () => set({
        currentStep:    1,
        completedSteps: new Set(),
        form:           { ...INITIAL_FORM, productImages: [] },
        status:         'idle',
        statusMessage:  '',
        progress:       0,
        videoUrl:       null,
      }),
    }),
    { name: 'ugc-store' }
  )
)

// ── Selector helpers ──────────────────────────────────────────
export const isStepComplete = (store: UgcStore, step: UgcStep): boolean =>
  store.completedSteps.has(step)

export const canProceedFromStep = (form: UgcFormState, step: UgcStep): boolean => {
  switch (step) {
    case 1: return !!form.contentType
    case 2: return form.productImages.length > 0
    case 3: return !!form.character
    case 4: return !!form.language && !!form.accent
    case 5: return form.scriptMode === 'manual'
      ? form.manualScript.trim().length > 20
      : form.generatedScript.trim().length > 20
    case 6: return !!form.videoPreset
    case 7: return !!form.duration
    default: return true
  }
}