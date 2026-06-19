'use client'
// app/admin/pricing/page.tsx
// ══════════════════════════════════════════════════════════════
// Pricing Editor — edit plans, daily limits, credit costs
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { RefreshCw, Save, Edit3 } from 'lucide-react'
import {
  PageHeader, Card, Button, Input, Toast, EmptyState, Modal, Badge, D,
} from '@/components/admin/shared/ui'
import Link from 'next/link'

interface Plan {
  tier:           string
  price_monthly:  number
  display_name:   string | null
  description:    string | null
  monthly_credit_quota: number
}

interface DailyLimit {
  tier:        string
  tool_id:     string
  daily_limit: number
  notes:       string | null
}

interface CreditCost {
  tool_id:     string
  credit_cost: number
  est_cogs_idr: number | null
}

type Tab = 'plans' | 'limits' | 'costs'

export default function PricingEditorPage() {
  const [tab, setTab] = useState<Tab>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [limits, setLimits] = useState<DailyLimit[]>([])
  const [costs, setCosts] = useState<CreditCost[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing', { credentials: 'include' })
      const data = await res.json()
      setPlans(data.plans ?? [])
      setLimits(data.daily_limits ?? [])
      setCosts(data.credit_costs ?? [])
    } catch {
      setToast({ type: 'error', msg: 'Gagal load pricing data' })
    } finally {
      setLoading(false)
    }
  }

  async function updateItem(resource: string, where: any, updates: any) {
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resource, where, updates }),
      })
      const data = await res.json()
      
      if (data.data) {
        setToast({ type: 'success', msg: 'Updated successfully' })
        await fetchData()
        setEditingItem(null)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message })
    }
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader
        title="Pricing & Limits Editor"
        description="Edit harga plan, daily limit per tier, dan credit cost per tool"
        badge={{ label: 'PHASE 2', color: D.purple }}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        }
      />
      <Link href="/admin/addons" style={{
        padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
        background: '#FBBF24', color: '#0F172A', textDecoration: 'none',
      }}>
        ⚡ Edit Add-on →
      </Link>
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: `1px solid ${D.border}`,
      }}>
        <TabButton active={tab === 'plans'} onClick={() => setTab('plans')} count={plans.length}>
          📦 Plans & Pricing
        </TabButton>
        <TabButton active={tab === 'limits'} onClick={() => setTab('limits')} count={limits.length}>
          ⏱️ Daily Limits
        </TabButton>
        <TabButton active={tab === 'costs'} onClick={() => setTab('costs')} count={costs.length}>
          💰 Credit Costs
        </TabButton>
      </div>

      {loading && (
        <Card><EmptyState icon="⏳" title="Loading..."/></Card>
      )}

      {/* PLANS TAB */}
      {!loading && tab === 'plans' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {plans.map(plan => (
            <PlanCard 
              key={plan.tier}
              plan={plan}
              onEdit={() => setEditingItem({ type: 'plan', data: plan })}
            />
          ))}
        </div>
      )}

      {/* LIMITS TAB */}
      {!loading && tab === 'limits' && (
        <LimitsTable 
          limits={limits} 
          onEdit={(item: DailyLimit) => setEditingItem({ type: 'limit', data: item })}
        />
      )}

      {/* COSTS TAB */}
      {!loading && tab === 'costs' && (
        <CostsTable 
          costs={costs} 
          onEdit={(item: CreditCost) => setEditingItem({ type: 'cost', data: item })}
        />
      )}

      {/* Edit Modal */}
      {editingItem?.type === 'plan' && (
        <EditPlanModal
          plan={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={(updates: Partial<Plan>) => updateItem('plan_config', { tier: editingItem.data.tier }, updates)}
        />
      )}
      {editingItem?.type === 'limit' && (
        <EditLimitModal
          limit={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={(updates: Partial<DailyLimit>) => updateItem(
            'daily_limit_config',
            { tier: editingItem.data.tier, tool_id: editingItem.data.tool_id },
            updates,
          )}
        />
      )}
      {editingItem?.type === 'cost' && (
        <EditCostModal
          cost={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={(updates: Partial<CreditCost>) => updateItem('tool_credit_cost', { tool_id: editingItem.data.tool_id }, updates)}
        />
      )}

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)}/>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
function TabButton({ children, active, onClick, count }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px', background: 'none',
        border: 'none', borderBottom: `2px solid ${active ? D.purple : 'transparent'}`,
        color: active ? D.text : D.textDim,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit',
        marginBottom: -1,
      }}>
      {children}
      {count !== undefined && (
        <span style={{
          marginLeft: 6, padding: '2px 6px', borderRadius: 99,
          background: active ? `${D.purple}20` : D.bg700,
          fontSize: 10, color: active ? D.purple : D.textMute,
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
function PlanCard({ plan, onEdit }: any) {
  const tierColor = ({
    starter:  D.textDim,
    basic:    D.amber,
    pro:      D.purple,
    business: D.blue,
  } as any)[plan.tier] || D.textMute

  return (
    <Card>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 12,
      }}>
        <Badge color={tierColor}>{plan.tier.toUpperCase()}</Badge>
        <Button variant="ghost" size="sm" icon={Edit3} onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: D.text, marginBottom: 4 }}>
        {plan.display_name ?? plan.tier}
      </div>
      <div style={{ fontSize: 11, color: D.textDim, marginBottom: 14, minHeight: 28, lineHeight: 1.4 }}>
        {plan.description ?? '—'}
      </div>
      <div style={{
        padding: '12px', borderRadius: 8, background: D.bg900,
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
          MONTHLY PRICE
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: tierColor }}>
          Rp {plan.price_monthly.toLocaleString('id-ID')}
        </div>
      </div>
      <div style={{
        padding: '8px 12px', borderRadius: 8, background: D.bg900,
      }}>
        <div style={{ fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>
          MONTHLY CREDIT QUOTA
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>
          {(plan.monthly_credit_quota ?? 0).toLocaleString('id-ID')} credits
        </div>
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
function LimitsTable({ limits, onEdit }: any) {
  // Group by tier
  const grouped = limits.reduce((acc: any, l: DailyLimit) => {
    if (!acc[l.tier]) acc[l.tier] = []
    acc[l.tier].push(l)
    return acc
  }, {})

  return (
    <div>
      {Object.entries(grouped).map(([tier, items]: any) => (
        <div key={tier} style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 12, fontWeight: 800, color: D.textDim,
            marginBottom: 8, letterSpacing: '0.06em',
          }}>
            TIER: {tier.toUpperCase()} ({items.length} tools)
          </h3>
          <Card padding="0">
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px',
              padding: '8px 16px', borderBottom: `1px solid ${D.border}`,
              fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em',
            }}>
              <div>TOOL</div>
              <div>DAILY LIMIT</div>
              <div>NOTES</div>
              <div></div>
            </div>
            {items.map((limit: DailyLimit, idx: number) => (
              <div key={limit.tier + limit.tool_id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px',
                padding: '10px 16px', alignItems: 'center',
                borderBottom: idx < items.length - 1 ? `1px solid ${D.border}` : 'none',
                fontSize: 12,
              }}>
                <code style={{ color: D.text, fontFamily: 'monospace' }}>
                  {limit.tool_id}
                </code>
                <div style={{ color: D.purple, fontWeight: 700 }}>
                  {limit.daily_limit}/hari
                </div>
                <div style={{ color: D.textDim, fontSize: 11 }}>
                  {limit.notes ?? '—'}
                </div>
                <Button variant="ghost" size="sm" icon={Edit3} onClick={() => onEdit(limit)}>
                  Edit
                </Button>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
function CostsTable({ costs, onEdit }: any) {
  return (
    <Card padding="0">
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
        padding: '10px 16px', borderBottom: `1px solid ${D.border}`,
        fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em',
      }}>
        <div>TOOL</div>
        <div>CREDIT COST</div>
        <div>COGS (IDR)</div>
        <div>MARGIN</div>
        <div></div>
      </div>
      {costs.map((cost: CreditCost, idx: number) => {
        // Assume 1 credit = Rp 90 (Pro plan rate)
        const revenuePerCredit = 90
        const revenue = cost.credit_cost * revenuePerCredit
        const margin = revenue > 0 && cost.est_cogs_idr 
          ? ((revenue - cost.est_cogs_idr) / revenue * 100).toFixed(1)
          : '—'
        const marginColor = parseFloat(margin) >= 40 ? D.green : parseFloat(margin) >= 20 ? D.amber : D.red

        return (
          <div key={cost.tool_id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
            padding: '10px 16px', alignItems: 'center',
            borderBottom: idx < costs.length - 1 ? `1px solid ${D.border}` : 'none',
            fontSize: 12,
          }}>
            <code style={{ color: D.text, fontFamily: 'monospace' }}>{cost.tool_id}</code>
            <div style={{ color: D.purple, fontWeight: 700 }}>
              {cost.credit_cost === 0 ? 'Unlimited' : `${cost.credit_cost} ⚡`}
            </div>
            <div style={{ color: D.textDim }}>
              {cost.est_cogs_idr ? `Rp ${cost.est_cogs_idr.toLocaleString('id-ID')}` : '—'}
            </div>
            <div style={{ color: marginColor, fontWeight: 700 }}>
              {margin === '—' ? '—' : `${margin}%`}
            </div>
            <Button variant="ghost" size="sm" icon={Edit3} onClick={() => onEdit(cost)}>
              Edit
            </Button>
          </div>
        )
      })}
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
function EditPlanModal({ plan, onClose, onSave }: any) {
  const [price, setPrice] = useState(plan.price_monthly)
  const [name, setName] = useState(plan.display_name ?? '')
  const [desc, setDesc] = useState(plan.description ?? '')
  const [quota, setQuota] = useState(plan.monthly_credit_quota)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      price_monthly: Number(price),
      display_name: name,
      description: desc,
      monthly_credit_quota: Number(quota),
    })
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Plan: ${plan.tier}`}>
      <Input label="Display Name" value={name} onChange={(e: any) => setName(e.target.value)}/>
      <Input label="Description" value={desc} onChange={(e: any) => setDesc(e.target.value)}/>
      <Input label="Monthly Price" type="number" suffix="IDR"
        value={price} onChange={(e: any) => setPrice(e.target.value)}
        hint={`Current: Rp ${plan.price_monthly.toLocaleString('id-ID')}`}/>
      <Input label="Monthly Credit Quota" type="number"
        value={quota} onChange={(e: any) => setQuota(e.target.value)}
        hint="0 = unlimited daily-bound only"/>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>
          Simpan
        </Button>
      </div>
    </Modal>
  )
}

function EditLimitModal({ limit, onClose, onSave }: any) {
  const [dailyLimit, setDailyLimit] = useState(limit.daily_limit)
  const [notes, setNotes] = useState(limit.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      daily_limit: Number(dailyLimit),
      notes,
    })
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} 
      title={`Limit: ${limit.tier} → ${limit.tool_id}`}>
      <Input label="Daily Limit" type="number" suffix="per day"
        value={dailyLimit} onChange={(e: any) => setDailyLimit(e.target.value)}
        hint={`Current: ${limit.daily_limit}/hari`}/>
      <Input label="Notes (optional)" value={notes}
        onChange={(e: any) => setNotes(e.target.value)}/>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>
          Simpan
        </Button>
      </div>
    </Modal>
  )
}

function EditCostModal({ cost, onClose, onSave }: any) {
  const [credit, setCredit] = useState(cost.credit_cost)
  const [cogs, setCogs] = useState(cost.est_cogs_idr ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      credit_cost: Number(credit),
      est_cogs_idr: Number(cogs),
    })
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} 
      title={`Credit Cost: ${cost.tool_id}`}>
      <Input label="Credit Cost (per generation)" type="number"
        value={credit} onChange={(e: any) => setCredit(e.target.value)}
        hint="0 = unlimited (daily-limit bound)"/>
      <Input label="Estimated COGS" type="number" suffix="IDR"
        value={cogs} onChange={(e: any) => setCogs(e.target.value)}
        hint="API cost per call (untuk margin calculation)"/>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>
          Simpan
        </Button>
      </div>
    </Modal>
  )
}