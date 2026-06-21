// apps/web-app/app/layout.tsx
// ── Root layout — SEO metadata, OG, GA, structured data ───────
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Sans, Fraunces, DM_Mono } from 'next/font/google'
import Providers from './providers'
import './global.css'
import './globals-responsive.css'

// ── Fonts ──────────────────────────────────────────────────────
const dmSans = DM_Sans({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-dm-sans',
  weight:   ['400', '500', '600', '700'],
})
const FAQS : {
  question: string
  answer: string
}[] = [
  {
    question: 'Apa itu BeeSell AI dan bagaimana AI caption generator ini membantu seller online Indonesia?',
    answer: 'BeeSell AI adalah platform asisten konten penjualan AI khusus seller online dan affiliator Indonesia. Membantu membuat caption, ide visual, script video, hook viral, deskripsi produk, dan strategi konten marketing dalam hitungan detik.'
  },
  {
    question: 'Siapa yang cocok menggunakan BeeSell AI?',
    answer: 'BeeSell AI cocok untuk seller Shopee, TikTok Shop, Tokopedia, affiliator TikTok, reseller, dropshipper, UMKM, content creator jualan, hingga personal branding seller yang ingin meningkatkan konsistensi konten dan penjualan.'
  },
  {
    question: 'Apakah bahasanya cocok untuk pasar lokal Indonesia?',
    answer: 'Ya 100%. Sistem AI BeeSell AI telah dioptimasi menggunakan gaya bahasa digital marketing Indonesia sehingga hasil konten lebih natural, persuasif, relate dengan audiens lokal, dan cocok untuk kebutuhan jualan online.'
  },
  {
    question: 'Apa bedanya BeeSell AI dengan ChatGPT biasa?',
    answer: 'ChatGPT bersifat umum dan membutuhkan prompt manual yang kompleks. BeeSell AI menyediakan engine khusus seller dan affiliator dengan template siap pakai untuk membuat konten jualan tanpa perlu belajar prompt engineering.'
  },
  {
    question: 'Apakah BeeSell AI bisa dipakai pemula?',
    answer: 'Bisa. BeeSell AI dirancang supaya user tanpa skill copywriting, desain, atau marketing tetap bisa membuat konten jualan profesional dengan mudah.'
  },
  {
    question: 'Apakah BeeSell AI harus pakai skill prompt?',
    answer: 'Tidak harus. BeeSell AI menyediakan template otomatis dan sistem input sederhana sehingga user tinggal memilih kebutuhan konten yang diinginkan.'
  },
  {
    question: 'BeeSell AI membantu apa saja?',
    answer: 'BeeSell AI membantu membuat hook viral, caption jualan, script video TikTok, ide konten affiliate, CTA closing, soft selling, hard selling, storytelling, deskripsi produk, angle marketing, kalender konten, hingga optimasi copywriting penjualan.'
  },
  {
    question: 'Apakah BeeSell AI cocok untuk affiliator TikTok Shop dan content creator affiliate marketing?',
    answer: 'Bisa. User cukup memasukkan nama produk atau manfaat produk, lalu BeeSell AI akan menghasilkan script video pendek yang siap digunakan untuk konten TikTok atau Reels.'
  },
  {
    question: 'Apakah BeeSell AI bisa bikin hook viral?',
    answer: 'Bisa. BeeSell AI dapat menghasilkan berbagai variasi hook viral berdasarkan niche, target market, dan tujuan konten agar lebih menarik perhatian audiens.'
  },
  {
    question: 'Apakah BeeSell AI bisa bikin caption otomatis?',
    answer: 'Ya. BeeSell AI dapat membuat caption soft selling, hard selling, edukasi, storytelling, hingga caption persuasif dengan call-to-action yang kuat.'
  },
  {
    question: 'Apakah BeeSell AI cocok untuk affiliate TikTok?',
    answer: 'Sangat cocok. BeeSell AI memang dibuat untuk membantu affiliator membuat konten lebih cepat, lebih konsisten, dan lebih mudah menemukan ide konten yang berpotensi menghasilkan penjualan.'
  },
  {
    question: 'Apakah BeeSell AI bisa bantu personal branding seller?',
    answer: 'Bisa. BeeSell AI membantu membuat konten edukasi, storytelling, authority content, dan positioning personal branding agar seller terlihat lebih profesional dan dipercaya audiens.'
  },
  {
    question: 'Marketplace apa saja yang didukung?',
    answer: 'BeeSell AI mendukung kebutuhan konten untuk berbagai platform seperti TikTok Shop, Shopee, Tokopedia, Instagram, Facebook, WhatsApp, hingga YouTube Shorts.'
  },
  {
    question: 'Apakah BeeSell AI bisa bikin deskripsi produk?',
    answer: 'Bisa. User cukup memasukkan nama produk dan keunggulan produk, lalu BeeSell AI akan menghasilkan deskripsi produk yang lebih menarik dan menjual.'
  },
  {
    question: 'Apakah BeeSell AI bisa kasih ide konten harian?',
    answer: 'Bisa. BeeSell AI membantu menghasilkan ide konten harian agar seller dan affiliator tidak kehabisan ide upload setiap hari.'
  },
  {
    question: 'Apakah ada integrasi langsung dengan media sosial?',
    answer: 'BeeSell AI dapat membantu workflow publishing dan penjadwalan konten untuk berbagai platform media sosial sehingga proses upload menjadi lebih efisien.'
  },
  {
    question: 'Apakah hasil AI bisa langsung dipakai?',
    answer: 'Bisa langsung digunakan. Namun user tetap disarankan menyesuaikan sedikit dengan gaya komunikasi brand atau personal branding masing-masing.'
  },
  {
    question: 'Apakah BeeSell AI aman digunakan?',
    answer: 'Ya. BeeSell AI dirancang untuk membantu kebutuhan bisnis digital, content marketing, dan aktivitas promosi online secara aman dan efisien.'
  },
  {
    question: 'Apakah BeeSell AI bisa digunakan untuk semua niche?',
    answer: 'Bisa. BeeSell AI dapat digunakan untuk berbagai niche seperti fashion, skincare, beauty, gadget, makanan, home living, edukasi, digital product, dan lainnya.'
  },
  {
    question: 'Apakah BeeSell AI menggantikan content creator?',
    answer: 'Tidak. BeeSell AI membantu mempercepat proses ide dan produksi konten, tetapi kreativitas dan strategi tetap berasal dari user.'
  },
  {
    question: 'Apakah BeeSell AI gratis?',
    answer: 'BeeSell AI dapat menyediakan free trial atau fitur terbatas agar user bisa mencoba platform sebelum berlangganan.'
  },
  {
    question: 'Apakah tersedia sistem subscription?',
    answer: 'Ya. BeeSell AI dapat menggunakan sistem langganan bulanan atau tahunan sesuai kebutuhan user.'
  },
  {
    question: 'Apakah bisa cancel langganan kapan saja?',
    answer: 'Bisa. User dapat menghentikan subscription sesuai ketentuan paket yang digunakan.'
  },
  {
    question: 'Bagaimana cara belajar menggunakan BeeSell AI?',
    answer: 'User dapat belajar melalui tutorial video, panduan penggunaan, komunitas, dan customer support yang disediakan BeeSell AI.'
  },
  {
    question: 'Jika ada error atau kendala harus ke mana?',
    answer: 'User dapat menghubungi tim support BeeSell AI melalui live chat, email support, atau komunitas resmi.'
  },
  {
    question: 'Kenapa seller membutuhkan BeeSell AI?',
    answer: 'Karena banyak seller kesulitan membuat konten secara konsisten, kehabisan ide, bingung membuat caption, dan tidak punya waktu untuk copywriting. BeeSell AI membantu mempercepat semua proses tersebut.'
  },
  {
    question: 'Apakah BeeSell AI bisa membantu jualan lebih laris?',
    answer: 'BeeSell AI membantu meningkatkan kualitas konten marketing dan konsistensi promosi sehingga peluang mendapatkan engagement dan penjualan menjadi lebih besar.'
  },
  {
    question: 'Berapa cepat hasil bisa dirasakan?',
    answer: 'Banyak user sudah bisa membuat konten lebih cepat dan lebih konsisten sejak hari pertama menggunakan BeeSell AI.'
  },
  {
    question: 'Kenapa BeeSell AI berbeda dari AI lain?',
    answer: 'Karena BeeSell AI fokus khusus untuk seller online dan affiliator Indonesia dengan fitur yang dirancang berdasarkan kebutuhan real content marketing dan conversion jualan online.'
  }
]
const fraunces = Fraunces({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-fraunces',
  weight:   ['400', '600'],
})

