# BeeSell AI — Beta Deploy Smoke Test
# Generated: 19 Mei 2026
# Tester: Andiraja
# Environment: https://beesell.id (production) atau localhost:3000

## Setup Sebelum Test

```bash
# Terminal 1 — dev server
cd C:\agentic\beesell-ai\apps\web-app
rmdir /s /q .next
npm run dev

# Terminal 2 — monitor logs
# Buka browser DevTools → Network + Console
# Buka Supabase Dashboard → Logs
```

Buat 2 akun test:
- **FREE_USER**: email `free@test.id`, invite code BSAI-TEST01
- **PRO_USER**: email `pro@test.id`, set `plan = 'pro'` di Supabase langsung

---

## ═══════════════════════════════════════════════
## FLOW 1: Landing Page & Registrasi
## ═══════════════════════════════════════════════

### 1.1 Landing Page

| # | Test | URL | Expected | Status |
|---|---|---|---|---|
| 1 | Buka landing page | `/` | Hero section muncul, font DM Sans loaded | ok |
| 2 | OG image | `/og/default.png` | Gambar 1200×630 "BeeSell AI" muncul | ☐ |
| 3 | Sitemap | `/sitemap.xml` | XML valid, ada `/`, `/register`, `/login` | ☐ |
| 4 | Robots | `/robots.txt` | Disallow: /dashboard/, /api/ | ☐ |
| 5 | CTA Navbar | Klik "Mulai Gratis" | Redirect ke `/register` | ☐ |
| 6 | Section scroll | Klik "Fitur", "Cara Kerja", "Harga" | Smooth scroll ke section | ☐ |
| 7 | Pricing cards | Lihat 3 plan | Free/Basic/Pro tampil dengan harga | ☐ |
| 8 | Mobile navbar | Resize < 640px | Hamburger menu muncul | ☐ |

### 1.2 Waitlist Form

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 9 | Submit kosong | Klik "Daftar" tanpa email | `type="email" required` block browser | ☐ |
| 10 | Email invalid | Input "bukan-email" | Browser validation block | ☐ |
| 11 | Submit valid | Email + nama + role → submit | "Berhasil daftar!" message hijau | ☐ |
| 12 | Double submit | Submit email yang sama lagi | "Kamu sudah terdaftar!" | ☐ |
| 13 | DB check | Supabase → Table Editor → waitlist | Row ada dengan email tersebut | ☐ |

### 1.3 Registrasi dengan Invite Code

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 14 | Buka register | `/register` | Form tampil dengan invite code field | ☐ |
| 15 | Kode invalid | Ketik "INVALID123" | Badge merah "Kode tidak valid" setelah 500ms | ☐ |
| 16 | Kode valid | Ketik kode dari generate-invite-codes | Badge hijau "2 slot tersisa" | ☐ |
| 17 | Register dengan kode | Isi semua field + submit | Redirect ke `/dashboard` | ☐ |
| 18 | Kode habis | Isi same code lagi (max_uses=1) | "Kode invite sudah penuh" | ☐ |
| 19 | Pre-fill via URL | `/register?invite=BSAI-TEST01` | Kode auto-terisi di input | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 2: Auth & Session
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 20 | Login valid | `/login` → email+pass | Redirect ke `/dashboard` | ☐ |
| 21 | Login invalid | Password salah | "Email atau password salah" toast | ☐ |
| 22 | Session persist | Refresh browser | Tetap login, tidak redirect ke login | ☐ |
| 23 | Protected route | Buka `/dashboard` tanpa login (incognito) | Redirect ke `/login` | ☐ |
| 24 | Logout | Klik Logout di sidebar | Feedback modal muncul terlebih dahulu | ☐ |
| 25 | Logout confirm | Klik "Lewati" atau submit feedback | Redirect ke `/login`, session cleared | ☐ |
| 26 | JWT expired | Tunggu >1 jam atau clear cookies → akses API | 401 → redirect ke login | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 3: Dashboard Overview
## ═══════════════════════════════════════════════

