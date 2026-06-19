'use client'
// app/admin/feature-flags/page.tsx
// ══════════════════════════════════════════════════════════════
// Feature Flag Management — toggle tools on/off + tier availability
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  PageHeader, Card, Button, Toggle, Badge, Toast, EmptyState, D,
} from '@/components/admin/shared/ui'

interface FeatureFlag {
  tool_id: string
  status: 'enabled' | 'disabled' | 'coming-soon' | 'beta'
  reason: string | null
  coming_soon_at: string | null
  available_starter: boolean
  available_basic: boolean
  available_pro: boolean
  available_business: boolean
  updated_at: string | null
  name?: string
  category?: string
  subCategory?: string | null
}

const TOOL_CATEGORIES: Record<string, string[]> = {
  'Writing AI':  ['caption', 'hook', 'hashtag', 'tiktok-script'],
  'Quick Tools': ['remove-bg', 'subtitle', 'resize'],
  'Image AI':    ['packshot', 'enhancer', 'upscale', 'relight', 'remove-object', 'virtual-tryon', 'product-to-model'],
  'Video AI':    ['ugc-generator', 'image-to-video', 'talking-head'],
  'Marketing':   ['campaign-builder', 'audience-intel', 'budget-optimizer', 'scheduler'],
}
const CAT_LABEL: Record<string, string> = {
  writing: 'Writing AI', quick: 'Quick Tools', image: 'Image AI', video: 'Video AI', marketing: 'Marketing',
}
const TOOL_LABELS: Record<string, string> = {
  'caption':           'Caption Generator',
  'hook':              'Hook Generator',
  'hashtag':           'Hashtag AI',
  'tiktok-script':     'TikTok Script',
  'remove-bg':         'Remove Background',
  'subtitle':          'AI Subtitle',
  'resize':            'Resize Multi-Platform',
  'packshot':          'AI Packshot',
  'enhancer':          'Product Enhancer',
  'upscale':           'AI Upscale 4x',
  'relight':           'AI Relight',
  'remove-object':     'Remove Object',
  'virtual-tryon':     'Virtual Try-On',
  'product-to-model':  'Product to Model',
  'ugc-generator':     'UGC Video Generator',
  'image-to-video':    'Image to Video',
  'talking-head':      'Talking Head',
  'campaign-builder':  'Campaign Builder',
  'audience-intel':    'Audience Intel',
  'budget-optimizer':  'Budget Optimizer',
  'scheduler':         'Multi-Platform Scheduler',
}
const GROUP_ORDER = ['writing', 'quick', 'image', 'video', 'marketing']
const groupKey = (f: FeatureFlag) =>
  f.category === 'studio' ? (f.subCategory ?? 'image') : (f.category ?? 'quick')
