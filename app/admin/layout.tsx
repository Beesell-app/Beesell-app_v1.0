// app/admin/layout.tsx
// ══════════════════════════════════════════════════════════════
// Admin Layout — SUPER ADMIN ONLY
// 
// ⚡ Dark theme, terpisah dari user dashboard
// 🔍 Log akses untuk debugging redirect issue
// ══════════════════════════════════════════════════════════════

import { requireSuperuser } from '@/lib/supabase/admin-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopbar } from '@/components/admin/admin-topbar'

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  console.log('═══════════════════════════════════════════')
  console.log('[admin/layout] 🚪 Admin layout requested')
  console.log('[admin/layout] Calling requireSuperuser()...')
  
  // ⚡ Server-side guard — redirect kalau bukan superuser
  // Lihat console.log di terminal `npm run dev` untuk trace
  const { user, role } = await requireSuperuser()

  console.log('[admin/layout] ✅ Access granted')
  console.log('[admin/layout] User:', user.email)
  console.log('[admin/layout] Role:', role)
  console.log('═══════════════════════════════════════════')

  return (
    <div style={{ 
      display:'flex', minHeight:'100vh', 
      background:'#0F172A',
      fontFamily:"'DM Sans',sans-serif",
      color: '#F1F5F9',
    }}>
      <AdminSidebar/>

      <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth: 0 }}>
        <AdminTopbar userEmail={user.email ?? ''} role={role}/>

        <div style={{ flex:1, padding:'24px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}