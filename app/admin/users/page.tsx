'use client'
// app/admin/users/page.tsx
// ══════════════════════════════════════════════════════════════
// User Management — list, search, action (suspend, credit, tier)
// ══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, Plus, Minus, Ban, Check, Crown, MoreVertical } from 'lucide-react'
import {
  PageHeader, Card, Button, Input, Select, Badge, Toast, EmptyState,
  Modal, ConfirmDialog, D,
} from '@/components/admin/shared/ui'

interface UserRow {
  user_id:        string
  email:          string
  full_name:      string
  plan_tier:      string
  status:         string
  current_balance: number
  monthly_quota:  number
  created_at:     string
  last_seen_at:   string | null
  total_used_this_month: number
}
type UserAction = 'credit' | 'tier' | 'suspend'

interface UserRowProps {
  user: UserRow
  isLast: boolean
  onAction: (type: UserAction) => void
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [toast, setToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null)
  
  // Modal states
  const [actionUser, setActionUser] = useState<UserRow | null>(null)
  const [actionType, setActionType] = useState<UserAction | null>(null)

  const LIMIT = 50

  const fetchUsers = useCallback(async (newOffset: number = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(newOffset),
      })
      if (search) params.set('search', search)
      if (filterTier) params.set('tier', filterTier)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      const data = await res.json()
      
