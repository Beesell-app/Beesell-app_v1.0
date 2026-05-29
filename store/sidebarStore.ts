// apps/web-app/store/sidebarStore.ts
// ── Sidebar state: collapsed (icon-only at md), mobile open ──
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SidebarStore {
  collapsed:    boolean   // md+: icon-only mode
  mobileOpen:   boolean   // <640: overlay drawer
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
  setMobileOpen:   (v: boolean) => void
  closeMobile:     () => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      collapsed:  false,
      mobileOpen: false,

      setCollapsed:    (v) => set({ collapsed: v }),
      toggleCollapsed: ()  => set({ collapsed: !get().collapsed }),
      setMobileOpen:   (v) => set({ mobileOpen: v }),
      closeMobile:     ()  => set({ mobileOpen: false }),
    }),
    {
      name:    'beesell-sidebar',
      storage: createJSONStorage(() => localStorage),
      // Only persist collapsed state — mobileOpen always starts false
      partialize: (s) => ({ collapsed: s.collapsed }),
    },
  ),
)