| # | Test | Expected | Status |
|---|---|---|---|
| 27 | Dashboard load | `DashboardSkeleton` muncul sebentar → data loaded | ☐ |
| 28 | KPI cards | 4 cards: Total Konten, Caption, Terjadwal, Cache Hit | ☐ |
| 29 | Quota rings | 2 rings (daily + monthly) dengan progress | ☐ |
| 30 | Chart 7 hari | Bar chart tampil (empty OK kalau belum ada data) | ☐ |
| 31 | Chart 30 hari | Klik "30 Hari" → chart expand | ☐ |
| 32 | Refresh button | Klik ↺ → spinner → data refresh | ☐ |
| 33 | Recent contents | List 5 terbaru (atau EmptyState kalau kosong) | ☐ |
| 34 | "Buat Konten" CTA | Klik → navigate ke `/content/new` | ☐ |
| 35 | Onboarding checklist | Sidebar shows setup steps (first login) | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 4: Content Creator — Caption Generation
## ═══════════════════════════════════════════════

### 4.1 Input Modes

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 36 | Buka creator | `/content/new` | `CreatorSkeleton` → form loaded | ☐ |
| 37 | Tab Manual | Klik "Isi Manual" | Input fields: nama produk, harga, deskripsi | ☐ |
| 38 | Tab URL Scrape | Klik "Paste Link" | URL input field muncul | ☐ |
| 39 | Scrape Shopee | Paste URL Shopee produk → klik Scrape | Produk info auto-fill (nama, harga) | ☐ |
| 40 | Scrape gagal | URL invalid → scrape | Toast error "Gagal mengambil info produk" | ☐ |
| 41 | Tab Photo | Klik "Upload Foto" | Dropzone muncul | ☐ |
| 42 | Upload foto | Drag PNG ke dropzone | Preview foto muncul | ☐ |
| 43 | Remove.bg | Upload foto dengan background → tunggu | Background dihapus, before/after preview | ☐ |

### 4.2 Config Panel

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 44 | Brand Kit toggle | Toggle ON | Tone + bahasa auto-fill dari brand kit | ☐ |
| 45 | Platform selector | Pilih Instagram Feed | Platform terpilih, badge muncul | ☐ |
| 46 | Platform selector | Pilih TikTok | Switch ke TikTok style | ☐ |
| 47 | Content goal | Pilih "Flash Sale" | Goal terpilih | ☐ |
| 48 | Tone selector | Pilih "Hype 🔥" | Tone active | ☐ |
| 49 | Language | Pilih "ID Gaul" | Language active | ☐ |
| 50 | Variants slider | Set ke 5 | Slider menunjukkan 5 | ☐ |

### 4.3 Generate Caption

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 51 | Generate tanpa input | Klik "Generate Caption" dengan form kosong | Validation error "Nama produk wajib diisi" | ☐ |
| 52 | Generate valid | Isi nama produk → Generate | Loading spinner → 3 variants muncul | ☐ |
| 53 | Variant content | Lihat variant | Ada caption, hashtag, CTA | ☐ |
| 54 | Copy caption | Klik copy icon | Toast "Caption berhasil disalin!" | ☐ |
| 55 | Edit caption | Klik teks variant → edit | Inline editing aktif | ☐ |
| 56 | Save variant | Setelah edit → save | Toast "Tersimpan" | ☐ |
| 57 | Cache hit | Generate dengan input sama lagi | Response lebih cepat, `X-Cache-Source: semantic` | ☐ |
| 58 | Model check FREE | Generate dengan free account | Model gpt-4o-mini (check response header) | ☐ |
| 59 | Model check PRO | Generate dengan pro account | Model gpt-4o | ☐ |

