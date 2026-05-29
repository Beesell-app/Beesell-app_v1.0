# Product URL Scraper — Setup Guide

## Arsitektur strategi

```
POST /api/scrape/product { url }
  ↓
[1] parseProductUrl() — detect marketplace
    └─ unknown?  → fallback: manual_required
  ↓
[2] Redis cache lookup (TTL 24 jam)
    └─ hit?      → return cached (0 cost, ~50ms)
  ↓
[3] Strategy chain
    ├─ Tokopedia/Blibli  → Cheerio first, Firecrawl fallback
    └─ Shopee/Lazada     → Firecrawl direct (Cheerio pasti gagal)
  ↓
[4] Cheerio (gratis, ~2 detik)
    ├─ sukses + data lengkap → cache + return
    └─ gagal/incomplete     → fallthrough
  ↓
[5] Firecrawl (~$0.008, ~4-8 detik)
    ├─ sukses  → cache + return
    └─ gagal   → fallback: manual_required
  ↓
[6] Frontend tampil form manual kalau fallback
```

## Install dependencies

```bash
cd apps/web-app
npm install cheerio @upstash/ratelimit @upstash/redis
```

Firecrawl tidak butuh SDK — pakai `fetch()` langsung karena API-nya simple.

## Environment variables

```bash
# .env.local + Vercel env vars
FIRECRAWL_API_KEY=fc-xxxxx               # dari firecrawl.dev dashboard
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
```

Daftar Firecrawl:
1. https://firecrawl.dev → Sign up
2. Free tier: 500 credits (cukup untuk testing)
3. Hobby plan: $19/mo = 3,000 credits
4. Copy API key dari dashboard

## File structure

```
apps/web-app/
├── lib/scraper/
│   ├── types.ts               ← Shared types
│   ├── url-parser.ts          ← Marketplace detection + URL parsing
│   ├── firecrawl.ts           ← Firecrawl API wrapper
│   ├── cheerio-fallback.ts    ← Lightweight Cheerio scraper
│   └── index.ts               ← Main orchestrator
├── lib/hooks/
│   └── useScrapeProduct.ts    ← React hook untuk frontend
├── components/scraper/
│   └── ProductUrlInput.tsx    ← UI dengan manual fallback
└── app/api/scrape/product/
    └── route.ts               ← API endpoint
```

## Cost analysis (per 1000 scrapes)

### Tanpa cache:
| Marketplace | Strategi | Cost |
|---|---|---|
| Shopee | Firecrawl stealth (5 credits) | $40 |
| Tokopedia | Cheerio 80% + Firecrawl 20% | $1.6 |
| Lazada | Firecrawl basic | $8 |
| Blibli | Cheerio 70% + Firecrawl 30% | $2.4 |

### Dengan Redis cache (TTL 24 jam):
Asumsi 40% cache hit → **effective cost drop 40%**.
- Shopee 1000 scrapes unique = $40; dengan cache = $24
- Tokopedia 1000 unique = $1.6; dengan cache = $0.96

### Pricing dampak ke user:
- Free plan: 3 scrape/hari × 30 hari = 90 scrape × rata-rata $0.01 = $0.90/user/bulan COGS
- Masih sustainable meski free

## Testing

### Unit test — URL parser

```typescript
// __tests__/scraper-url-parser.test.ts
import { parseProductUrl, detectMarketplace } from '@/lib/scraper/url-parser'

test('shopee URL', () => {
  const result = parseProductUrl('https://shopee.co.id/Tas-Keren-i.123.456')
  expect(result.valid).toBe(true)
  expect(result.marketplace).toBe('shopee')
  expect(result.productId).toBe('456')
})

test('tokopedia URL', () => {
  const result = parseProductUrl('https://www.tokopedia.com/tokokeren/tas-wanita')
  expect(result.valid).toBe(true)
  expect(result.marketplace).toBe('tokopedia')
})

test('invalid URL', () => {
  expect(parseProductUrl('not-a-url').valid).toBe(false)
  expect(parseProductUrl('https://random-site.com').marketplace).toBe('unknown')
})
```

### Manual test URLs

```bash
# Tokopedia (Cheerio biasanya berhasil)
curl -X POST http://localhost:3000/api/scrape/product \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.tokopedia.com/some-shop/some-product"}'

# Shopee (Firecrawl wajib)
curl -X POST http://localhost:3000/api/scrape/product \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://shopee.co.id/Product-Name-i.123.456"}'

# Invalid URL (fallback manual)
curl -X POST http://localhost:3000/api/scrape/product \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
# Expected: { success: false, fallback: "manual_required", ... }
```

### Expected response shapes

**Success (Tokopedia via Cheerio):**
```json
{
  "success": true,
  "data": {
    "name":         "Tas Wanita Kulit Premium",
    "price":        "299000",
    "priceNumeric": 299000,
    "description":  "Material kulit asli...",
    "images":       ["https://images.tokopedia.net/..."],
    "marketplace":  "tokopedia",
    "url":          "https://www.tokopedia.com/...",
    "sellerName":   "TokoKeren",
    "rating":       4.8,
    "strategy":     "cheerio",
    "elapsedMs":    2340
  }
}
```

**Fallback (Shopee blocked):**
```json
{
  "success":  false,
  "fallback": "manual_required",
  "error":    "blocked",
  "message":  "Marketplace memblokir akses. Silakan input produk manual."
}
```

## Frontend integration

```tsx
import { ProductUrlInput } from '@/components/scraper/ProductUrlInput'

function CaptionGeneratorForm() {
  const handleProductConfirm = (product) => {
    // product: { name, price, description, images, sourceUrl?, marketplace? }
    // Lalu kirim ke /api/generate/text dengan product data
    await generate({
      productName:     product.name,
      productPrice:    product.price,
      productBenefits: product.description,
      // ...
    })
  }

  return <ProductUrlInput onConfirm={handleProductConfirm} />
}
```

## Troubleshooting

### Shopee selalu return `blocked`

Normal — Shopee anti-bot sangat agresif. Pastikan:
1. `FIRECRAWL_API_KEY` valid
2. Firecrawl plan support stealth proxy (Hobby plan $19+)
3. Jangan burst request dari IP sama

### Tokopedia Cheerio gagal parse

Cheerio rely pada JSON-LD + OG meta. Jika Tokopedia ubah HTML:
1. Cek `html` response dari fetch manual
2. Update selector di `cheerio-fallback.ts`
3. Atau biarkan fallthrough ke Firecrawl

### Firecrawl credit habis cepat

Check Firecrawl dashboard untuk usage breakdown:
- Stealth mode = 5 credits per scrape
- Basic mode = 1 credit
- LLM extract = +1 credit

Optimasi:
- Prefer Cheerio dulu untuk marketplace non-Shopee
- Cache agresif (TTL 24 jam sudah ok untuk MVP)
- Rate limit 20/menit mencegah abuse

### Rate limited meski belum banyak request

Cek rate limit key: pakai `user.id` bukan `tenant.id` — 1 user dapat 20 scrape/menit. Kalau tim butuh lebih, ganti ke `tenant.id`.