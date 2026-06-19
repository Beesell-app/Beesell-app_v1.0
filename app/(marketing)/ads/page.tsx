'use client'
// app/(marketing)/ads/page.tsx  [INTERNAL — halaman referensi iklan]
// ══════════════════════════════════════════════════════════════
// BEESELL AI — Ad Creative Angles
// Segmen A: Seller Aktif | Segmen B: TikTok Affiliator
// Copy siap pakai untuk Meta Ads + TikTok Ads
// ══════════════════════════════════════════════════════════════
// CATATAN: Halaman ini adalah referensi internal untuk tim marketing.
// Route: /ads (password protected atau admin only)

export default function AdsPage() {
  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:'#F9FAFB', minHeight:'100vh', padding:'40px 24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0 }
        .card { background:#fff; border-radius:16px; border:1px solid #E5E7EB; padding:28px; box-shadow:0 1px 4px rgba(0,0,0,.06) }
        .badge { display:inline-block; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:800; letter-spacing:0.06em }
        .ad-box { background:#F3F4F6; border-radius:12px; padding:20px; border-left:4px solid }
        .copy-block { background:#1A1A2E; color:#E2E8F0; border-radius:10px; padding:20px 22px; font-size:13px; line-height:1.8; white-space:pre-wrap; font-family:'Courier New',monospace }
        .metric { background:#F9FAFB; border-radius:10px; padding:14px 16px; border:1px solid #E5E7EB; text-align:center }
      `}</style>

      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <span style={{ fontSize:24 }}>🐝</span>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#111827' }}>Ad Creative Reference</h1>
            <span className="badge" style={{ background:'#FEF3C7', color:'#92400E' }}>INTERNAL</span>
          </div>
          <p style={{ color:'#6B7280', fontSize:14 }}>Copy iklan siap pakai untuk Meta Ads & TikTok Ads. 2 segmen, masing-masing 3 variant A/B.</p>
        </div>

        {/* ── SEGMEN A: SELLER AKTIF ──────────────────────────── */}
        <div style={{ marginBottom:48 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛍️</div>
            <div>
              <h2 style={{ fontSize:20, fontWeight:800, color:'#111827' }}>Segmen A — Seller Aktif</h2>
              <p style={{ fontSize:13, color:'#6B7280' }}>Target: seller Shopee/Tokopedia/TikTok Shop yang sudah berjualan, butuh konten lebih banyak & profesional</p>
            </div>
            <span className="badge" style={{ marginLeft:'auto', background:'#DBEAFE', color:'#1D4ED8' }}>Primary Segment</span>
          </div>

          {/* Profil target */}
          <div className="card" style={{ marginBottom:20, borderLeft:'3px solid #F59E0B' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:16 }}>👤 Profil Target Ideal</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, fontSize:13 }}>
              {[
                { label:'Demografi', val:'25-40 tahun, pria/wanita\nPemilik toko online aktif\nBandung, Jakarta, Surabaya, Medan' },
                { label:'Pain Point', val:'Foto produk jelek = penjualan turun\nEdit foto manual butuh 1-2 jam\nSudah coba designer tapi mahal & lama' },
                { label:'Behavior', val:'Aktif di Shopee/Tokopedia >6 bulan\nOmzet Rp5-50 juta/bulan\nPakai TikTok Shop atau Lazada juga' },
              ].map(d=>(
                <div key={d.label}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{d.label}</div>
                  <div style={{ whiteSpace:'pre-line', lineHeight:1.6, color:'#374151' }}>{d.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Variant A1 */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
              <span className="badge" style={{ background:'#FEF3C7', color:'#92400E' }}>VARIANT A1</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: KEANDALAN — "Nggak Bakal Mati Mendadak"</span>
              <span className="badge" style={{ background:'#ECFDF5', color:'#065F46', marginLeft:'auto' }}>Recommended First Test</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Meta Ads (Facebook/Instagram)</div>
                <div className="copy-block">{`📦 TOOLS AI FOTO PRODUK YANG NGGAK BAKAL MATI MENDADAK

Seller mana yang belum pernah kena masalah ini:
Udah bayar tools AI, tiba-tiba gak bisa dipake lagi.
Kenapa? Karena tools itu numpang gratisan Google.

BeeSell AI beda.

✅ Infrastruktur AI sendiri (bukan numpang)
✅ Foto produk profesional dalam 30 detik
✅ 20+ style background siap Shopee & TikTok
✅ Stabil setiap hari — tidak bergantung kebijakan pihak lain

Udah 1.000+ seller pakai BeeSell setiap hari.
Mereka nggak khawatir tools-nya tiba-tiba mati.

Coba gratis sekarang → beesellai.com`}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>TikTok Ads (Script Video 15-30 detik)</div>
                <div className="copy-block">{`[HOOK — 0-3 detik]
"Tools AI kamu tiba-tiba mati? Ini kenapa."

[PROBLEM — 3-8 detik]
"Banyak tools AI foto produk murah 
numpang gratisan Google.
Begitu Google tutup akses... selesai."

[SOLUTION — 8-20 detik]
"BeeSell AI punya infrastruktur sendiri.
Foto produk profesional dalam 30 detik.
20+ style background.
Setiap hari. Stabil. Andal."

[CTA — 20-30 detik]
"Coba gratis di beesellai.com
Caption & hashtag gratis selamanya."

[VISUAL GUIDANCE]
- Tunjukkan foto produk sebelum/sesudah
- Split screen: tools lain error vs BeeSell jalan normal
- Text on screen di setiap poin utama`}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[['Target CTR','2.5-4%'],['Target CPC','Rp800-1.500'],['Budget Test','Rp150K/hari'],['Durasi Test','7 hari']].map(([l,v])=>(
                <div key={l} className="metric">
                  <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:4 }}>{l}</div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#111827' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Variant A2 */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
              <span className="badge" style={{ background:'#FEF3C7', color:'#92400E' }}>VARIANT A2</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: HASIL — "Foto Jelek = Omzet Turun"</span>
            </div>
            <div className="copy-block" style={{ marginBottom:16 }}>{`🔴 OMZET KAMU TURUN? CEK DULU FOTO PRODUKMU.

Fakta: 78% pembeli online memutuskan beli/tidak dari foto produk pertama.

Bukan dari harga. Bukan dari deskripsi.
Dari FOTO.

BeeSell AI mengubah foto produk biasa jadi foto studio profesional.
30 detik. Bukan 2 jam.

Sebelum: foto asal jepret dengan HP
Sesudah: foto studio dengan 20+ style background

→ Packshot profesional
→ Enhancer 20 gaya iklan
→ Remove background otomatis

Sudah dipakai seller dengan kenaikan konversi rata-rata 35%.

Coba 5 foto gratis sekarang. Tidak perlu kartu kredit.
beesellai.com`}</div>
            <div style={{ padding:'14px 16px', borderRadius:8, background:'#FFF7ED', border:'1px solid #FED7AA', fontSize:12, color:'#9A3412' }}>
              📊 <strong>Visual guide:</strong> Gunakan carousel atau split video — kiri foto jelek, kanan foto hasil BeeSell. Pastikan perbedaannya dramatis dan produknya relatable (fashion, makanan, skincare).
            </div>
          </div>

          {/* Variant A3 */}
          <div className="card">
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
              <span className="badge" style={{ background:'#FEF3C7', color:'#92400E' }}>VARIANT A3</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: KECEPATAN — "1 Jam jadi 30 Detik"</span>
            </div>
            <div className="copy-block">{`⚡ SELLER INI HEMAT 6 JAM KERJA PER HARI.

Dulu: edit foto produk = 30 menit per produk × 12 produk = 6 JAM
Sekarang: 30 DETIK per foto dengan BeeSell AI.

Bukan Photoshop.
Bukan Canva yang tetap ribet.
BeeSell AI — upload, pilih style, selesai.

16 tools dalam 1 platform:
📦 Foto produk profesional
🎬 Video UGC tanpa kamera
✍️ Caption viral otomatis
📅 Jadwal posting semua platform

Seller serius butuh tools yang serius.

Coba gratis → beesellai.com`}</div>
          </div>
        </div>

        {/* ── SEGMEN B: TIKTOK AFFILIATOR ────────────────────── */}
        <div style={{ marginBottom:48 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'#F5F3FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎵</div>
            <div>
              <h2 style={{ fontSize:20, fontWeight:800, color:'#111827' }}>Segmen B — TikTok Affiliator</h2>
              <p style={{ fontSize:13, color:'#6B7280' }}>Target: content creator TikTok yang dapat komisi dari promosi produk, butuh volume konten tinggi</p>
            </div>
            <span className="badge" style={{ marginLeft:'auto', background:'#F5F3FF', color:'#5B21B6' }}>Secondary Segment</span>
          </div>

          {/* Profil */}
          <div className="card" style={{ marginBottom:20, borderLeft:'3px solid #7C3AED' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:16 }}>👤 Profil Target Ideal</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, fontSize:13 }}>
              {[
                { label:'Demografi', val:'18-32 tahun, mayoritas perempuan\nTikTok follower 2K-500K\nPenghasilan dari komisi affiliasi' },
                { label:'Pain Point', val:'Butuh 10-30 konten per hari\nIde habis, bingung mau bikin apa\nVideo muka terus bosan & capek' },
                { label:'Behavior', val:'Aktif di TikTok >3 jam/hari\nUdah join TikTok Shop Affiliate\nPernah coba tools AI tapi ribet' },
              ].map(d=>(
                <div key={d.label}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{d.label}</div>
                  <div style={{ whiteSpace:'pre-line', lineHeight:1.6, color:'#374151' }}>{d.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Variant B1 */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
              <span className="badge" style={{ background:'#F5F3FF', color:'#5B21B6' }}>VARIANT B1</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: VOLUME — "30 Konten per Hari Tanpa Burnout"</span>
              <span className="badge" style={{ background:'#ECFDF5', color:'#065F46', marginLeft:'auto' }}>Recommended First Test</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Meta Ads</div>
                <div className="copy-block">{`🎵 AFFILIATOR YANG BIKIN 30 VIDEO PER HARI TANPA BURNOUT

Tidak, dia bukan robot.
Dia pakai BeeSell AI.

Masalah affiliator TikTok:
→ Ide konten habis di hari ke-3
→ Capek muncul di depan kamera terus
→ Edit manual butuh waktu lama

Solusinya:
🎭 Avatar AI presenter — tidak perlu muka kamu
🎬 Script viral otomatis dari info produk
✍️ Caption + hashtag siap upload
📅 Auto-schedule ke semua platform

Komisi naik karena konten makin banyak.
Badan nggak burnout karena AI yang kerja.

Coba gratis → beesellai.com`}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>TikTok Ads Script</div>
                <div className="copy-block">{`[HOOK — 0-3 detik]
"Affiliator ini bikin 30 video sehari
tanpa capek depan kamera."

[RELATE — 3-10 detik]
"Pernah habis ide konten di hari ke-3?
Atau capek muncul terus di video?
Aku pernah."

[REVEAL — 10-22 detik]
"Sekarang aku pakai BeeSell AI.
Avatar presenter buat konten.
Script viral otomatis.
Caption + hashtag langsung siap.

30 konten per hari.
Komisi naik 3x bulan pertama."

[CTA — 22-30 detik]
"Link di bio — coba gratis dulu.
Caption & hashtag gratis selamanya."

[VISUAL GUIDANCE]
- Creator ngomong ke kamera (relatable)
- Tunjukkan dashboard BeeSell
- Show avatar talking head dalam aksi
- Screen recording proses yang cepat`}</div>
              </div>
            </div>
          </div>

          {/* Variant B2 */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <span className="badge" style={{ background:'#F5F3FF', color:'#5B21B6' }}>VARIANT B2</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: KOMISI — "Komisi Naik 3x dengan Konten Lebih Banyak"</span>
            </div>
            <div className="copy-block" style={{ marginBottom:12 }}>{`💰 RUMUS KOMISI AFFILIATOR: KONTEN × KUALITAS = CUAN

Lebih banyak konten = lebih banyak titik masuk traffic.
Konten lebih bagus = conversion lebih tinggi.

BeeSell AI membantu keduanya.

📊 Rata-rata affiliator yang pakai BeeSell:
• Upload konten 4x lebih banyak dari sebelumnya
• Waktu produksi turun dari 2 jam → 15 menit per video
• Caption & hashtag AI = engagement naik

Tools yang kamu pakai:
🎭 AI Talking Head — video tanpa muncul di kamera
🎵 TikTok Reels AI — script + hook + CTA otomatis  
📝 Subtitle Whisper — auto-caption yang viral
✍️ Caption AI + Hashtag — siap upload langsung

Mulai gratis di beesellai.com`}</div>
          </div>

          {/* Variant B3 */}
          <div className="card">
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <span className="badge" style={{ background:'#F5F3FF', color:'#5B21B6' }}>VARIANT B3</span>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Angle: FEAR — "Competitor Affiliator Kamu Sudah Pakai AI"</span>
            </div>
            <div className="copy-block">{`⚠️ SEMENTARA KAMU BIKIN 3 KONTEN SEHARI...

Affiliator lain di niche yang sama:
✓ Bikin 20-30 konten dengan AI
✓ Caption & hashtag sudah dioptimalkan AI
✓ Video avatar tanpa perlu depan kamera

Mereka nggak lebih rajin dari kamu.
Mereka cuma pakai tools yang lebih smart.

BeeSell AI bukan tentang gantiin kreativitas kamu.
Ini tentang mengalikan produktivitas kamu.

1 ide kamu → 10 konten berbeda.
10 konten → lebih banyak titik komisi.

Mulai gratis sekarang.
Jangan kasih competitors makin jauh.

beesellai.com`}</div>
          </div>
        </div>

        {/* ── A/B TEST GUIDE ────────────────────────────────── */}
        <div className="card" style={{ borderTop:'3px solid #F59E0B' }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:20 }}>📊 Panduan A/B Test</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            <div>
              <h4 style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:12 }}>Setup Test (Minggu 1-2)</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'#6B7280' }}>
                {['Budget: Rp150K/hari per variant (total Rp300K/hari)','Platform: Mulai dari Meta (Facebook/Instagram) lebih dulu','Audience: Lookalike 1-3% dari email list atau web visitors','Placement: Feed + Stories (auto-placement)',`Format: Single image + carousel (bukan video dulu — lebih murah untuk test copy)`,'Jangan ubah visual saat test copy, jangan ubah copy saat test visual'].map((t,i)=>(
                  <div key={i} style={{ display:'flex', gap:8 }}><span style={{ color:'#F59E0B' }}>→</span>{t}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:12 }}>Kriteria Pemenang</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['CTR (Click-Through Rate)','> 2.5% = bagus, > 4% = excellent'],['CPC (Cost Per Click)','< Rp1.500 untuk segmen seller'],['Conversion Rate','Register/Landing Page > 15% dari klik'],['CAC (Cost per Signup)','Target < Rp15.000 per signup gratis'],['ROAS Paid (Paying User)','Target CAC paying user < Rp150K']].map(([m,t])=>(
                  <div key={m} style={{ padding:'10px 12px', borderRadius:8, background:'#F9FAFB', border:'1px solid #E5E7EB', fontSize:12 }}>
                    <div style={{ fontWeight:700, color:'#111827', marginBottom:2 }}>{m}</div>
                    <div style={{ color:'#6B7280' }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding:'16px 18px', borderRadius:10, background:'#FFF7ED', border:'1px solid #FED7AA', fontSize:13, color:'#92400E' }}>
            <strong>Prioritas test:</strong> B1 (Affiliator — Volume) dan A1 (Seller — Keandalan) terlebih dulu karena angle ini paling langsung menyerang pain point dan paling membedakan dari kompetitor. Jika CTR keduanya di atas 2.5% dalam 3 hari, scale budget 2x. Jika tidak, test variant lain.
          </div>
        </div>

        {/* ── DIFERENSIASI MESSAGING ────────────────────────── */}
        <div className="card" style={{ marginTop:24, borderTop:'3px solid #DC2626' }}>
          <h3 style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:16 }}>🔑 Diferensiasi Wajib Muncul di Semua Iklan</h3>
          <p style={{ fontSize:14, color:'#6B7280', marginBottom:20 }}>Minimal satu dari poin berikut harus ada di setiap creative — ini yang membedakan BeeSell dari kompetitor lifetime murah:</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {[
              { point:'"Infrastruktur AI sendiri — tidak numpang gratisan"', context:'Gunakan untuk menyerang kelemahan kompetitor tanpa menyebut nama' },
              { point:'"Stabil setiap hari — tidak bergantung kebijakan pihak lain"', context:'Memperkuat angle keandalan vs tools yang bisa mati mendadak' },
              { point:'"Quick Tools gratis selamanya"', context:'Counter narasi bahwa BeeSell lebih mahal — ada yang benar-benar gratis' },
              { point:'"Output siap upload, tidak perlu editing"', context:'Kecepatan + kemudahan — berbeda dari tools yang masih butuh post-edit' },
            ].map((d,i)=>(
              <div key={i} style={{ padding:'16px', borderRadius:10, background:'#F9FAFB', border:'1px solid #E5E7EB' }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#111827', marginBottom:6 }}>"{d.point.replace(/"/g,'')}"</div>
                <div style={{ fontSize:12, color:'#9CA3AF' }}>{d.context}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}