### 4.4 Quota Enforcement

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 60 | Daily limit | Generate 4x dengan free account (limit=3) | 4th request → `QuotaExceededModal` | ☐ |
| 61 | Modal content | Lihat quota modal | Metric, used/limit, resetAt, upgrade CTA | ☐ |
| 62 | Upgrade CTA | Klik "Upgrade Sekarang" | Navigate ke `/settings/billing?upgrade=basic` | ☐ |
| 63 | Wait option | Klik "Tunggu reset kuota" | Modal close | ☐ |
| 64 | API header | Check response header | `X-Quota-Used`, `X-Quota-Limit`, `X-Quota-Remaining` | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 5: Image Generation (Async)
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 65 | Trigger image gen | Klik "Generate Gambar" | Job created, redirect `/jobs/[id]` | ☐ |
| 66 | Skeleton state | Halaman job | `SkeletonLoader` muncul saat pending | ☐ |
| 67 | Progress bar | Setelah QStash → Replicate | Progress bar + stage label (AI menggambar...) | ☐ |
| 68 | Estimated time | Lihat progress bar | "~8s lagi" countdown | ☐ |
| 69 | Auto preview | Job selesai | Gambar muncul otomatis tanpa refresh | ☐ |
| 70 | Download PNG | Klik "Download PNG" | File `beesell-image-*.png` ter-download | ☐ |
| 71 | Download sizes | Buka popover download | Full/Medium/Small options | ☐ |
| 72 | Save to library | Toggle "Simpan ke Library" → download | Gambar muncul di `/library` | ☐ |
| 73 | Job fail | Inject error di Replicate webhook | Error card dengan "Coba Lagi" button | ☐ |
| 74 | Deep link | Tutup job page → buka `/jobs/[id]` lagi | Status masih tersimpan | ☐ |
| 75 | FREE watermark | Generate image dengan free account | Gambar ada watermark "BeeSell AI ✨" pojok kanan | ☐ |
| 76 | PRO no watermark | Generate image dengan pro account | Gambar BERSIH tanpa watermark | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 6: Template Editor
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 77 | Gallery load | `/editor` | 10 template cards dengan SVG thumbnail | ☐ |
| 78 | Category filter | Klik "Instagram Feed" | Filter ke 3 templates IG Feed | ☐ |
| 79 | Search template | Ketik "flash" | Flash Sale template muncul | ☐ |
| 80 | Pilih template | Klik "Product Bold" | Editor terbuka, template ter-load | ☐ |
| 81 | Canvas render | Lihat editor | Template layers tampil di canvas | ☐ |
| 82 | Edit teks | Double-click teks di canvas | Inline editing aktif | ☐ |
| 83 | Drag element | Drag kotak/teks | Element pindah | ☐ |
| 84 | Undo | Ctrl+Z | Action di-undo | ☐ |
| 85 | Export | Klik Download | Canvas ter-export sebagai PNG 1080px | ☐ |
| 86 | Shopee banner | Pilih "Shopee Flash Sale" | Canvas 800×400 loaded | ☐ |
| 87 | Story template | Pilih "Story Gradient" | Canvas 1080×1920 loaded | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 7: Content Library
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 88 | Library load | `/library` | `LibrarySkeleton` → grid loaded | ☐ |
| 89 | Empty state | Library kosong | EmptyState "Belum ada konten" + CTA | ☐ |
| 90 | Grid view | Default | Card grid 3-4 kolom | ☐ |
| 91 | List view | Klik list icon | Baris tabel | ☐ |
| 92 | View persist | Switch list → refresh | Tetap list view (localStorage) | ☐ |
| 93 | Filter type | Klik "Caption" | Hanya caption ditampilkan | ☐ |
| 94 | Filter status | Klik "Siap" | Hanya status ready | ☐ |
| 95 | Filter platform | Klik "Instagram" | Hanya IG content | ☐ |
| 96 | URL params | Lihat browser URL setelah filter | `?type=caption&status=ready` di URL | ☐ |
| 97 | Back/Forward | Browser back → forward | Filter state preserved | ☐ |
| 98 | Infinite scroll | Scroll ke bawah (>20 items) | Load more otomatis | ☐ |
| 99 | Search | Ketik "tas wanita" | FTS results dengan highlight kuning | ☐ |
| 100 | Search Ctrl+K | Tekan Ctrl+K | Global search modal muncul | ☐ |
| 101 | Search arrow nav | ↑↓ di search modal | Highlight berpindah | ☐ |
| 102 | Search Enter | Enter pada hasil | Navigate ke content detail | ☐ |
| 103 | Search match type | Hasil search | Badge ⚡ FTS atau 〜 Fuzzy | ☐ |

