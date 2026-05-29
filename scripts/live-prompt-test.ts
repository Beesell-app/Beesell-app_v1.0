// apps/web-app/scripts/live-prompt-test.ts
// ── LIVE PROMPT QUALITY TEST ──────────────────────────────────
// Call OpenAI beneran untuk validasi kualitas output
// Butuh OPENAI_API_KEY di env
//
// Usage:
//   npx tsx scripts/live-prompt-test.ts
//   npx tsx scripts/live-prompt-test.ts --scenario 3
//   npx tsx scripts/live-prompt-test.ts --all
//
// Output: hasil generate setiap scenario → saved ke test-results.json
import { generateText } from 'ai'
import { openai }        from '@ai-sdk/openai'
import { CaptionPromptParams, SYSTEM_PROMPT, buildCaptionPrompt, parseGenerationOutput } from '../lib/ai/prompts'
import { writeFile }     from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

// ── Test scenarios covering real-world Indonesian seller cases ──
const SCENARIOS = [
  // ── Fashion ──
  {
    id: 'fashion-1',
    name: 'Tas wanita casual Instagram',
    params: {
      productName:     'Tas Selempang Kulit Sintetis',
      productPrice:    'Rp 149.000',
      productBenefits: 'Bahan kulit sintetis premium, muat HP + dompet + makeup, strap panjang adjustable',
      targetAudience:  'wanita usia 20-30 tahun, suka fashion casual',
      tone:            'casual',
      language:        'indonesian_casual',
      emoji:           'moderate',
      ctaStyle:        'medium',
      platform:        'instagram',
      variants:        3,
    },
  },
  {
    id: 'fashion-2',
    name: 'Sepatu sneaker hype TikTok',
    params: {
      productName:     'Sneakers Putih Classic',
      productPrice:    'Rp 249.000',
      productBenefits: 'Desain minimalis, cocok OOTD, material kanvas breathable',
      tone:            'energetic',
      language:        'mixed_english',
      emoji:           'heavy',
      ctaStyle:        'aggressive',
      platform:        'tiktok',
      variants:        3,
    },
  },
  {
    id: 'fashion-3',
    name: 'Dress pesta luxury Shopee',
    params: {
      productName:     'Dress Malam Satin Premium',
      productPrice:    'Rp 899.000',
      productBenefits: 'Material satin halus, cutting flattering, cocok untuk event formal',
      tone:            'luxury',
      language:        'indonesian_formal',
      emoji:           'none',
      ctaStyle:        'soft',
      platform:        'shopee',
      variants:        3,
    },
  },

  // ── Beauty ──
  {
    id: 'beauty-1',
    name: 'Skincare serum Instagram authoritative',
    params: {
      productName:     'Niacinamide Serum 10%',
      productPrice:    'Rp 89.000',
      productBenefits: 'Mengurangi pori, bekas jerawat, hasil dalam 2 minggu. BPOM approved',
      targetAudience:  'wanita dengan masalah jerawat',
      tone:            'authoritative',
      language:        'indonesian_casual',
      emoji:           'minimal',
      ctaStyle:        'medium',
      platform:        'instagram',
      variants:        3,
    },
  },
  {
    id: 'beauty-2',
    name: 'Lipstik playful TikTok',
    params: {
      productName:     'Matte Lip Cream Peach Glow',
      productPrice:    'Rp 39.000',
      productBenefits: 'Warna long lasting 8 jam, non-drying, 6 shades nude',
      tone:            'playful',
      language:        'indonesian_casual',
      emoji:           'heavy',
      ctaStyle:        'medium',
      platform:        'tiktok',
      variants:        3,
    },
  },

  // ── F&B ──
  {
    id: 'food-1',
    name: 'Sambal friendly WhatsApp',
    params: {
      productName:     'Sambal Bawang Bu Tini',
      productPrice:    'Rp 45.000',
      productBenefits: 'Homemade, tanpa pengawet, pedas level 3, tahan 2 minggu di kulkas',
      tone:            'friendly',
      language:        'indonesian_casual',
      emoji:           'moderate',
      ctaStyle:        'medium',
      platform:        'whatsapp',
      variants:        2,
    },
  },
  {
    id: 'food-2',
    name: 'Kopi specialty professional Tokopedia',
    params: {
      productName:     'Arabica Gayo Roasted Beans 250g',
      productPrice:    'Rp 125.000',
      productBenefits: 'Single origin Aceh, medium roast, notes cokelat & karamel, roasted fresh weekly',
      tone:            'professional',
      language:        'indonesian_formal',
      emoji:           'minimal',
      ctaStyle:        'medium',
      platform:        'tokopedia',
      variants:        3,
    },
  },

  // ── Electronics ──
  {
    id: 'electronics-1',
    name: 'Powerbank energetic TikTok Shop',
    params: {
      productName:     'Powerbank 20000mAh Fast Charging',
      productPrice:    'Rp 199.000',
      productBenefits: '20000mAh real capacity, PD 22.5W fast charge, bisa charge laptop, 2 USB + 1 Type-C',
      tone:            'energetic',
      language:        'indonesian_casual',
      emoji:           'heavy',
      ctaStyle:        'aggressive',
      platform:        'tiktok_shop',
      variants:        3,
    },
  },

  // ── Edge cases ──
  {
    id: 'edge-1',
    name: 'No price + 1 variant only',
    params: {
      productName:     'Bouquet Bunga Segar',
      tone:            'friendly',
      language:        'indonesian_casual',
      emoji:           'moderate',
      ctaStyle:        'soft',
      platform:        'instagram',
      variants:        1,
    },
  },
  {
    id: 'edge-2',
    name: 'Max 5 variants on threads',
    params: {
      productName:     'Buku Self Improvement Bestseller',
      productPrice:    'Rp 79.000',
      productBenefits: '200 halaman, full Bahasa Indonesia, cocok untuk pemula',
      tone:            'authoritative',
      language:        'indonesian_casual',
      emoji:           'minimal',
      ctaStyle:        'soft',
      platform:        'threads',
      variants:        5,
    },
  },
]