      setUsers(data.users ?? [])
      setTotal(data.pagination?.total ?? 0)
      setOffset(newOffset)
    } catch {
      setToast({ type: 'error', msg: 'Gagal load users' })
    } finally {
      setLoading(false)
    }
  }, [search, filterTier, filterStatus])

  useEffect(() => { fetchUsers(0) }, [fetchUsers])

  async function performAction(userId: string, action: string, params: any) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...params }),
      })
      const data = await res.json()
      
      if (data.success) {
        setToast({ type: 'success', msg: `Action ${action} berhasil` })
        await fetchUsers(offset)
      } else {
        throw new Error(data.error || 'Action failed')
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message })
    } finally {
      setActionUser(null)
      setActionType(null)
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="User Management"
        description={`${total.toLocaleString('id-ID')} users terdaftar · Search, suspend, adjust credit, change tier`}
        badge={{ label: 'PHASE 2', color: D.purple }}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchUsers(0)}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: 12, alignItems: 'end',
        }}>
          <div>
            <Input 
              label="Search Email / Nama" 
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="andiraja@..."
            />
          </div>
          <div>
            <Select 
              label="Tier"
              value={filterTier}
              onChange={(e: any) => setFilterTier(e.target.value)}
              options={[
                { value: '', label: 'All tiers' },
                { value: 'starter', label: 'Starter' },
                { value: 'basic', label: 'Basic' },
                { value: 'pro', label: 'Pro' },
                { value: 'business', label: 'Business' },
              ]}
            />
          </div>
          <div>
            <Select 
              label="Status"
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'banned', label: 'Banned' },
              ]}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Button variant="primary" icon={Search} onClick={() => fetchUsers(0)}>
              Cari
            </Button>
          </div>
        </div>
      </Card>

      {/* Users table */}
      <div style={{ marginTop: 16 }}>
        {loading && (
          <Card><EmptyState icon="⏳" title="Loading users..."/></Card>
        )}

        {!loading && users.length === 0 && (
          <Card>
            <EmptyState 
              icon="📭" 
              title="Tidak ada user ditemukan"
              description="Coba ubah filter pencarian"
            />
          </Card>
        )}

        {!loading && users.length > 0 && (
          <Card padding="0">
            {/* Header row */}
            <div style={{
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
              padding: '10px 16px', borderBottom: `1px solid ${D.border}`,
              fontSize: 10, color: D.textMute, fontWeight: 700, letterSpacing: '0.06em',
            }}>
              <div>USER</div>
              <div>TIER</div>
              <div>STATUS</div>
              <div>BALANCE</div>
              <div>JOINED</div>
              <div></div>
            </div>

            {users.map((u, idx) => (
              <UserRow 
                key={u.user_id}
                user={u}
                isLast={idx === users.length - 1}
                onAction={(type) => {
                  setActionUser(u)
                  setActionType(type)
                }}
              />
            ))}
          </Card>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, fontSize: 12, color: D.textDim,
          }}>
            <div>
              Showing {offset + 1}-{offset + users.length} of {total.toLocaleString('id-ID')}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button 
                variant="secondary" size="sm" 
                disabled={offset === 0}
                onClick={() => fetchUsers(Math.max(0, offset - LIMIT))}>
                ← Prev
              </Button>
              <Button 
                variant="secondary" size="sm"
                disabled={offset + LIMIT >= total}
                onClick={() => fetchUsers(offset + LIMIT)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action modals */}
      {actionUser && actionType === 'credit' && (
        <AdjustCreditModal 
          user={actionUser}
          onClose={() => { setActionUser(null); setActionType(null) }}
          onConfirm={(amount: number, reason: string) =>
            performAction(
              actionUser.user_id,
              'adjust_credit',
              { amount, reason }
            )
          }
        />
      )}
      {actionUser && actionType === 'tier' && (
        <ChangeTierModal 
          user={actionUser}
          onClose={() => { setActionUser(null); setActionType(null) }}
          onConfirm={(new_tier: string, reason: string) => performAction(actionUser.user_id, 'change_tier', { new_tier, reason })}
        />
      )}
      {actionUser && actionType === 'suspend' && (
        <SuspendModal 
          user={actionUser}
          onClose={() => { setActionUser(null); setActionType(null) }}
          onConfirm={(status: string, reason: string) => performAction(actionUser.user_id, 'suspend', { status, reason })}
        />
      )}

      {toast && (
        <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)}/>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
  function UserRow({
    user,
    isLast,
    onAction,
  }: UserRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const tierColor = ({
    starter: D.textDim, basic: D.amber, pro: D.purple, business: D.blue,
  } as any)[user.plan_tier] || D.textMute
  
  const statusColor = ({
    active: D.green, suspended: D.amber, banned: D.red,
  } as any)[user.status] || D.textMute

  return (
    <div style={{
      display: 'grid', 
      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
      padding: '12px 16px', alignItems: 'center',
      borderBottom: isLast ? 'none' : `1px solid ${D.border}`,
      fontSize: 12,
      position: 'relative',
    }}>
      {/* User info */}
      <div>
        <div style={{ color: D.text, fontWeight: 600, marginBottom: 2 }}>
          {user.email}
        </div>
        {user.full_name && (
          <div style={{ color: D.textMute, fontSize: 11 }}>
            {user.full_name}
          </div>
        )}
      </div>

      {/* Tier */}
      <div>
        <Badge color={tierColor}>{user.plan_tier.toUpperCase()}</Badge>
      </div>

      {/* Status */}
      <div>
        <Badge color={statusColor}>{user.status.toUpperCase()}</Badge>
      </div>

      {/* Balance */}
      <div style={{ color: D.text, fontWeight: 600 }}>
        {user.current_balance.toLocaleString('id-ID')}
        <span style={{ color: D.textMute, fontWeight: 500, marginLeft: 4 }}>
          /{user.monthly_quota || '∞'}
        </span>
      </div>

      {/* Joined */}
      <div style={{ color: D.textDim }}>
        {formatDate(user.created_at)}
      </div>

      {/* Actions */}
      <div style={{ position: 'relative', textAlign: 'right' }}>
        <Button 
          variant="ghost" size="sm" icon={MoreVertical}
          onClick={() => setMenuOpen(!menuOpen)}>
        </Button>
        {menuOpen && (
          <>
            <div 
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50 }}/>
            <div style={{
              position: 'absolute', top: '100%', right: 0,
              marginTop: 4, zIndex: 60,
              background: D.bg700, borderRadius: 8,
              border: `1px solid ${D.borderLight}`,
              padding: 4, minWidth: 180,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <MenuItem icon={Plus} onClick={() => { setMenuOpen(false); onAction('credit') }}>
                Adjust Credit
              </MenuItem>
              <MenuItem icon={Crown} onClick={() => { setMenuOpen(false); onAction('tier') }}>
                Change Tier
              </MenuItem>
              {user.status === 'active' ? (
                <MenuItem icon={Ban} danger onClick={() => { setMenuOpen(false); onAction('suspend') }}>
                  Suspend / Ban
                </MenuItem>
              ) : (
                <MenuItem icon={Check} onClick={() => { setMenuOpen(false); onAction('suspend') }}>
                  Activate
                </MenuItem>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MenuItem({ icon: Icon, children, onClick, danger }: any) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '8px 12px',
      background: 'none', border: 'none', cursor: 'pointer',
      color: danger ? D.red : D.text,
      fontSize: 12, fontWeight: 600,
      fontFamily: 'inherit', borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 8,
      textAlign: 'left',
    }}>
      <Icon size={13}/> {children}
    </button>
  )
}

// ══════════════════════════════════════════════════════════════
function AdjustCreditModal({ user, onClose, onConfirm }: any) {
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!reason || reason.length < 3) {
      alert('Reason wajib min 3 karakter')
      return
    }
    setSaving(true)
    await onConfirm(Number(amount), reason)
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Adjust Credit: ${user.email}`}>
      <div style={{ 
        padding: '10px 14px', background: D.bg900, borderRadius: 8,
        marginBottom: 14, fontSize: 12, color: D.textDim,
      }}>
        Current balance: <strong style={{ color: D.text }}>{user.current_balance}</strong> credits
      </div>
      
      <Input 
        label="Amount (+ untuk grant, - untuk deduct)"
        type="number"
        value={amount}
        onChange={(e: any) => setAmount(e.target.value)}
        suffix="credits"
        hint={`New balance akan jadi: ${user.current_balance + Number(amount)}`}
      />
      <Input 
        label="Reason"
        value={reason}
        onChange={(e: any) => setReason(e.target.value)}
        placeholder="Compensation for service downtime, promo, etc"
        required
      />
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Save Adjustment
        </Button>
      </div>
    </Modal>
  )
}

function ChangeTierModal({ user, onClose, onConfirm }: any) {
  const [newTier, setNewTier] = useState(user.plan_tier)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onConfirm(newTier, reason)
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Change Tier: ${user.email}`}>
      <div style={{ 
        padding: '10px 14px', background: D.bg900, borderRadius: 8,
        marginBottom: 14, fontSize: 12, color: D.textDim,
      }}>
        Current tier: <strong style={{ color: D.text }}>{user.plan_tier.toUpperCase()}</strong>
      </div>
      
      <Select 
        label="New Tier"
        value={newTier}
        onChange={(e: any) => setNewTier(e.target.value)}
        options={[
          { value: 'starter',  label: 'Starter (Free Trial)' },
          { value: 'basic',    label: 'Basic — Rp 149K (Toko Mini)' },
          { value: 'pro',      label: 'Pro — Rp 549K (Toko Aktif)' },
          { value: 'business', label: 'Business — Rp 1.499K (Brand & Agency)' },
        ]}
      />
      <Input 
        label="Reason (optional)"
        value={reason}
        onChange={(e: any) => setReason(e.target.value)}
        placeholder="Manual upgrade after payment, compensation, etc"
      />
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Change Tier
        </Button>
      </div>
    </Modal>
  )
}