### 7.1 Folder System

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 104 | Create folder | "+ Folder Baru" | Dialog muncul, isi nama + warna | ☐ |
| 105 | Color picker | Pilih warna hijau | Preview folder hijau | ☐ |
| 106 | Save folder | Submit form | Folder muncul di sidebar | ☐ |
| 107 | Max depth | Buat subfolder dalam subfolder | Error "Maximum 2 levels" | ☐ |
| 108 | Move content | Drag content card ke folder | Content pindah ke folder | ☐ |
| 109 | Filter by folder | Klik folder di sidebar | Hanya konten dalam folder tampil | ☐ |
| 110 | Breadcrumb | Masuk subfolder | Breadcrumb: Library > Produk > Musim Panas | ☐ |
| 111 | Rename folder | Right-click → Rename | Input field muncul, bisa ubah nama | ☐ |
| 112 | Delete folder | Right-click → Delete | Konfirmasi → folder hapus, content ke root | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 8: Scheduler
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 113 | Scheduler load | `/scheduler` | Week grid + library panel kiri | ☐ |
| 114 | Current time line | Grid | Garis biru di jam sekarang | ☐ |
| 115 | Week navigation | Klik → | Pindah ke minggu depan | ☐ |
| 116 | "Minggu Ini" button | Klik setelah navigasi | Kembali ke minggu ini | ☐ |
| 117 | Library panel | Lihat sidebar kiri | List konten status=ready | ☐ |
| 118 | Drag to slot | Drag konten ke slot Selasa 10:00 | Optimistic event muncul di grid | ☐ |
| 119 | DB check | Setelah drag | `scheduled_posts` row dengan status=queued | ☐ |
| 120 | Quick add | Klik slot kosong | Popover muncul dengan search | ☐ |
| 121 | Quick add search | Ketik nama konten | Hasil filter | ☐ |
| 122 | Quick add confirm | Pilih konten → Jadwalkan | Event muncul di slot | ☐ |
| 123 | Event resize | Drag handle bawah event | Event memanjang | ☐ |
| 124 | Event unschedule | Klik X pada event | Event hilang, konfirmasi | ☐ |
| 125 | Past slot drag | Drag ke slot hari lalu | Toast "Tidak bisa jadwalkan di waktu lampau" | ☐ |
| 126 | Platform badge | Lihat event card | Icon platform + color border | ☐ |
| 127 | Reschedule drag | Drag event ke slot lain | Event pindah, DB update | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 9: Platform Connections
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 128 | Connections page | `/settings/connections` | 3 platform cards (IG Feed, Reels, TikTok) | ☐ |
| 129 | Status badge | Sebelum connect | "Tidak Terhubung" abu | ☐ |
| 130 | Feature list | Lihat card | List fitur platform | ☐ |
| 131 | OAuth unavailable | `INSTAGRAM_CLIENT_ID` tidak diset | "Segera hadir" badge + "Minta Akses Manual" | ☐ |
| 132 | OAuth available | `INSTAGRAM_CLIENT_ID` diset | Tombol "Hubungkan Instagram" biru | ☐ |
| 133 | Expired token | Set `status=expired` di DB | Card merah, alert stripe, "Sambungkan Ulang" | ☐ |
| 134 | Expiring soon | Set `token_expires_at = NOW() + 5 days` | Warning kuning "Token habis dalam 5 hari" | ☐ |
| 135 | Disconnect confirm | Klik Disconnect → "Yakin?" muncul | Confirm dialog | ☐ |
| 136 | Disconnect confirm Yes | Klik "Ya, Disconnect" | Status kembali disconnected, token cleared | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 10: Brand Kit
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 137 | Brand kit page | `/settings/brand-kit` | List panel kiri + form kanan | ☐ |
| 138 | Create kit | Klik "+ Brand Kit Baru" | Editor panel terbuka | ☐ |
| 139 | Edit nama | Ketik nama brand kit | Field editable | ☐ |
| 140 | Color picker | Klik Primary color swatch | Color input + hex field | ☐ |
| 141 | Real-time preview | Ganti warna → tanpa save | Mini preview update langsung | ☐ |
| 142 | Font selector | Pilih Poppins | Preview font berubah | ☐ |
| 143 | Save kit | Klik Save | Toast "Tersimpan" | ☐ |
| 144 | Set default | Klik "Jadikan Default" (star icon) | Star kuning, "Default" badge | ☐ |
| 145 | Apply to creator | Buka `/content/new` | BrandKitSelector di atas ConfigPanel | ☐ |
| 146 | Brand kit ON | Toggle ON | Tone + bahasa dari kit otomatis | ☐ |
| 147 | Brand kit OFF | Toggle OFF | Revert ke sebelumnya | ☐ |
| 148 | Switch kit | Pilih kit lain dari dropdown | Tone berubah ke kit baru | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 11: Notifications
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 149 | Bell icon | Lihat TopBar | Bell icon ada | ☐ |
| 150 | Bell click | Klik bell | Dropdown terbuka | ☐ |
| 151 | Request permission | Klik "Aktifkan Notifikasi" | Browser permission dialog | ☐ |
| 152 | Permission granted | Allow | Bell icon jadi biru dengan dot hijau | ☐ |
| 153 | Permission denied | Deny | "Notifikasi diblokir" message | ☐ |
| 154 | Prefs toggle | Toggle "Post berhasil" ON/OFF | Save ke DB | ☐ |
| 155 | Test push | `POST /api/notifications/send { type: "publish_success" }` | Push notification di browser | ☐ |
| 156 | Test email | `POST /api/notifications/send { type: "publish_failed" }` | Email masuk ke inbox dengan template | ☐ |
| 157 | Email template | Buka email "Post Gagal" | HTML template dengan link retry | ☐ |
| 158 | Foreground toast | Trigger notif saat app open | Toast card di bottom-right | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 12: Publish Engine (Cron)
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 159 | Create scheduled post | `POST /api/scheduled-posts` dengan scheduledAt=now+2min | `{ id, status: "queued" }` | ☐ |
| 160 | DB check | Supabase → scheduled_posts | Row dengan status=queued | ☐ |
| 161 | Manual trigger | `POST /api/cron/publish` dengan CRON_SECRET header | `{ processed: 1, published: 1 }` | ☐ |
| 162 | Published status | DB check setelah trigger | status=published, published_at set | ☐ |
| 163 | Content sync | Check contents table | status=published | ☐ |
| 164 | Retry on fail | Set fake token → trigger | retry_count++, next_retry_at set | ☐ |
| 165 | Max retry | Trigger 3x dengan fake token | status=failed setelah 3x | ☐ |
| 166 | Fatal error | Code 190 (token expired) | status=failed LANGSUNG tanpa retry | ☐ |
| 167 | Cancel post | `DELETE /api/scheduled-posts/[id]` | status=canceled, content kembali ready | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 13: Mobile Responsive
## ═══════════════════════════════════════════════