// ══════════════════════════════════════════════════════════════
// TEST RUNNER
// ══════════════════════════════════════════════════════════════
interface TestResult {
  id:         string
  name:       string
  params:     any
  success:    boolean
  variants:   any[]
  error?:     string
  duration:   number
  tokensUsed: number
  cost_usd:    number
}

async function runScenario(scenario: typeof SCENARIOS[0]): Promise<TestResult> {
  const startedAt = Date.now()

  try {
    console.log(`\n🧪 ${scenario.id}: ${scenario.name}`)
    console.log(`   Platform: ${scenario.params.platform} | Tone: ${scenario.params.tone} | Variants: ${scenario.params.variants}`)

    const userPrompt = buildCaptionPrompt(scenario.params as CaptionPromptParams)

    const result = await generateText({
      model:       openai('gpt-4o-mini'),   // pakai cheap model untuk test
      system:      SYSTEM_PROMPT,
      prompt:      userPrompt,
      temperature: 0.85,
      maxOutputTokens:   2000,
    })

    const variants = parseGenerationOutput(result.text)

    // Validasi hasil
    if (variants.length === 0) {
      throw new Error('No variants parsed from output')
    }

    // Validasi hashtag sesuai platform
    const platform = scenario.params.platform
    if (['shopee', 'tokopedia', 'whatsapp'].includes(platform)) {
      const hasHashtags = variants.some(v => v.hashtags.length > 0)
      if (hasHashtags) {
        console.warn(`   ⚠️  Platform ${platform} seharusnya tidak pakai hashtag, tapi ada`)
      }
    }

    const duration   = Date.now() - startedAt
    const tokensUsed = (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0)
    const cost_usd    = (result.usage?.inputTokens ?? 0) / 1_000_000 * 0.15
                     + (result.usage?.outputTokens ?? 0) / 1_000_000 * 0.60

    // Log sample output
    console.log(`   ✓ Success in ${duration}ms | ${variants.length} variants | ${tokensUsed} tokens`)
    console.log(`   Sample var 1:`)
    console.log(`     Caption:  ${variants[0].caption.slice(0, 100)}...`)
    console.log(`     Hashtags: ${variants[0].hashtags.slice(0, 5).join(', ')} (${variants[0].hashtags.length} total)`)
    console.log(`     CTA:      ${variants[0].cta}`)

    return {
      id:       scenario.id,
      name:     scenario.name,
      params:   scenario.params,
      success:  true,
      variants,
      duration,
      tokensUsed,
      cost_usd,
    }

  } catch (err: any) {
    const duration = Date.now() - startedAt
    console.error(`   ✗ Failed: ${err.message}`)

    return {
      id:         scenario.id,
      name:       scenario.name,
      params:     scenario.params,
      success:    false,
      variants:   [],
      error:      err.message,
      duration,
      tokensUsed: 0,
      cost_usd:    0,
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  BeeSell AI — Live Prompt Quality Test')
  console.log(`  Total scenarios: ${SCENARIOS.length}`)
  console.log('═══════════════════════════════════════════════════════')

  const results: TestResult[] = []

  for (const scenario of SCENARIOS) {
    const result = await runScenario(scenario)
    results.push(result)

    // Rate limit: delay 1 detik antar request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // ── Summary ──
  const passed      = results.filter(r => r.success).length
  const failed      = results.filter(r => !r.success).length
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0)
  const totalCost   = results.reduce((sum, r) => sum + r.cost_usd, 0)
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  ✓ Passed     : ${passed} / ${results.length}`)
  console.log(`  ✗ Failed     : ${failed} / ${results.length}`)
  console.log(`  ⏱  Avg time   : ${Math.round(avgDuration)}ms`)
  console.log(`  🔤 Tokens    : ${totalTokens.toLocaleString()}`)
  console.log(`  💰 Cost      : $${totalCost.toFixed(4)}`)

  // Save results
  if (!existsSync('test-results')) mkdirSync('test-results')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath   = `test-results/prompt-test-${timestamp}.json`

  await writeFile(outPath, JSON.stringify({
    timestamp:  new Date().toISOString(),
    scenarios:  results.length,
    passed, failed,
    totalTokens, totalCost,
    avgDuration,
    results,
  }, null, 2))

  console.log(`\n  📄 Results saved to: ${outPath}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // Exit code
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})