function SuspendModal({ user, onClose, onConfirm }: any) {
  const isActive = user.status === 'active'
  const [status, setStatus] = useState(isActive ? 'suspended' : 'active')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (status !== 'active' && (!reason || reason.length < 3)) {
      alert('Reason wajib min 3 karakter')
      return
    }
    setSaving(true)
    await onConfirm(status, reason)
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} 
      title={isActive ? `Suspend User: ${user.email}` : `Activate User: ${user.email}`}>
      <div style={{ 
        padding: '10px 14px', background: D.bg900, borderRadius: 8,
        marginBottom: 14, fontSize: 12, color: D.textDim,
      }}>
        Current status: <strong style={{ color: D.text }}>{user.status.toUpperCase()}</strong>
      </div>
      
      {isActive ? (
        <Select 
          label="New Status"
          value={status}
          onChange={(e: any) => setStatus(e.target.value)}
          options={[
            { value: 'suspended', label: 'Suspended (temporary)' },
            { value: 'banned',    label: 'Banned (permanent)' },
          ]}
        />
      ) : (
        <div style={{ padding: '10px 14px', background: `${D.green}10`, borderRadius: 8, marginBottom: 14, fontSize: 12, color: D.green }}>
          ✓ User akan di-activate kembali
        </div>
      )}
      
      {(status !== 'active') && (
        <Input 
          label="Reason"
          value={reason}
          onChange={(e: any) => setReason(e.target.value)}
          placeholder="Abuse, spam, fraud, etc"
          required
        />
      )}
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Batal</Button>
        <Button 
          variant="primary" 
          danger={status !== 'active'}
          loading={saving} 
          onClick={handleSave}>
          {status === 'active' ? 'Activate' : status === 'banned' ? 'Ban User' : 'Suspend User'}
        </Button>
      </div>
    </Modal>
  )
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { 
    day: '2-digit', month: 'short', year: 'numeric',
  })
}