Test di mobile viewport (375px lebar) atau DevTools device mode:

| # | Test | Expected | Status |
|---|---|---|---|
| 168 | Bottom nav muncul | < 768px | 5 item: Dashboard, Library, [+], Template, Settings | ☐ |
| 169 | Sidebar hidden | Mobile | Sidebar tidak tampil (overlay drawer) | ☐ |
| 170 | Hamburger | Tap ☰ di TopBar | Drawer sidebar slide in | ☐ |
| 171 | Backdrop tap | Tap backdrop | Drawer close | ☐ |
| 172 | FAB button | Tap [+] di bottom nav | Navigate ke `/content/new` | ☐ |
| 173 | Touch targets | Tap semua nav items | Area tap ≥ 44px (tidak missed tap) | ☐ |
| 174 | Library grid | Lihat library mobile | 2 kolom grid | ☐ |
| 175 | Creator form | Buka `/content/new` mobile | Form 1 kolom, tidak overflow | ☐ |
| 176 | Template gallery | Buka `/editor` mobile | 2 kolom template cards | ☐ |
| 177 | Dashboard KPI | Dashboard mobile | 2 kolom (bukan 4) | ☐ |
| 178 | iOS safe area | iPhone dengan home bar | Bottom nav tidak overlapping | ☐ |
| 179 | Input zoom | Tap email input iOS | NO auto-zoom (font-size: 16px) | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 14: NPS Survey & Feedback
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 180 | NPS D+3 | Manipulasi `onboarding_progress.created_at = NOW()-3days` | NPS modal muncul setelah 10 detik | ☐ |
| 181 | NPS score | Klik angka 9 | Score selected, step ke "reason" | ☐ |
| 182 | NPS submit | Isi reason → Kirim | DB: nps_responses row | ☐ |
| 183 | NPS no repeat | Refresh → tunggu 10s | Modal TIDAK muncul lagi (already answered) | ☐ |
| 184 | Feedback button | Klik 💬 floating button | Modal feedback terbuka | ☐ |
| 185 | Feedback types | Switch Bug/Fitur/Umum | Tab type berubah | ☐ |
| 186 | Submit feedback | Isi pesan → Kirim | "Terima kasih!" → modal close | ☐ |
| 187 | DB check | Supabase → feedback table | Row dengan message | ☐ |
| 188 | Logout feedback | Logout | "Sebelum kamu pergi..." modal | ☐ |
| 189 | Star rating | Klik 4 bintang | 4 bintang selected | ☐ |
| 190 | Logout skip | Klik "Lewati" | Logout proceed | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 15: Plan Enforcement
## ═══════════════════════════════════════════════