const dmMono = DM_Mono({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-dm-mono',
  weight:   ['400', '500'],
})

// ── Metadata (SEO + OG) ────────────────────────────────────────
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beesell.ai'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:  'BeeSell AI — Caption Generator untuk Seller Indonesia',
    template: '%s | BeeSell AI',
  },
  description:
    'Buat caption Instagram & TikTok yang converting dalam hitungan detik. AI khusus untuk seller dan affiliator Indonesia.',

  keywords: [
  // ── Core Brand Keywords ─────────────────────────────
    'beesell ai',
    'beesell ai indonesia',
    'platform ai seller indonesia',
    'content sales engine indonesia',
    'ai content platform indonesia',
    'ai seller platform',
    'ai commerce platform',
    'ai marketing platform indonesia',
    'ai automation seller',

    // ── AI Caption & Copywriting ───────────────────────
    'caption generator AI',
    'ai caption generator',
    'ai caption generator indonesia',
    'caption instagram indonesia',
    'caption tiktok jualan',
    'caption jualan otomatis',
    'caption jualan viral',
    'caption instagram jualan',
    'caption marketplace',
    'caption affiliate marketing',
    'caption produk otomatis',
    'caption promosi otomatis',
    'caption social media otomatis',
    'caption marketing otomatis',
    'caption tiktok viral',
    'caption reels instagram',
    'caption konten jualan',
    'caption creator indonesia',
    'caption creator seller',
    'caption generator seller online',
    'caption untuk tiktok shop',
    'caption untuk seller online',
    'caption untuk umkm',
    'copywriting jualan otomatis',
    'copywriting marketplace',
    'copywriting shopee',
    'copywriting tokopedia',
    'copywriting tiktok shop',
    'copywriting affiliate',
    'copywriting AI indonesia',
    'copywriting produk otomatis',
    'copywriting social media',
    'copywriting instagram jualan',
    'copywriting konten marketing',

    // ── AI Content Generator ───────────────────────────
    'ai content generator',
    'ai content generator indonesia',
    'ai content creator',
    'ai content creator indonesia',
    'AI content creator seller',
    'content creator affiliator',
    'ai content marketing',
    'ai content automation',
    'ai konten tiktok',
    'ai konten instagram',
    'ai konten jualan',
    'ai konten affiliate',
    'ai konten marketplace',
    'ai konten otomatis',
    'generator konten AI',
    'generator ide konten',
    'generator konten viral',
    'generator konten tiktok',
    'generator konten jualan',
    'generator script konten',
    'generator hook konten',
    'content marketing AI',
    'social media content AI',
    'content workflow automation',
    'content engine seller',
    'content engine indonesia',
    'content automation indonesia',

    // ── TikTok & Affiliate Keywords ────────────────────
    'ai untuk tiktok shop',
    'ai script tiktok viral',
    'ai tiktok generator',
    'ai tiktok content',
    'ai tiktok script generator',
    'script tiktok otomatis',
    'script affiliate tiktok',
    'script video pendek AI',
    'script viral tiktok',
    'hook viral tiktok',
    'hook affiliate marketing',
    'ai affiliate tools',
    'ai affiliator indonesia',
    'ai untuk affiliator',
    'affiliate marketing AI',
    'affiliate tools indonesia',
    'tools affiliator tiktok',
    'ai video hook generator',
    'ai video selling generator',

    // ── Seller & Marketplace Keywords ──────────────────
    'tools seller online',
    'ai seller tools',
    'ai seller indonesia',
    'ai untuk seller online',
    'ai untuk jualan online',
    'ai untuk umkm',
    'ai marketplace tools',
    'ai marketplace indonesia',
    'ai seo marketplace',
    'seo marketplace otomatis',
    'ai produk marketplace',
    'caption shopee tokopedia',
    'tools jualan online',
    'tools content seller',
    'tools marketing seller',
    'tools automation seller',
    'tools jualan tiktok shop',
    'tools jualan shopee',
    'tools jualan marketplace',
    'automation seller indonesia',
    'sales engine seller online',
    'sales automation seller',
    'social commerce AI',

    // ── AI Image & Visual Generator ────────────────────
    'AI Visual Marketing Engine',
    'ai product image',
    'ai ugc generator',
    'ugc content generator',
    'ai visual produk',
    'ai visual marketing',
    'ai gambar produk',
    'ai foto produk',
    'ai product photography',
    'ai studio produk',
    'ai marketplace image',
    'ai iklan produk',
    'ai banner generator',
    'ai ads image',
    'ai visual commerce',
    'ai visual creator',
    'generator gambar jualan',
    'generator foto produk',
    'ai realistic product image',
    'ai ecommerce image generator',

    // ── Marketing & Automation ─────────────────────────
    'ai marketing indonesia',
    'ai marketing tools indonesia',
    'ai social media tools',
    'ai social media marketing',
    'ai marketing automation',
    'marketing automation AI',
    'social media automation',
    'content automation tools',
    'ai campaign generator',
    'ai ads generator',
    'ai sales funnel content',
    'ai conversion content',
    'ai conversion engine',
    'content sales engine',
    'content sales automation',
    'ai branding tools',
    'ai business tools indonesia',

    // ── Commerce & SaaS Keywords ───────────────────────
    'saas ai indonesia',
    'platform ai indonesia',
    'commerce ai platform',
    'content commerce platform',
    'ai ecommerce tools',
    'ai ecommerce indonesia',
    'social commerce platform',
    'creator commerce AI',
    'ai business automation',
    'ai startup indonesia',
    'platform automation content',
    'platform content seller',
    'platform content affiliator',

    // ── Long Tail SEO Keywords ─────────────────────────
    'cara membuat caption jualan otomatis',
    'cara membuat konten tiktok viral',
    'tools ai untuk jualan online',
    'ai terbaik untuk seller online',
    'ai terbaik untuk affiliator',
    'platform ai untuk umkm',
    'aplikasi ai content creator indonesia',
    'tools ai tiktok shop indonesia',
    'ai untuk bikin konten jualan',
    'ai untuk bikin caption viral',
    'ai untuk social media marketing',
    'platform ai untuk content creator',
    'tools ai untuk affiliate marketing',
    'ai untuk copywriting marketplace',
    'tools ai untuk instagram jualan',
    'aplikasi ai seller online indonesia',
    'ai untuk bisnis online',
    'ai untuk ecommerce indonesia',
    'ai untuk promosi produk',
    'ai untuk branding bisnis',
  ],
  appLinks: {
    web: {
      url: siteUrl,
      should_fallback: true,
    },
  },
  category: 'AI Marketing Software',
  authors:  [{ name: 'BeeSell AI', url: siteUrl }],
  creator:  'BeeSell AI',
  publisher: 'BeeSell AI',
  applicationName: 'BeeSell AI',
  referrer: 'origin-when-cross-origin',
  // Open Graph
  openGraph: {
    type:        'website',
    locale:      'id_ID',
    url:          siteUrl,
    siteName:    'BeeSell AI',
    title:       'BeeSell AI — Caption AI untuk Seller Indonesia',
    description: 'Buat caption Instagram & TikTok yang converting dalam detik. AI khusus seller & affiliator Indonesia.',
    images: [{
      url:    '/og/default.png',
      width:  1200,
      height: 630,
      alt:    'BeeSell AI — Caption Generator untuk Seller Indonesia',
    }],
  },

  // Twitter Card
  twitter: {
    card:        'summary_large_image',
    title:       'BeeSell AI — Caption AI untuk Seller Indonesia',
    description: 'Buat caption Instagram & TikTok yang converting dalam detik.',
    images:      ['/og/default.png'],
    creator:     '@beesellai',
  },

  // Robots
  robots: {
    index:                    true,
    follow:                   true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  
  // mencegah auto detect phone/email iOS:
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Verification (isi setelah dapat kode dari Google Search Console)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
    other: {
      bing: process.env.BING_SITE_VERIFICATION ?? '',
    },
  },
  

  // Icons
  icons: {
    icon:       '/favicon.ico',
    shortcut:   '/favicon-32x32.png',
    apple:      '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/site.webmanifest',

  // Canonical
  alternates: {
    canonical: siteUrl,
    languages: { 'id-ID': siteUrl },
  },
}

