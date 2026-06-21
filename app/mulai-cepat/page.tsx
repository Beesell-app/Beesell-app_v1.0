// ════════════════════════════════════════════════════════════════
// FILE: app/mulai-cepat/page.tsx   (project help.beesell.id)
// ────────────────────────────────────────────────────────────────
// CONTOH artikel yang sudah diisi. Pakai ini sebagai cetakan:
// salin file ini ke folder baru (mis. app/quick-tools/page.tsx),
// ganti `category`, `title`, `intro`, dan isi `sections`.
// Setiap section butuh `id` unik (untuk TOC) + `heading` + `body`.
// ════════════════════════════════════════════════════════════════
'use client'

import Article, { HP, HSteps, HList, HNote, HSub, HKbd } from '@/components/article'
import { APP_URL } from '@/components/help-shell'

export default function MulaiCepatPage() {
  return (
    <Article
      category="Memulai"
      title="Mulai Cepat"
      intro="Dari foto produk biasa ke visual siap jual dalam beberapa menit. Ikuti enam langkah ini — tidak perlu skill design atau editing."
      updated="Juni 2026"
      sections={[
        {
          id: 'daftar',
          heading: '1. Daftar & masuk',
          body: (
            <>
              <HP>Buat akun gratis untuk mulai. Paket Starter memberi 5 generate untuk mencoba kualitas hasil BeeSell.</HP>
              <HSteps items={[
                <>Buka <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#D97706', fontWeight: 700 }}>app.beesell.id</a> lalu klik <b>Daftar</b>.</>,
                <>Verifikasi email dan nomor HP (wajib sekali, untuk mencegah penyalahgunaan kuota gratis).</>,
                <>Kamu akan langsung masuk ke dashboard.</>,
              ]} />
              <HNote type="info">Paket Starter = 5 generate <b>total seumur hidup</b>, bukan per bulan. Untuk pemakaian harian, naik ke Basic atau Pro kapan saja.</HNote>
            </>
          ),
        },
        {
          id: 'profil',
          heading: '2. Lengkapi profil toko (AI Memory)',
          body: (
            <>
              <HP>BeeSell memakai profil tokomu untuk membuat caption & visual yang lebih relevan. Mengisi ini sekali membuat semua hasil terasa "nyambung" dengan brand-mu.</HP>
              <HList items={[
                <>Nama toko, kategori produk, dan target pembeli.</>,
                <>Gaya bahasa: santai, formal, atau gaya TikTok.</>,
                <>Platform jualan utama (Shopee, TikTok Shop, Tokopedia).</>,
              ]} />
              <HP>Buka <b>Pengaturan → Profil & AI Memory</b> untuk mengisinya. Bisa dilewati dan diisi nanti.</HP>
            </>
          ),
        },
        {
          id: 'upload',
          heading: '3. Upload foto produk pertama',
          body: (
            <>
              <HP>Hasil terbaik dimulai dari foto yang jelas. Tidak harus bagus — cukup terang dan fokus.</HP>
              <HNote type="tip">Foto dengan cahaya cukup dan produk terlihat penuh akan menghasilkan output paling tajam. Hindari foto buram atau terlalu gelap.</HNote>
              <HList items={[
                <>Format didukung: JPG, PNG, WEBP.</>,
                <>Satu produk per foto untuk hasil paling rapi.</>,
                <>Background berantakan tidak masalah — bisa dibersihkan dengan Quick Tools.</>,
              ]} />
            </>
          ),
        },
        {
          id: 'pilih',
          heading: '4. Pilih tool & preset',
          body: (
            <>
              <HP>Pilih sesuai kebutuhan. Beberapa yang paling sering dipakai seller:</HP>
              <HSub>Untuk foto produk</HSub>
              <HList items={[
                <><b>AI Packshot</b> — foto studio ecommerce otomatis (17 preset).</>,
                <><b>Product to Model</b> — produk dipakai model lokal Indonesia.</>,
                <><b>AI Try-On</b> — pasang pakaian ke model tertentu.</>,
              ]} />
              <HSub>Untuk edit cepat</HSub>
              <HList items={[
                <><b>Quick Tools</b> — hapus background, upscale ke HD, resize ke ukuran marketplace, perbaiki cahaya.</>,
              ]} />
            </>
          ),
        },
        {
          id: 'generate',
          heading: '5. Generate & download',
          body: (
            <>
              <HSteps items={[
                <>Klik <b>Generate</b>. Proses biasanya 20–40 detik (video 1–3 menit).</>,
                <>Pilih hasil yang paling cocok dari variasi yang muncul.</>,
                <>Klik <b>Download</b> untuk simpan, atau temukan lagi nanti di <b>Asset Library</b>.</>,
              ]} />
              <HNote type="tip">Tekan <HKbd>⌘K</HKbd> di dashboard untuk membuka tool apa pun secara cepat tanpa mencari di menu.</HNote>
            </>
          ),
        },
        {
          id: 'marketing',
          heading: '6. Tambahkan caption & hashtag',
          body: (
            <>
              <HP>Setelah visual jadi, lengkapi dengan teks jualan dari Marketing Tools agar siap posting:</HP>
              <HList items={[
                <><b>Caption</b> & <b>Hook</b> — menarik perhatian di 3 detik pertama.</>,
                <><b>CTA</b> & <b>Hashtag</b> — dorong klik dan jangkauan.</>,
                <><b>Deskripsi produk</b> — versi SEO untuk marketplace.</>,
              ]} />
              <HP>Selesai — visual + teks kamu siap diunggah ke Shopee, TikTok Shop, atau Instagram.</HP>
            </>
          ),
        },
      ]}
      related={[
        { title: 'Cara pakai AI Packshot', href: '/ai-image/packshot' },
        { title: 'Quick Tools: Remove Background', href: '/quick-tools' },
        { title: 'Bandingkan paket & harga', href: '/paket' },
      ]}
      next={{ title: 'AI Studio', href: '/studio' }}
    />
  )
}