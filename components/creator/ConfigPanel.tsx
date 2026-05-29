'use client'
// apps/web-app/components/creator/ConfigPanel.tsx
// v4: Platform options HANYA Instagram (Feed/Reels) & TikTok
//     + Content Goal section di atas
import { useContentCreatorStore } from '@/store/contentCreatorStore'
import type { Tone, Language, Emoji, CtaStyle, Platform } from '@/store/contentCreatorStore'
import { BookOpen, Megaphone, Camera, Video, Music } from 'lucide-react'
import { FaInstagram, FaTiktok } from 'react-icons/fa'

const CONTENT_GOAL_OPTIONS: Array<{
  value: 'soft_selling' | 'hard_selling'
  label: string
  icon:  React.ReactNode
  desc:  string
  example: string
}> = [
  {
    value: 'soft_selling',
    label: 'Soft Selling',
    icon:  <BookOpen size={16} />,
    desc:  'Edukasi & awareness',
    example: '"Pernah ga sih kamu..."',
  },
  {
    value: 'hard_selling',
    label: 'Hard Selling',
    icon:  <Megaphone size={16} />,
    desc:  'Promosi & conversion',
    example: '"FLASH SALE! Stok cuma 50..."',
  },
]

// ── PLATFORM: 3 options only ──
const PLATFORM_OPTIONS: Array<{
  value: Platform
  label: string
  icon:  React.ReactNode
  desc:  string
}> = [
  {
    value: 'instagram',
    label: 'Instagram Feed',
    icon:  <FaInstagram size={16} />,
    desc:  'Caption panjang, 10-20 hashtag',
  },
  {
    value: 'instagram_reels' as Platform,
    label: 'Instagram Reels',
    icon:  <FaInstagram size={16} />,
    desc:  'Pendek, hook 2 detik, 5-8 hashtag',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    icon:  <FaTiktok size={16} />,
    desc:  'Hyper-short, Gen Z, 3-5 hashtag',
  },
]

const TONE_OPTIONS: Array<{ value: Tone; label: string; emoji: string }> = [
  { value: 'casual',        label: 'Santai',        emoji: '😎' },
  { value: 'friendly',      label: 'Ramah',         emoji: '😊' },
  { value: 'professional',  label: 'Profesional',   emoji: '👔' },
  { value: 'energetic',     label: 'Hype',          emoji: '🔥' },
  { value: 'luxury',        label: 'Mewah',         emoji: '💎' },
  { value: 'playful',       label: 'Lucu',          emoji: '🎉' },
  { value: 'authoritative', label: 'Autoritas',     emoji: '📊' },
]

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string; desc: string }> = [
  { value: 'indonesian_casual', label: 'ID Gaul',         desc: 'kamu, aku, bestie' },
  { value: 'indonesian_formal', label: 'ID Formal',       desc: 'Anda, kami' },
  { value: 'mixed_english',     label: 'ID-EN Campur',    desc: 'Gen Z style' },
  { value: 'full_english',      label: 'English',         desc: 'Full Inggris' },
]

const EMOJI_OPTIONS: Array<{ value: Emoji; label: string; preview: string }> = [
  { value: 'heavy',    label: 'Banyak',  preview: '🔥✨💯😍🚀' },
  { value: 'moderate', label: 'Sedang',  preview: '✨ 💯' },
  { value: 'minimal',  label: 'Sedikit', preview: '✨' },
  { value: 'none',     label: 'Tidak',   preview: '—' },
]

const CTA_OPTIONS: Array<{ value: CtaStyle; label: string; desc: string }> = [
  { value: 'soft',       label: 'Lembut',  desc: '"Boleh DM ya"' },
  { value: 'medium',     label: 'Jelas',   desc: '"Order sekarang"' },
  { value: 'aggressive', label: 'Urgent',  desc: '"STOK TERBATAS!"' },
]