| # | Test | Action | Expected | Status |
|---|---|---|---|---|
| 191 | Free plan badge | Dashboard | "free" badge di header | ☐ |
| 192 | Quota rings free | Lihat rings | Daily: X/3, Monthly: X/50 | ☐ |
| 193 | Daily limit 3 | Generate 3 caption hari ini | 4th → modal | ☐ |
| 194 | Monthly limit 50 | (Simulasi) Redis set quota:x:caption:monthly:YYYY-MM = 50 | Generate → modal dengan reset date bulan depan | ☐ |
| 195 | Image gen blocked | Free account → coba generate image | 403 "Fitur ini tidak tersedia di plan kamu" | ☐ |
| 196 | Template editor free | Free account → `/editor` | Blocked atau watermark warning? (per plan definition) | ☐ |
| 197 | Pro plan features | PRO_USER → generate image | Berhasil tanpa blocking | ☐ |
| 198 | Pro no watermark | PRO_USER → generate image | Gambar tanpa watermark | ☐ |
| 199 | Quota header | Check response header | `X-Plan: free` atau `X-Plan: pro` | ☐ |
| 200 | Rollback | Force error mid-generation | Quota tidak increment | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 16: SEO & Performance
## ═══════════════════════════════════════════════

| # | Test | Tool | Expected | Status |
|---|---|---|---|---|
| 201 | Page title | Browser tab di `/` | "BeeSell AI — Caption Generator untuk Seller Indonesia" | ☐ |
| 202 | Meta description | View source `/` | `<meta name="description" ...>` ada dan relevan | ☐ |
| 203 | OG tags | View source `/` | og:title, og:image, og:description semua ada | ☐ |
| 204 | Twitter card | cardvalidator.twitter.com | "summary_large_image" card tampil | ☐ |
| 205 | Structured data | search.google.com/test/rich-results | SoftwareApplication valid | ☐ |
| 206 | Security headers | `curl -I https://beesell.id` | X-Content-Type-Options, X-Frame-Options ada | ☐ |
| 207 | Cache static | DevTools Network → `_next/static/*.js` | `cache-control: max-age=31536000, immutable` | ☐ |
| 208 | First Load JS | `npm run build` output | `< 130 KB` untuk route `/` | ☐ |
| 209 | Route prefetch | Dashboard → hover "Library" link | Network shows prefetch request | ☐ |
| 210 | Image AVIF | DevTools Network → filter Image | `.avif` format dimuat (bukan jpg) | ☐ |

---

## ═══════════════════════════════════════════════
## FLOW 17: Error States & Edge Cases
## ═══════════════════════════════════════════════

