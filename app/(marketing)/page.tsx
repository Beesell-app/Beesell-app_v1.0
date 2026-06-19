'use client'
// app/(marketing)/page.tsx
// ══════════════════════════════════════════════════════════════
// Landing Page — Strategi 3 Hybrid Positioning
// ══════════════════════════════════════════════════════════════

import Link from 'next/link'
import { useState } from 'react'
import {
  Sparkles, ArrowRight, Check, X, Zap, Shield,
  TrendingUp, Crown, Users, Clock,
} from 'lucide-react'
import {
  getMenuByCategory, getStudioBySub, getEnabledToolCount, CATEGORY_INFO,
} from '@/components/dashboard/studio-menu-config'

const C = {
  purple:'#7C3AED', purpleBg:'#F5F3FF', purpleLt:'#A78BFA',
  pink:'#EC4899', amber:'#F59E0B', amberBg:'#FEF3C7',
  green:'#10B981', greenBg:'#D1FAE5',
  red:'#EF4444', redBg:'#FEE2E2',
  slate900:'#0F172A', slate700:'#334155', slate600:'#475569',
  slate500:'#64748B', slate400:'#94A3B8', slate300:'#CBD5E1',
  slate200:'#E2E8F0', slate100:'#F1F5F9', slate50:'#F8FAFC',
  white:'#FFFFFF',
}