export function ConfigPanel() {
  const tone        = useContentCreatorStore(s => s.tone)
  const language    = useContentCreatorStore(s => s.language)
  const emoji       = useContentCreatorStore(s => s.emoji)
  const ctaStyle    = useContentCreatorStore(s => s.ctaStyle)
  const platform    = useContentCreatorStore(s => s.platform)
  const variants    = useContentCreatorStore(s => s.variants)
  const contentGoal = useContentCreatorStore((s: any) => s.contentGoal)

  const setTone        = useContentCreatorStore(s => s.setTone)
  const setLanguage    = useContentCreatorStore(s => s.setLanguage)
  const setEmoji       = useContentCreatorStore(s => s.setEmoji)
  const setCtaStyle    = useContentCreatorStore(s => s.setCtaStyle)
  const setPlatform    = useContentCreatorStore(s => s.setPlatform)
  const setVariants    = useContentCreatorStore(s => s.setVariants)
  const setContentGoal = useContentCreatorStore((s: any) => s.setContentGoal)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Content Goal ─────────────────── */}
      <Section
        title="Tujuan Konten"
        subtitle="Mau edukasi audiens atau langsung jualan?"
        highlight
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {CONTENT_GOAL_OPTIONS.map(opt => {
            const active = contentGoal === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentGoal(opt.value)}
                style={{
                  padding: '12px 14px',
                  background: active
                    ? (opt.value === 'soft_selling'
                        ? 'linear-gradient(135deg, #EFF6FF, #F0F9FF)'
                        : 'linear-gradient(135deg, #FEF3C7, #FFEDD5)')
                    : '#fff',
                  border: `1.5px solid ${
                    active
                      ? (opt.value === 'soft_selling' ? '#2563EB' : '#F59E0B')
                      : '#E2E8F0'
                  }`,
                  borderRadius: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .15s',
                  boxShadow: active
                    ? `0 0 0 3px ${opt.value === 'soft_selling' ? 'rgba(37,99,235,.1)' : 'rgba(245,158,11,.12)'}`
                    : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <span style={{
                    color: active
                      ? (opt.value === 'soft_selling' ? '#2563EB' : '#D97706')
                      : '#94A3B8',
                  }}>
                    {opt.icon}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: active
                      ? (opt.value === 'soft_selling' ? '#1E3A8A' : '#92400E')
                      : '#0F172A',
                  }}>
                    {opt.label}
                  </span>
                  {active && (
                    <span style={{ marginLeft: 'auto', fontSize: '14px' }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: active
                    ? (opt.value === 'soft_selling' ? '#1E40AF' : '#9A3412')
                    : '#64748B',
                  fontWeight: 500,
                }}>
                  {opt.desc}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: '#94A3B8',
                  fontStyle: 'italic',
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {opt.example}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{
          marginTop: '10px',
          padding: '8px 10px',
          background: '#F8FAFC',
          borderRadius: '8px',
          fontSize: '10px',
          color: '#64748B',
          lineHeight: 1.5,
        }}>
          💡 <strong>Tip:</strong> Mix dua-duanya di feed kamu. Soft selling buat build audience, hard selling buat convert.
        </div>
      </Section>

      {/* ── Platform (3 cards Instagram/Reels/TikTok) ─────── */}
      <Section title="Platform" subtitle="Optimasi untuk format & audiens spesifik">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          {PLATFORM_OPTIONS.map(opt => {
            const active = platform === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlatform(opt.value)}
                style={{
                  padding: '11px 14px',
                  background: active ? '#EFF6FF' : '#fff',
                  border: `1.5px solid ${active ? '#2563EB' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all .15s',
                  boxShadow: active ? '0 0 0 3px rgba(37,99,235,.08)' : 'none',
                }}
              >
                <span style={{ color: active ? '#2563EB' : '#94A3B8', flexShrink: 0 }}>
                  {opt.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: active ? 700 : 600,
                    color: active ? '#1E3A8A' : '#0F172A',
                    marginBottom: '1px',
                  }}>
                    {opt.label}
                  </p>
                  <p style={{
                    fontSize: '10px',
                    color: active ? '#1E40AF' : '#64748B',
                  }}>
                    {opt.desc}
                  </p>
                </div>
                {active && (
                  <span style={{ fontSize: '14px', color: '#2563EB' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Tone ──────────────────────────────────── */}
      <Section title="Tone bicara" subtitle="Pilih nada yang cocok dengan brand">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {TONE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={tone === opt.value}
              onClick={() => setTone(opt.value)}
            >
              <span style={{ fontSize: '14px' }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </ChipButton>
          ))}
        </div>
      </Section>

      {/* ── Language ──────────────────────────────────────── */}
      <Section title="Bahasa">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {LANGUAGE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={language === opt.value}
              onClick={() => setLanguage(opt.value)}
              vertical
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: '10px', opacity: .7 }}>{opt.desc}</span>
            </ChipButton>
          ))}
        </div>
      </Section>

      {/* ── Emoji ─────────────────────────────────── */}
      <Section title="Emoji">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {EMOJI_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={emoji === opt.value}
              onClick={() => setEmoji(opt.value)}
              vertical
            >
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: '11px', opacity: .7 }}>{opt.preview}</span>
            </ChipButton>
          ))}
        </div>
      </Section>

      {/* ── CTA style ─────────────────────────────────────── */}
      <Section title="Gaya CTA">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          {CTA_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={ctaStyle === opt.value}
              onClick={() => setCtaStyle(opt.value)}
            >
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{opt.label}</span>
              <span style={{ fontSize: '11px', opacity: .7, marginLeft: 'auto' }}>{opt.desc}</span>
            </ChipButton>
          ))}
        </div>
      </Section>

      {/* ── Variants ───────────────────────────────── */}
      <Section title="Jumlah variasi" subtitle={`${variants} variasi caption`}>
        <div style={{ padding: '0 4px' }}>
          <input
            type="range"
            min={1}
            max={5}
            value={variants}
            onChange={e => setVariants(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '10px', color: '#94A3B8', marginTop: '4px',
            fontFamily: "'DM Mono', monospace",
          }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} style={{
                color: variants === n ? '#2563EB' : '#94A3B8',
                fontWeight: variants === n ? 700 : 500,
              }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── Reusable Section ────────────────────────────────────
function Section({ title, subtitle, highlight, children }: {
  title:    string
  subtitle?: string
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      ...(highlight && {
        padding: '14px',
        background: 'linear-gradient(135deg, #FAFBFF, #FFF7ED)',
        borderRadius: '12px',
        border: '1px solid #F1F5F9',
        margin: '-4px',
      }),
    }}>
      <div style={{ marginBottom: '8px' }}>
        <h3 style={{
          fontSize: '12px', fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Reusable ChipButton ─────────────────────────────────
function ChipButton({ active, onClick, children, vertical }: {
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
  vertical?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: vertical ? '8px 10px' : '8px 12px',
        background: active ? '#EFF6FF' : '#fff',
        border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
        color: active ? '#2563EB' : '#475569',
        borderRadius: '9px',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: vertical ? 'flex-start' : 'center',
        gap: vertical ? '2px' : '6px',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all .15s',
        boxShadow: active ? '0 0 0 3px rgba(37,99,235,.08)' : 'none',
      }}
    >
      {children}
    </button>
  )
}