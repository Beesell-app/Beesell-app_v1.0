'use client'
// apps/web-app/components/ui/PageSkeleton.tsx
// ── Page-level skeleton loaders ───────────────────────────────
// Consistent shimmer across all pages.
// Usage:
//   if (isLoading) return <PageSkeleton type="dashboard" />
// Dashboard page
import React from 'react'

interface SkeletonProps {
  style?: React.CSSProperties
}

// ── Base shimmer block ─────────────────────────────────────────
function Shimmer({ style }: SkeletonProps) {
  return (
    <div style={{
      background:     'linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%)',
      backgroundSize: '200% 100%',
      animation:      'shimmer 1.5s infinite',
      borderRadius:   '6px',
      ...style,
    }} />
  )
}

const CSS = `@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`

// ── Dashboard skeleton ─────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Shimmer style={{ width: '200px', height: '28px' }} />
          <Shimmer style={{ width: '140px', height: '14px' }} />
        </div>
        <Shimmer style={{ width: '120px', height: '36px', borderRadius: '10px' }} />
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ padding: '18px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <Shimmer style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
              <Shimmer style={{ width: '60px', height: '20px' }} />
            </div>
            <Shimmer style={{ width: '80px', height: '28px', marginBottom: '6px' }} />
            <Shimmer style={{ width: '120px', height: '12px' }} />
          </div>
        ))}
      </div>

      {/* Chart + quota */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', height: '280px' }}>
          <Shimmer style={{ width: '150px', height: '20px', marginBottom: '16px' }} />
          <Shimmer style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2].map(i => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Shimmer style={{ width: '96px', height: '96px', borderRadius: '50%' }} />
              <Shimmer style={{ width: '100px', height: '14px' }} />
              <Shimmer style={{ width: '70px', height: '12px' }} />
            </div>
          ))}
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  )
}

// ── Library skeleton ───────────────────────────────────────────
export function LibrarySkeleton() {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Shimmer style={{ width: '180px', height: '28px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Shimmer style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          <Shimmer style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[100, 80, 90, 70].map((w, i) => (
          <Shimmer key={i} style={{ width: `${w}px`, height: '32px', borderRadius: '8px' }} />
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <Shimmer style={{ width: '100%', paddingTop: '100%', borderRadius: 0 }} />
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Shimmer style={{ width: '80%', height: '14px' }} />
              <Shimmer style={{ width: '50%', height: '10px' }} />
            </div>
          </div>
        ))}
      </div>

      <style>{CSS}</style>
    </div>
  )
}

// ── Content creator skeleton ───────────────────────────────────
export function CreatorSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
      {/* Config panel */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[180, 120, 150, 90, 130, 100].map((w, i) => (
          <div key={i}>
            <Shimmer style={{ width: '80px', height: '11px', marginBottom: '8px' }} />
            <Shimmer style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
          </div>
        ))}
        <Shimmer style={{ width: '100%', height: '44px', borderRadius: '10px', marginTop: '8px' }} />
      </div>

      {/* Output panel */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px' }}>
        <Shimmer style={{ width: '160px', height: '20px', marginBottom: '20px' }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <Shimmer style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
            <Shimmer style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
            <Shimmer style={{ width: '75%', height: '14px', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              {[60, 80, 70].map((w, j) => (
                <Shimmer key={j} style={{ width: `${w}px`, height: '22px', borderRadius: '5px' }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{CSS}</style>
    </div>
  )
}

// ── Settings page skeleton ─────────────────────────────────────
export function SettingsSkeleton() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <Shimmer style={{ width: '200px', height: '28px', marginBottom: '24px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Shimmer style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
            <div style={{ flex: 1 }}>
              <Shimmer style={{ width: '140px', height: '16px', marginBottom: '5px' }} />
              <Shimmer style={{ width: '200px', height: '12px' }} />
            </div>
            <Shimmer style={{ width: '60px', height: '24px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>
      <style>{CSS}</style>
    </div>
  )
}

// ── Generic page skeleton (fallback) ──────────────────────────
export function PageSkeleton({ type }: { type?: 'dashboard' | 'library' | 'creator' | 'settings' }) {
  switch (type) {
    case 'dashboard': return <DashboardSkeleton />
    case 'library':   return <LibrarySkeleton />
    case 'creator':   return <CreatorSkeleton />
    case 'settings':  return <SettingsSkeleton />
    default:          return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        {[1,2,3].map(i => <Shimmer key={i} style={{ height: '80px', borderRadius: '12px' }} />)}
        <style>{CSS}</style>
      </div>
    )
  }
}