| # | Test | How to trigger | Expected | Status |
|---|---|---|---|---|
| 211 | Global error boundary | Throw error di dashboard component | Error boundary page dengan retry button | ☐ |
| 212 | Network offline | DevTools → Network → Offline → generate | Toast "Koneksi internet bermasalah" | ☐ |
| 213 | Slow network | DevTools → Slow 3G | Skeleton loaders semua tampil | ☐ |
| 214 | 500 from API | Break DB connection → API call | Toast "Terjadi kesalahan server" | ☐ |
| 215 | Empty search | Search dengan query tidak ada hasil | EmptyState "Tidak ada hasil" | ☐ |
| 216 | Invalid URL params | `/library?type=invalid` | Graceful ignore, show all | ☐ |
| 217 | Large image upload | Upload foto > 10MB | Error "Ukuran file terlalu besar" | ☐ |
| 218 | Rate limit | Spam request cepat | 429 toast "Terlalu banyak request" | ☐ |

---

## ═══════════════════════════════════════════════
## POST-TEST: Database Integrity Check
## ═══════════════════════════════════════════════

Jalankan query berikut di Supabase SQL Editor:

```sql
-- Check semua foreign keys valid
SELECT conrelid::regclass AS table, conname AS constraint
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid IN (
    'contents'::regclass, 'scheduled_posts'::regclass,
    'folders'::regclass, 'brand_kits'::regclass
  )
ORDER BY table;

-- Check no orphaned contents
SELECT COUNT(*) AS orphaned
FROM contents c
WHERE c.tenant_id NOT IN (SELECT id FROM tenants);

-- Check quota tidak negatif
-- (Supabase → Upstash Redis UI → scan quota:*)

-- Check scheduled_posts tidak stuck di processing
SELECT id, status, last_attempted_at
FROM scheduled_posts
WHERE status = 'processing'
  AND last_attempted_at < NOW() - INTERVAL '5 minutes';
-- Ini harus kosong! Kalau ada, reset manual:
-- UPDATE scheduled_posts SET status='queued' WHERE ...;

-- Onboarding funnel
SELECT
  COUNT(*) AS registered,
  SUM(CASE WHEN step_first_gen THEN 1 END) AS generated_first_caption,
  ROUND(SUM(CASE WHEN step_first_gen THEN 1 END)::NUMERIC/COUNT(*)*100,1) AS activation_rate
FROM onboarding_progress;
```

---

## ═══════════════════════════════════════════════
## CHECKLIST SUMMARY
## ═══════════════════════════════════════════════

Setelah semua test:

```
Flow 1: Landing & Register      ___/19  [ ]
Flow 2: Auth & Session          ___/7   [ ]
Flow 3: Dashboard               ___/9   [ ]
Flow 4: Caption Generation      ___/28  [ ]
Flow 5: Image Generation        ___/12  [ ]
Flow 6: Template Editor         ___/11  [ ]
Flow 7: Content Library         ___/25  [ ]
Flow 8: Scheduler               ___/15  [ ]
Flow 9: Platform Connections    ___/9   [ ]
Flow 10: Brand Kit              ___/12  [ ]
Flow 11: Notifications          ___/10  [ ]
Flow 12: Publish Engine         ___/9   [ ]
Flow 13: Mobile Responsive      ___/12  [ ]
Flow 14: NPS & Feedback         ___/11  [ ]
Flow 15: Plan Enforcement       ___/10  [ ]
Flow 16: SEO & Performance      ___/10  [ ]
Flow 17: Error States           ___/8   [ ]

TOTAL: ___/218 tests passed

BLOCKER bugs (must fix before beta): ___
MINOR bugs (can fix post-beta):      ___
```

## Kriteria Deploy

✅ **GO: Deploy ke beta** kalau:
- Flow 1-5 (core flows): semua PASS
- Flow 13 (mobile): ≥ 80% PASS
- Tidak ada BLOCKER di Flow 4 (quota), Flow 5 (image), Flow 12 (publish)

⛔ **HOLD: Jangan deploy** kalau:
- Login/register broken
- Caption generation tidak bisa jalan
- Quota tidak ter-enforce (user bisa unlimited)
- Crash di mobile Chrome

## Bug Report Template

```
[BUG] #XX
Flow: [nomor flow]
Test: [nomor test]
Severity: BLOCKER / HIGH / MEDIUM / LOW
Steps:
1. ...
2. ...
3. ...
Expected: ...
Actual: ...
Screenshot: (attach)
```