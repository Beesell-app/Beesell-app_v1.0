// store/onboardingStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OnboardingData, ProfilData, PlatformData, BrandKitData, PlanData, FirstContentData } from '@/lib/validations/onboarding'

export const STEP_KEYS = ['profil','platform','brandKit','plan','firstContent'] as const
export type StepKey = typeof STEP_KEYS[number]

export const STEP_META = [
  { key: 'profil',       title: 'Profil bisnis',    icon: '◈', desc: 'Tentang kamu & bisnismu' },
  { key: 'platform',     title: 'Platform',          icon: '◉', desc: 'Tempat kamu berjualan' },
  { key: 'brandKit',     title: 'Brand kit',         icon: '◐', desc: 'Identitas visual & suara' },
  { key: 'plan',         title: 'Pilih plan',        icon: '◑', desc: 'Mulai gratis kapan saja' },
  { key: 'firstContent', title: 'Konten pertama',    icon: '●', desc: 'Rasakan hasilnya sekarang' },
] as const

interface OnboardingStore {
  currentStep:    number
  completedSteps: number[]
  data:           OnboardingData
  isSubmitting:   boolean
  error:          string | null

  nextStep:          () => void
  prevStep:          () => void
  skipStep:          () => void
  goToStep:          (step: number) => void
  saveStepData:      <K extends StepKey>(key: K, value: OnboardingData[K]) => void
  markStepComplete:  (step: number) => void
  setSubmitting:     (v: boolean) => void
  setError:          (msg: string | null) => void
  getAllData:         () => OnboardingData
  getProgress:       () => number
  isStepComplete:    (step: number) => boolean
  reset:             () => void
}

const TOTAL = 5

const initialData: OnboardingData = {
  profil: null, platform: null, brandKit: null, plan: null, firstContent: null,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      currentStep:    0,
      completedSteps: [],
      data:           initialData,
      isSubmitting:   false,
      error:          null,

      nextStep:  () => set(s => ({ currentStep: Math.min(s.currentStep + 1, TOTAL - 1) })),
      prevStep:  () => set(s => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      skipStep:  () => set(s => ({ currentStep: Math.min(s.currentStep + 1, TOTAL - 1) })),
      goToStep:  (step) => set({ currentStep: step, error: null }),

      saveStepData: (key, value) =>
        set(s => ({ data: { ...s.data, [key]: value } })),

      markStepComplete: (step) =>
        set(s => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step],
        })),

      setSubmitting: (v) => set({ isSubmitting: v }),
      setError:      (msg) => set({ error: msg }),
      getAllData:     () => get().data,
      getProgress:   () => Math.round((get().completedSteps.length / TOTAL) * 100),
      isStepComplete:(step) => get().completedSteps.includes(step),

      reset: () => set({
        currentStep: 0, completedSteps: [], data: initialData,
        isSubmitting: false, error: null,
      }),
    }),
    {
      name:    'beesell-onboarding-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({
        currentStep: s.currentStep,
        completedSteps: s.completedSteps,
        data: s.data,
      }),
    }
  )
)
