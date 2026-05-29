import { create } from 'zustand'

type EditorStore = {
  zoom: number
  showGrid: boolean

  setZoom: (zoom: number) => void
  toggleGrid: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  zoom: 1,
  showGrid: false,

  setZoom: (zoom) => set({ zoom }),

  toggleGrid: () =>
    set((state) => ({
      showGrid: !state.showGrid,
    })),
}))