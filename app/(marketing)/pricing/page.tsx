'use client'
// app/(marketing)/pricing/page.tsx
// ══════════════════════════════════════════════════════════════
// Pricing Page — Strategi 3 Hybrid (Rp149K / Rp549K / Rp1.499K)
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { useState } from 'react'
import { Check, X, Sparkles, Crown, TrendingUp, Zap, ArrowRight, AlertCircle } from 'lucide-react'

const C = {
  purple:  '#7C3AED', purpleLt:'#A78BFA', purpleBg:'#F5F3FF',
  pink:    '#EC4899',
  amber:   '#F59E0B', amberBg: '#FEF3C7',
  green:   '#10B981', greenBg: '#D1FAE5',
  red:     '#EF4444',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC',
  white:'#FFFFFF',
}

// ══════════════════════════════════════════════════════════════
// PRICING DATA (Strategi 3 Final)
// ══════════════════════════════════════════════════════════════
const PLANS = [
  {
    id:           'basic',
    name:         'Basic',
    tagline:      'Toko Mini',
    description:  'Untuk seller 1-3 produk yang baru mulai',
    price:        149_000,
    color:        C.slate600,
    gradient:     `linear-gradient(135deg, ${C.slate500}, ${C.slate700})`,
    cta:          'Mulai Basic',
    ctaUrl:       '/signup?plan=basic',
    targetUser:   'Tester, hobbyist seller',
    daily_limits: {
      caption:        5,
      hook:           5,
      hashtag:        5,
      'tiktok-script': 2,
      subtitle:       2,
      'remove-bg':    10,
      packshot:       5,
      enhancer:       3,
      upscale:        2,
      relight:        2,
      'remove-object': 1,
    },
    features_unlimited: false,
    video_ai_credit:    0,
    marketing_kit:      false,
    badges: [],
    pros: [
      '5 caption + 5 hook + 5 hashtag per hari',
      '5 packshot + 3 enhancer per hari',
      '10x background removal per hari',
      'Resize multi-platform unlimited',
    ],
    cons: [
      'TIDAK ada Video AI (UGC Generator, Image-to-Video)',
      'TIDAK ada Marketing Kit',
      'Limit harian ketat (max 1-3 produk/hari)',
    ],
  },
  {
    id:           'pro',
    name:         'Pro',
    tagline:      'Toko Aktif',
    description:  'Untuk seller aktif yang post harian di Shopee/TikTok',
    price:        549_000,
    color:        C.purple,
    gradient:     `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
    cta:          'Mulai Pro',
    ctaUrl:       '/signup?plan=pro',
    targetUser:   'Seller serius dengan 5-15 produk',
    daily_limits: {
      caption:        15,
      hook:           15,
      hashtag:        15,
      'tiktok-script': 8,
      subtitle:       5,
      'remove-bg':    30,
      packshot:       15,
      enhancer:       10,
      upscale:        6,
      relight:        6,
      'remove-object': 4,
      'campaign-builder': 1,
      'audience-intel':   1,
    },
    features_unlimited: false,
    video_ai_credit:    360,    // ~12 video/bulan
    marketing_kit:      true,
    badges: ['PALING POPULER', 'BEST VALUE'],
    pros: [
      '15 caption + 15 hook + 15 hashtag per hari (3x dari Basic)',
      '15 packshot + 10 enhancer per hari',
      '12 video AI per bulan (UGC Generator + Image-to-Video)',
      'Campaign Builder + Audience Intel',
      'Multi-Platform Scheduler',
      'Priority support',
    ],
    cons: [],
  },
  {
    id:           'business',
    name:         'Business',
    tagline:      'Brand & Agency',
    description:  'Untuk brand owner, agency, atau seller dengan team',
    price:        1_499_000,
    color:        '#6366F1',
    gradient:     `linear-gradient(135deg, #6366F1, #A855F7)`,
    cta:          'Mulai Business',
    ctaUrl:       '/signup?plan=business',
    targetUser:   'Agency, brand, seller 50+ SKU',
    daily_limits: {
      caption:        40,
      hook:           40,
      hashtag:        40,
      'tiktok-script': 20,
      subtitle:       12,
      'remove-bg':    80,
      packshot:       45,
      enhancer:       30,
      upscale:        18,
      relight:        18,
      'remove-object': 12,
      'campaign-builder': 3,
      'audience-intel':   3,
      'budget-optimizer': 1,
    },
    features_unlimited: false,
    video_ai_credit:    1200,   // ~40 video/bulan
    marketing_kit:      true,
    badges: ['PREMIUM'],
    pros: [
      '40 caption + 40 hook + 40 hashtag per hari (8x dari Basic)',
      '45 packshot + 30 enhancer per hari (bulk processing)',
      '40 video AI per bulan (UGC, Image-to-Video, dll)',
      'Budget Optimizer (exclusive di Business)',
      'Team access (multi-user)',
      'Dedicated CS + priority routing',
    ],
    cons: [],
  },
]

// ══════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ══════════════════════════════════════════════════════════════
export default function PricingPage() {
  const [showFullComparison, setShowFullComparison] = useState(false)

  return (
    <div style={{
      minHeight:'100vh', background: C.white,
      fontFamily:"'DM Sans',sans-serif", color: C.slate900,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box }
      `}</style>

      {/* ───────────── Hero ───────────── */}
      <div style={{
        padding:'72px 24px 40px',
        background: `linear-gradient(180deg, ${C.purpleBg}, ${C.white})`,
        textAlign:'center',
      }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'6px 14px', borderRadius:99,
          background: C.purple, color:'#fff',
          fontSize:11, fontWeight:800, letterSpacing:'0.06em',
          marginBottom:20,
        }}>
          <Sparkles size={12}/> PRICING TRANSPARAN — SEMUA TIER MENUNJUKKAN LIMIT JELAS
        </div>

        <h1 style={{
          fontSize:42, fontWeight:900, lineHeight:1.15,
          letterSpacing:'-0.025em', marginBottom:16, color: C.slate900,
        }}>
          Pilih plan sesuai<br/>
          <span style={{
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            ukuran toko kamu
          </span>
        </h1>
        <p style={{
          fontSize:17, color: C.slate600, maxWidth:600, margin:'0 auto',
          lineHeight:1.6,
        }}>
          Daily limit transparan — tidak ada hidden cap.
          Limit reset jam 00:01 WIB setiap hari.
        </p>
      </div>

      {/* ───────────── Plan Cards ───────────── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 24px 48px' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(310px, 1fr))',
          gap:20,
        }}>
          {PLANS.map(plan => {
            const isPro = plan.id === 'pro'
            return (
              <div key={plan.id} style={{
                background: C.white, borderRadius:20,
                border: isPro ? `2px solid ${plan.color}` : `1.5px solid ${C.slate200}`,
                padding:'28px 24px', position:'relative',
                boxShadow: isPro ? '0 12px 40px rgba(124,58,237,0.18)' : '0 2px 10px rgba(0,0,0,0.03)',
                transform: isPro ? 'scale(1.03)' : 'scale(1)',
                transition:'transform 0.2s',
              }}>
                {/* Badges */}
                {plan.badges.length > 0 && (
                  <div style={{
                    position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
                    display:'flex', gap:6,
                  }}>
                    {plan.badges.map((b, i) => (
                      <div key={i} style={{
                        padding:'5px 12px', borderRadius:99,
                        background: plan.gradient, color:'#fff',
                        fontSize:10, fontWeight:800, letterSpacing:'0.08em',
                        whiteSpace:'nowrap',
                      }}>
                        {b}
                      </div>
                    ))}
                  </div>
                )}

                {/* Header */}
                <div style={{ marginBottom:24 }}>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    fontSize:13, color: plan.color, fontWeight:700, marginBottom:8,
                  }}>
                    {plan.id === 'pro' && <Crown size={14}/>}
                    {plan.id === 'business' && <TrendingUp size={14}/>}
                    {plan.name}
                  </div>
                  <h2 style={{ fontSize:26, fontWeight:900, marginBottom:6 }}>
                    {plan.tagline}
                  </h2>
                  <p style={{ fontSize:13, color: C.slate500, lineHeight:1.5 }}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                    <span style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.02em' }}>
                      Rp{(plan.price / 1000).toFixed(0)}K
                    </span>
                    <span style={{ fontSize:14, color: C.slate500 }}>/bulan</span>
                  </div>
                  <div style={{ fontSize:11, color: C.slate400, marginTop:4 }}>
                    Cocok untuk: {plan.targetUser}
                  </div>
                </div>

                {/* CTA */}
                <Link href={plan.ctaUrl} style={{
                  display:'block', width:'100%', textAlign:'center',
                  padding:'13px 20px', borderRadius:11,
                  background: isPro ? plan.gradient : C.slate900,
                  color:'#fff', fontSize:14, fontWeight:800,
                  textDecoration:'none', marginBottom:24,
                }}>
                  {plan.cta} →
                </Link>

                {/* Key features */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, fontWeight:800, color: C.slate400, letterSpacing:'0.08em', marginBottom:12 }}>
                    LIMIT HARIAN (TRANSPARAN)
                  </div>
                  <div style={{ fontSize:13, lineHeight:1.9 }}>
                    {Object.entries(plan.daily_limits).slice(0, 4).map(([tool, limit]) => (
                      <div key={tool} style={{
                        display:'flex', justifyContent:'space-between',
                        padding:'4px 0', color: C.slate700,
                      }}>
                        <span style={{ textTransform:'capitalize' }}>
                          {tool.replace(/-/g, ' ')}
                        </span>
                        <strong style={{ color: plan.color }}>{limit}/hari</strong>
                      </div>
                    ))}
                    {Object.keys(plan.daily_limits).length > 4 && (
                      <button
                        onClick={() => setShowFullComparison(true)}
                        style={{
                          background:'none', border:'none', color: plan.color,
                          fontSize:12, fontWeight:600, cursor:'pointer', padding:'6px 0',
                        }}>
                        + Lihat {Object.keys(plan.daily_limits).length - 4} tools lain
                      </button>
                    )}
                  </div>
                </div>

                {/* Video AI */}
                <div style={{
                  padding:'12px 14px', borderRadius:10,
                  background: plan.video_ai_credit > 0 ? `${plan.color}10` : C.slate100,
                  marginBottom:20,
                }}>
                  <div style={{ fontSize:11, fontWeight:800, color: C.slate500, letterSpacing:'0.06em', marginBottom:4 }}>
                    🎬 VIDEO AI
                  </div>
                  {plan.video_ai_credit > 0 ? (
                    <div style={{ fontSize:13, fontWeight:700, color: plan.color }}>
                      {Math.floor(plan.video_ai_credit / 30)} video/bulan
                      <span style={{ fontSize:11, fontWeight:400, color: C.slate500, marginLeft:6 }}>
                        ({plan.video_ai_credit} credit)
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize:13, color: C.slate500, fontStyle:'italic' }}>
                      Tidak include — upgrade ke Pro
                    </div>
                  )}
                </div>

                {/* Pros / Cons */}
                {plan.pros.length > 0 && (
                  <div style={{ marginBottom:plan.cons.length ? 16 : 0 }}>
                    {plan.pros.map((pro, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:8,
                        padding:'5px 0', fontSize:12, color: C.slate700, lineHeight:1.5,
                      }}>
                        <Check size={14} color={C.green} style={{ flexShrink:0, marginTop:2 }}/>
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                )}

                {plan.cons.length > 0 && (
                  <div>
                    {plan.cons.map((con, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:8,
                        padding:'5px 0', fontSize:12, color: C.slate400, lineHeight:1.5,
                      }}>
                        <X size={14} color={C.red} style={{ flexShrink:0, marginTop:2 }}/>
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Comparison toggle */}
        <div style={{ textAlign:'center', marginTop:32 }}>
          <button
            onClick={() => setShowFullComparison(!showFullComparison)}
            style={{
              padding:'12px 24px', borderRadius:10,
              background: C.purpleBg, color: C.purple,
              border:`1.5px solid ${C.purple}30`,
              fontSize:13, fontWeight:700, cursor:'pointer',
              fontFamily:'inherit',
            }}>
            {showFullComparison ? 'Sembunyikan' : 'Lihat'} perbandingan lengkap semua tools
          </button>
        </div>
      </div>

      {/* ───────────── Full Comparison Table ───────────── */}
      {showFullComparison && (
        <div style={{
          maxWidth:1100, margin:'0 auto', padding:'24px',
          background: C.slate50, borderRadius:20,
        }}>
          <h3 style={{ fontSize:22, fontWeight:800, marginBottom:20, textAlign:'center' }}>
            Perbandingan limit harian (per tool)
          </h3>

          <div style={{ overflowX:'auto' }}>
            <table style={{
              width:'100%', borderCollapse:'collapse',
              background: C.white, borderRadius:12, overflow:'hidden',
            }}>
              <thead>
                <tr style={{ background: C.slate100 }}>
                  <th style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color: C.slate600 }}>
                    Tool
                  </th>
                  {PLANS.map(plan => (
                    <th key={plan.id} style={{
                      padding:'12px 16px', textAlign:'center', fontSize:12, fontWeight:700,
                      color: plan.color,
                    }}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_TOOLS.map(tool => (
                  <tr key={tool.id} style={{ borderTop:`1px solid ${C.slate100}` }}>
                    <td style={{ padding:'10px 16px', fontSize:13, color: C.slate700 }}>
                      {tool.label}
                    </td>
                    {PLANS.map(plan => {
                      const limit = (plan.daily_limits as any)[tool.id]
                      return (
                        <td key={plan.id} style={{
                          padding:'10px 16px', textAlign:'center', fontSize:13,
                        }}>
                          {limit !== undefined ? (
                            <strong style={{ color: plan.color }}>{limit}/hari</strong>
                          ) : (
                            <span style={{ color: C.slate300 }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{
            fontSize:11, color: C.slate500, textAlign:'center', marginTop:16, lineHeight:1.6,
          }}>
            Limit harian reset otomatis jam 00:01 WIB setiap hari.<br/>
            Video AI (UGC Generator, Image-to-Video) pakai credit bulanan — bukan limit harian.
          </p>
        </div>
      )}

      {/* ───────────── FAQ ───────────── */}
      <div style={{ maxWidth:760, margin:'72px auto', padding:'0 24px' }}>
        <h2 style={{ fontSize:28, fontWeight:800, textAlign:'center', marginBottom:32 }}>
          Pertanyaan yang sering ditanya
        </h2>

        {FAQ.map((item, i) => (
          <details key={i} style={{
            marginBottom:12, padding:'16px 20px', borderRadius:12,
            background: C.slate50, border:`1px solid ${C.slate100}`,
          }}>
            <summary style={{
              cursor:'pointer', fontSize:14, fontWeight:700, color: C.slate900,
              listStyle:'none',
            }}>
              {item.q}
            </summary>
            <div style={{ fontSize:13, color: C.slate600, marginTop:12, lineHeight:1.7 }}>
              {item.a}
            </div>
          </details>
        ))}
      </div>

      {/* Footer guarantee */}
      <div style={{
        background: C.slate50, padding:'48px 24px', textAlign:'center',
        borderTop:`1px solid ${C.slate100}`,
      }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <div style={{ fontSize:11, color: C.purple, fontWeight:800, letterSpacing:'0.08em', marginBottom:12 }}>
            🛡️ TRANSPARENT PRICING GUARANTEE
          </div>
          <p style={{ fontSize:14, color: C.slate600, lineHeight:1.7 }}>
            Tidak ada hidden cap. Tidak ada throttle diam-diam. Limit harian jelas di pricing page,
            dan kamu bisa monitor pemakaian real-time di dashboard.
            Refund otomatis kalau gagal generate.
          </p>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const ALL_TOOLS = [
  { id: 'caption',           label: 'Caption Generator' },
  { id: 'hook',              label: 'Hook Generator' },
  { id: 'hashtag',           label: 'Hashtag AI' },
  { id: 'tiktok-script',     label: 'TikTok Script' },
  { id: 'subtitle',          label: 'AI Subtitle' },
  { id: 'remove-bg',         label: 'Remove Background' },
  { id: 'packshot',          label: 'AI Packshot' },
  { id: 'enhancer',          label: 'Product Enhancer' },
  { id: 'upscale',           label: 'AI Upscale 4x' },
  { id: 'relight',           label: 'AI Relight' },
  { id: 'remove-object',     label: 'Remove Object' },
  { id: 'campaign-builder',  label: 'Campaign Builder' },
  { id: 'audience-intel',    label: 'Audience Intel' },
  { id: 'budget-optimizer',  label: 'Budget Optimizer' },
]

const FAQ = [
  {
    q: 'Kenapa ada limit harian? Bukannya unlimited di kompetitor?',
    a: 'Kompetitor lifetime pakai Google Gemini/Grok free tier yang bisa dimatikan vendor kapan saja. BeeSell pakai infrastructure sendiri (Replicate, Anthropic, fal.ai) yang berbayar, jadi kami transparan menampilkan limit harian. Tidak ada hidden cap.',
  },
  {
    q: 'Limit harian reset jam berapa?',
    a: 'Reset otomatis jam 00:01 WIB (Waktu Indonesia Barat) setiap hari. Kalau kamu hit limit di Basic, tinggal tunggu sampai besok pagi atau upgrade ke Pro.',
  },
  {
    q: 'Bisa upgrade kapan saja?',
    a: 'Bisa. Upgrade dari Basic ke Pro atau Pro ke Business kapan saja. Sisa hari di plan lama akan dipro-rata ke plan baru.',
  },
  {
    q: 'Kalau aku cuma butuh 1-2 hari heavy use per bulan?',
    a: 'Pakai Pro saja. Kamu dapat 15 caption/hari × 30 hari = 450 caption/bulan yang fleksibel. Plus 12 video AI dan marketing kit yang tidak ada di Basic.',
  },
  {
    q: 'Refund kalau gagal generate?',
    a: 'Otomatis. Kalau API kami error atau output tidak sesuai (misal foto blur), credit kamu di-refund otomatis dalam 1-2 menit. Tidak perlu komplain manual.',
  },
  {
    q: 'Pricing bisa naik tiba-tiba?',
    a: 'Tidak. Setiap perubahan pricing akan kami umumkan 30 hari sebelumnya via email. User existing dapat lock-in harga lama selama 6 bulan transition.',
  },
]