export default function LandingPage() {
const toolCount = getEnabledToolCount()
const byCat  = getMenuByCategory()   // quick/writing/marketing/studio
const studio = getStudioBySub()      // image/video

const SECTIONS = [
  { key:'writing',   info: CATEGORY_INFO.writing,   items: byCat.writing },
  { key:'quick',     info: CATEGORY_INFO.quick,     items: byCat.quick },
  { key:'image',     info: { ...CATEGORY_INFO.studio, label:'Image AI', emoji:'🖼️', description:'Foto produk & konten visual AI' }, items: studio.image },
  { key:'video',     info: { ...CATEGORY_INFO.studio, label:'Video AI', emoji:'🎬', description:'Video UGC & animasi AI' },        items: studio.video },
  { key:'marketing', info: CATEGORY_INFO.marketing, items: byCat.marketing },
]


  return (
    <div style={{
      minHeight:'100vh', background: C.white,
      fontFamily:"'DM Sans',sans-serif", color: C.slate900,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box }
      `}</style>

      {/* ═══════════════════ NAV ═══════════════════ */}
      <Nav/>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{
        padding:'80px 24px 60px',
        background: `radial-gradient(circle at top right, ${C.purpleBg}, ${C.white} 60%)`,
      }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'6px 14px', borderRadius:99,
            background: C.purple, color:'#fff',
            fontSize:11, fontWeight:800, letterSpacing:'0.06em',
            marginBottom:24,
          }}>
            <Sparkles size={12}/> AI SALES CONTENT ENGINE • INDONESIA
          </div>

          <h1 style={{
            fontSize:'clamp(36px, 6vw, 60px)', fontWeight:900,
            lineHeight:1.1, letterSpacing:'-0.025em',
            color: C.slate900, marginBottom:20,
          }}>
            Konten jualan profesional<br/>
            <span style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              setiap hari, tanpa ribet
            </span>
          </h1>

          <p style={{
            fontSize:18, color: C.slate600, lineHeight:1.6,
            maxWidth:680, margin:'0 auto 32px',
          }}>
            Caption, foto produk, video TikTok — siap upload dalam &lt;3 menit.
            <br/>
            Khusus seller Shopee, Tokopedia, TikTok Shop & affiliators.
          </p>

          {/* CTA */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
            <Link href="/signup" style={{
              padding:'14px 28px', borderRadius:12,
              background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
              color:'#fff', fontSize:14, fontWeight:800,
              textDecoration:'none',
              display:'inline-flex', alignItems:'center', gap:8,
              boxShadow:'0 4px 20px rgba(124,58,237,0.3)',
            }}>
              Mulai gratis (5 trial credit) <ArrowRight size={14}/>
            </Link>
            <Link href="#pricing" style={{
              padding:'14px 28px', borderRadius:12,
              background: C.white, color: C.slate900,
              border:`1.5px solid ${C.slate200}`,
              fontSize:14, fontWeight:700, textDecoration:'none',
            }}>
              Lihat pricing
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:24,
            padding:'12px 24px', borderRadius:99,
            background: C.white, border:`1px solid ${C.slate200}`,
            fontSize:12, color: C.slate600,
            flexWrap:'wrap', justifyContent:'center',
          }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <Shield size={14} color={C.green}/> Infrastructure sendiri
            </span>
            <span style={{ width:1, height:14, background: C.slate200 }}/>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <Clock size={14} color={C.amber}/> Output &lt;3 menit
            </span>
            <span style={{ width:1, height:14, background: C.slate200 }}/>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
              <Zap size={14} color={C.purple}/> {toolCount}+ AI tools
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════ POSITIONING ═══════════════════ */}
      <section style={{ padding:'64px 24px', background: C.slate50 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <h2 style={{
              fontSize:32, fontWeight:900, color: C.slate900, marginBottom:12,
              letterSpacing:'-0.02em',
            }}>
              Pilih plan sesuai ukuran toko kamu
            </h2>
            <p style={{ fontSize:15, color: C.slate600 }}>
              Tidak ada hidden cap. Daily limit transparan di pricing page.
            </p>
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
            gap:20, maxWidth:920, margin:'0 auto',
          }}>
            <PositioningCard
              icon={<Zap size={20}/>}
              tier="Basic"
              tagline="Toko Mini"
              price="Rp149K/bln"
              description="Untuk seller 1-3 produk yang baru mulai"
              audience="Tester, hobbyist seller"
              color={C.amber}
              gradient={`linear-gradient(135deg, ${C.amber}, #F97316)`}
              highlights={[
                '5 caption + 5 packshot per hari',
                '10 background removal per hari',
                'Cocok untuk listing 1-3 produk',
              ]}
            />
            <PositioningCard
              icon={<Crown size={20}/>}
              tier="Pro"
              tagline="Toko Aktif"
              price="Rp549K/bln"
              description="Untuk seller aktif yang post harian"
              audience="Seller serius dengan 5-15 produk"
              color={C.purple}
              gradient={`linear-gradient(135deg, ${C.purple}, ${C.pink})`}
              featured={true}
              highlights={[
                '15 caption + 15 packshot per hari',
                '12 video AI per bulan',
                'Marketing tools lengkap',
              ]}
            />
            <PositioningCard
              icon={<Users size={20}/>}
              tier="Business"
              tagline="Brand & Agency"
              price="Rp1.499K/bln"
              description="Untuk brand, agency, atau team"
              audience="Agency, brand owner, seller 50+ SKU"
              color="#6366F1"
              gradient={`linear-gradient(135deg, #6366F1, #A855F7)`}
              highlights={[
                '40 caption + 45 packshot per hari',
                '40 video AI per bulan',
                'Budget Optimizer eksklusif',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURE GRID ═══════════════════ */}
      <section style={{ padding:'72px 24px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              padding:'5px 12px', borderRadius:99,
              background: C.purpleBg, color: C.purple,
              fontSize:11, fontWeight:800, letterSpacing:'0.06em',
              marginBottom:16,
            }}>
              <Sparkles size={11}/> {toolCount}+ AI TOOLS
            </div>
            <h2 style={{
              fontSize:32, fontWeight:900, marginBottom:12,
              letterSpacing:'-0.02em', color: C.slate900,
            }}>
              Semua yang kamu butuhkan, dalam 1 platform
            </h2>
            <p style={{ fontSize:15, color: C.slate600 }}>
              Dari foto produk sampai video TikTok, dari caption sampai analytics.
            </p>
          </div>

          {/* Categories */}
          {SECTIONS.map(sec => {
            const items = sec.items
            if (!items || items.length === 0) return null
            const catInfo = sec.info
              
            return (
              <div key={sec.key} style={{ marginBottom:48 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:12, marginBottom:20,
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background: catInfo.gradient,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:20,
                  }}>{catInfo.emoji}</div>
                  <div>
                    <h3 style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>
                      {catInfo.label}
                    </h3>
                    <p style={{ fontSize:12, color: C.slate500 }}>{catInfo.description}</p>
                  </div>
                </div>

                 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                  {items.map(tool => (
                    <div key={tool.id} style={{
                      padding:'16px', borderRadius:12,
                      background: C.white,
                      border:`1px solid ${C.slate200}`,
                    }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <span style={{ fontSize:24 }}>{tool.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{
                            display:'flex', alignItems:'center', gap:6, marginBottom:4,
                          }}>
                            <strong style={{ fontSize:13 }}>{tool.label}</strong>
                            {tool.isMetered && (
                              <span style={{
                                fontSize:9, fontWeight:700, color: C.purple,
                                background: C.purpleBg, padding:'2px 6px', borderRadius:99,
                              }}>
                                {tool.credit}⚡
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize:11, color: C.slate500, lineHeight:1.5 }}>
                            {((tool as any).shortDesc ?? tool.description)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════ COMPARISON ═══════════════════ */}
      <section style={{ padding:'64px 24px', background: C.slate900, color:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <h2 style={{
            fontSize:30, fontWeight:900, textAlign:'center', marginBottom:32,
            letterSpacing:'-0.02em',
          }}>
            Kenapa BeeSell, bukan tools <span style={{ opacity:0.5 }}>"lifetime gratisan"</span>?
          </h2>

          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:20,
          }}>
            <ComparisonColumn
              title="Tools Lifetime Kompetitor"
              subtitle="(SulapFoto, Studio Pebisnis, dll)"
              items={[
                ['❌', 'Pakai Google Gemini/Grok FREE tier'],
                ['❌', 'Vendor bisa matikan free tier kapan saja'],
                ['❌', '"Unlimited" dengan hidden cap saat traffic tinggi'],
                ['❌', 'Tidak ada video AI yang reliable'],
                ['❌', 'Bahasa Indonesia sebagian, tidak optimal'],
                ['❌', 'Tidak ada Marketing Kit'],
              ]}
              negative
            />
            <ComparisonColumn
              title="BeeSell AI"
              subtitle="Infrastructure sendiri"
              items={[
                ['✅', 'API berbayar production-grade (Anthropic, Replicate)'],
                ['✅', 'Stabil jangka panjang, no vendor risk'],
                ['✅', 'Daily limit transparan di pricing page'],
                ['✅', 'UGC Generator, Image-to-Video real'],
                ['✅', 'Native Bahasa Indonesia di semua tools'],
                ['✅', 'Campaign Builder + Audience Intel + Budget Optimizer'],
              ]}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ MATH EXAMPLE ═══════════════════ */}
      <section style={{ padding:'72px 24px', background: C.purpleBg }}>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:16 }}>
            Berapa banyak yang bisa kamu produksi?
          </h2>
          <p style={{ fontSize:15, color: C.slate600, marginBottom:32, lineHeight:1.6 }}>
            Contoh seller di plan <strong>Pro Rp549K</strong>:
          </p>

          <div style={{
            background: C.white, padding:'32px 28px', borderRadius:16,
            border:`1px solid ${C.purpleLt}30`,
            display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',
            gap:20, textAlign:'left',
          }}>
            {[
              { label:'Per hari', icon:'📅', items:[
                '15 caption + 15 hook',
                '15 packshot variants',
                '10 product enhancement',
              ]},
              { label:'Per minggu', icon:'📊', items:[
                '~100 caption',
                '~100 packshot',
                '3 video AI',
              ]},
              { label:'Per bulan', icon:'🚀', items:[
                '450 caption',
                '450 packshot',
                '12 video AI complete',
              ]},
            ].map((col, i) => (
              <div key={i}>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'4px 10px', borderRadius:99,
                  background: C.purpleBg, color: C.purple,
                  fontSize:10, fontWeight:800, letterSpacing:'0.06em',
                  marginBottom:12,
                }}>
                  {col.icon} {col.label.toUpperCase()}
                </div>
                <ul style={{
                  fontSize:13, color: C.slate700, lineHeight:1.9,
                  listStyle:'none', padding:0, margin:0,
                }}>
                  {col.items.map((item, j) => (
                    <li key={j} style={{ paddingLeft:14, position:'relative' }}>
                      <Check size={11} color={C.green}
                        style={{ position:'absolute', left:0, top:7 }}/>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p style={{ fontSize:12, color: C.slate500, marginTop:20, lineHeight:1.6 }}>
            * Daily limit reset jam 00:01 WIB. Video AI pakai credit metered (300/bulan).
          </p>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section style={{ padding:'80px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <h2 style={{
            fontSize:36, fontWeight:900, marginBottom:16,
            letterSpacing:'-0.02em',
          }}>
            Siap scale toko kamu?
          </h2>
          <p style={{ fontSize:16, color: C.slate600, marginBottom:32, lineHeight:1.6 }}>
            5 trial credit gratis. Tanpa kartu kredit.
            Setup dalam 30 detik.
          </p>
          <Link href="/signup" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'16px 32px', borderRadius:14,
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            color:'#fff', fontSize:16, fontWeight:800,
            textDecoration:'none',
            boxShadow:'0 8px 30px rgba(124,58,237,0.35)',
          }}>
            Mulai Gratis Sekarang <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      <Footer/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════
function Nav() {
  return (
    <nav style={{
      padding:'18px 24px',
      borderBottom:`1px solid ${C.slate100}`,
      background:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)',
      position:'sticky', top:0, zIndex:100,
    }}>
      <div style={{
        maxWidth:1200, margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <Link href="/" style={{
          display:'flex', alignItems:'center', gap:8,
          textDecoration:'none', color: C.slate900,
        }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:900,
          }}>B</div>
          <span style={{ fontSize:17, fontWeight:800 }}>BeeSell AI</span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <Link href="/pricing" style={{
            fontSize:13, color: C.slate600, textDecoration:'none', fontWeight:600,
          }}>Pricing</Link>
          <Link href="/blog" style={{
            fontSize:13, color: C.slate600, textDecoration:'none', fontWeight:600,
          }}>Blog</Link>
          <Link href="/login" style={{
            fontSize:13, color: C.slate600, textDecoration:'none', fontWeight:600,
          }}>Login</Link>
          <Link href="/signup" style={{
            padding:'8px 18px', borderRadius:10,
            background: C.slate900, color:'#fff',
            fontSize:13, fontWeight:700, textDecoration:'none',
          }}>Mulai Gratis</Link>
        </div>
      </div>
    </nav>
  )
}

function PositioningCard({ icon, tier, tagline, price, description, audience, color, gradient, highlights, featured }: any) {
  return (
    <div style={{
      background: C.white, borderRadius:16,
      padding:'24px 20px', position:'relative',
      border: featured ? `2px solid ${color}` : `1px solid ${C.slate200}`,
      boxShadow: featured ? '0 12px 30px rgba(124,58,237,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
      transform: featured ? 'scale(1.03)' : 'scale(1)',
    }}>
      {featured && (
        <div style={{
          position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
          padding:'3px 10px', borderRadius:99,
          background: gradient, color:'#fff',
          fontSize:9, fontWeight:800, letterSpacing:'0.08em',
        }}>
          PALING POPULER
        </div>
      )}

      <div style={{
        width:44, height:44, borderRadius:10,
        background: gradient, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:14,
      }}>{icon}</div>

      <div style={{ fontSize:12, color, fontWeight:800, marginBottom:4 }}>{tier}</div>
      <h3 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>{tagline}</h3>
      <p style={{ fontSize:12, color: C.slate500, marginBottom:14, lineHeight:1.5 }}>
        {description}
      </p>

      <div style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>{price}</div>
      <div style={{ fontSize:10, color: C.slate400, marginBottom:18, fontStyle:'italic' }}>
        {audience}
      </div>

      <ul style={{ fontSize:12, listStyle:'none', padding:0, margin:0 }}>
        {highlights.map((h: string, i: number) => (
          <li key={i} style={{
            display:'flex', alignItems:'flex-start', gap:6,
            padding:'6px 0', color: C.slate700, lineHeight:1.5,
          }}>
            <Check size={13} color={color} style={{ flexShrink:0, marginTop:2 }}/>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <Link href="/pricing" style={{
        display:'block', textAlign:'center', marginTop:18,
        padding:'10px', borderRadius:10,
        background: featured ? gradient : C.slate900,
        color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none',
      }}>
        Pilih {tier} →
      </Link>
    </div>
  )
}

function ComparisonColumn({ title, subtitle, items, negative }: any) {
  return (
    <div style={{
      padding:'24px 20px', borderRadius:16,
      background: negative ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.15)',
      border: negative ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124,58,237,0.3)',
    }}>
      <h3 style={{ fontSize:16, fontWeight:800, marginBottom:4,
        opacity: negative ? 0.6 : 1,
      }}>{title}</h3>
      <p style={{ fontSize:11, opacity:0.5, marginBottom:18 }}>{subtitle}</p>
      <ul style={{ listStyle:'none', padding:0, margin:0 }}>
        {items.map((item: [string, string], i: number) => (
          <li key={i} style={{
            display:'flex', alignItems:'flex-start', gap:10,
            padding:'8px 0', fontSize:13, lineHeight:1.5,
            opacity: negative ? 0.7 : 1,
          }}>
            <span style={{ flexShrink:0 }}>{item[0]}</span>
            <span>{item[1]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{
      padding:'40px 24px', background: C.slate50,
      borderTop:`1px solid ${C.slate100}`,
      textAlign:'center',
    }}>
      <p style={{ fontSize:12, color: C.slate500 }}>
        © 2026 BeeSell AI. Made in Indonesia 🇮🇩 — Untuk seller Shopee, Tokopedia, TikTok Shop & affiliators.
      </p>
    </footer>
  )
}