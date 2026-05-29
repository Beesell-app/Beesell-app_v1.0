// apps/web-app/app/(auth)/layout.tsx
// Layout untuk semua halaman auth: /login, /register, /forgot-password
// Tidak ada sidebar/header — full page centered layout
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s — BeeSell AI',
    default:  'Masuk — BeeSell AI',
  },
  description: 'Platform AI untuk konten jualan seller Indonesia.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Layout minimal — halaman auth handle styling sendiri
  return <>{children}</>
}