// ── Viewport ───────────────────────────────────────────────────
export const viewport: Viewport = {
  width:             'device-width',
  initialScale:      1,
  maximumScale:      5,
  themeColor:        [
    { media: '(prefers-color-scheme: light)', color: '#F59E0B' },
    { media: '(prefers-color-scheme: dark)',  color: '#D97706' },
  ],
}

// ── GA Measurement ID ──────────────────────────────────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// ── Root layout ────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${fraunces.variable} ${dmMono.variable}`}>
      <head>
          {/* Preconnect for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <meta name="generator" content="BeeSell AI" />
          <meta name="ai-content-declaration" content="AI-assisted" />
          <meta name="robots" content="index,follow,max-image-preview:large" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
          <meta name="color-scheme" content="light dark" />
        </head>
      <body style={{
        margin:     0,
        padding:    0,
        background: '#fff',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
         <Providers>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <script
          id="software-app-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type':    'SoftwareApplication',
            name:       'BeeSell AI',
            url:         siteUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${siteUrl}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
            description: 'AI Caption Generator untuk seller dan affiliator Indonesia',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type':    'Offer',
              price:      '0',
              priceCurrency: 'IDR',
              description: 'Mulai gratis',
            },
            provider: {
              '@type': 'Organization',
              name:    'BeeSell AI',
              url:      siteUrl,
            },
            appleWebApp: {
              capable: true,
              statusBarStyle: 'default',
              title: 'BeeSell AI',
            },
            languages: {
              'id-ID': siteUrl,
              'en-US': `${siteUrl}/en`,
            },
            other: [
              {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#2563EB',
              },
            ],
        }),
      }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BeeSell AI',
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              sameAs: [
                'https://instagram.com/beesellai',
                'https://tiktok.com/@beesellai',
              ],
            }),
          }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'BeeSell AI',
              url: siteUrl,
            }),
          }}
        />
        <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
            {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html:
              `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');` }} />
          </>
        )}
            <Script
              id="faq-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: FAQS.map((faq) => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: faq.answer,
                    },
                  })),
                }),
              }}
            />
            
            </Providers>
      </body>

    </html>
  )
}