export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null)

  useEffect(() => { fetchFlags() }, [])

  async function fetchFlags() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags', { credentials: 'include' })
      const data = await res.json()
      if (data.flags) setFlags(data.flags)
    } catch {
      setToast({ type: 'error', msg: 'Gagal load feature flags' })
    } finally {
      setLoading(false)
    }
  }

  async function updateFlag(toolId: string, updates: Partial<FeatureFlag>) {
  setSavingId(toolId)
  const current = flags.find(f => f.tool_id === toolId)
  const { name, category, subCategory, updated_at, ...row } = (current ?? {}) as any
  try {
    const res = await fetch('/api/admin/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...row, ...updates }),  // full row → upsert lengkap
    })
    const data = await res.json()
    if (data.flag) {
      setFlags(prev => prev.map(f => f.tool_id === toolId ? { ...f, ...data.flag } : f))  // pertahankan name/category
      setToast({ type: 'success', msg: `${current?.name ?? toolId} updated` })
    } else throw new Error(data.error || 'Update gagal')
  } catch (err: any) {
    setToast({ type: 'error', msg: err.message })
  } finally {
    setSavingId(null)
  }
}

  const enabledCount = flags.filter(f => f.status === 'enabled').length
  const disabledCount = flags.filter(f => f.status !== 'enabled').length

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Feature Flag Management"
        description="On/off tools real-time tanpa redeploy. Set ketersediaan per tier."
        badge={{ label: 'PHASE 2', color: D.purple }}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchFlags}>
            Refresh
          </Button>
        }
      />

      {/* Summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        <Card padding="14px 18px">
          <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.08em' }}>
            ENABLED
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: D.green, marginTop: 4 }}>
            {enabledCount}
          </div>
        </Card>
        <Card padding="14px 18px">
          <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.08em' }}>
            DISABLED / COMING SOON
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: D.amber, marginTop: 4 }}>
            {disabledCount}
          </div>
        </Card>
        <Card padding="14px 18px">
          <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.08em' }}>
            TOTAL TOOLS
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: D.text, marginTop: 4 }}>
            {flags.length}
          </div>
        </Card>
      </div>

      {loading && (
        <Card>
          <EmptyState icon="⏳" title="Loading feature flags..."/>
        </Card>
      )}

      {!loading && GROUP_ORDER.map(gk => {
        const catFlags = flags.filter(f => groupKey(f) === gk)
        if (catFlags.length === 0) return null
        return (
          <div key={gk} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: D.textDim, marginBottom: 10, letterSpacing: '0.04em' }}>
              {(CAT_LABEL[gk] ?? gk).toUpperCase()} · {catFlags.length} tools
            </h2>
            <Card padding="0">
              {catFlags.map((flag, idx) => (
                <FlagRow
                  key={flag.tool_id}
                  flag={flag}
                  label={flag.name ?? flag.tool_id}
                  isSaving={savingId === flag.tool_id}
                  onUpdate={(updates: any) => updateFlag(flag.tool_id, updates)}
                  isLast={idx === catFlags.length - 1}
                />
              ))}
            </Card>
          </div>
        )
      })}

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)}/>
      )}
    </div>
  )
}

function FlagRow({ flag, label, isSaving, onUpdate, isLast }: any) {
  return (
    <div style={{
      padding: '14px 18px',
      borderBottom: isLast ? 'none' : `1px solid ${D.border}`,
      display: 'grid',
      gridTemplateColumns: '1fr 110px 1fr',
      gap: 16, alignItems: 'center',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
            {label}
          </span>
          <code style={{
            fontSize: 10, color: D.textMute, fontFamily: 'monospace',
            background: D.bg900, padding: '2px 6px', borderRadius: 4,
          }}>
            {flag.tool_id}
          </code>
        </div>
        {flag.status !== 'enabled' && flag.reason && (
          <div style={{ 
            fontSize: 11, color: D.textDim, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <AlertTriangle size={11} color={D.amber}/>
            {flag.reason}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <Toggle
          checked={flag.status === 'enabled'}
          onChange={(v) => onUpdate({ status: v ? 'enabled' : 'disabled' })}
          disabled={isSaving}
        />
        <StatusBadge status={flag.status}/>
      </div>

      <div>
        <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, marginBottom: 6, letterSpacing: '0.04em' }}>
          AVAILABLE ON:
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <TierToggle 
            label="Starter" color={D.textDim}
            checked={flag.available_starter}
            onChange={(v: boolean) => onUpdate({ available_starter: v })}
            disabled={isSaving}
          />
          <TierToggle 
            label="Basic" color={D.amber}
            checked={flag.available_basic}
            onChange={(v: boolean) => onUpdate({ available_basic: v })}
            disabled={isSaving}
          />
          <TierToggle 
            label="Pro" color={D.purple}
            checked={flag.available_pro}
            onChange={(v: boolean) => onUpdate({ available_pro: v })}
            disabled={isSaving}
          />
          <TierToggle 
            label="Business" color={D.blue}
            checked={flag.available_business}
            onChange={(v: boolean) => onUpdate({ available_business: v })}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'enabled':     D.green,
    'disabled':    D.red,
    'coming-soon': D.amber,
    'beta':        D.blue,
  }
  return (
    <Badge color={colors[status] ?? D.textMute}>
      {status.toUpperCase()}
    </Badge>
  )
}

function TierToggle({ label, color, checked, onChange, disabled }: any) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        padding: '4px 10px', borderRadius: 99,
        background: checked ? `${color}25` : 'transparent',
        color: checked ? color : D.textMute,
        border: `1px solid ${checked ? color : D.border}`,
        fontSize: 11, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  )
}