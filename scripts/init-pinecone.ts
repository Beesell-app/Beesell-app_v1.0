// apps/web-app/scripts/init-pinecone.ts
// ── Pinecone index initialization (one-time setup) ────────────
// Usage: npx tsx scripts/init-pinecone.ts
//
// Bikin Pinecone index dengan config yang sesuai untuk semantic cache.
import { Pinecone } from '@pinecone-database/pinecone'

const INDEX_NAME      = process.env.PINECONE_INDEX_NAME ?? 'beesell-cache'
const EMBEDDING_DIM   = 1536    // text-embedding-3-small dimension
const POD_TYPE        = 'serverless'
const CLOUD           = 'aws'
const REGION          = 'us-east-1'  // serverless tier region

async function main() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('✗ PINECONE_API_KEY not set in .env')
    process.exit(1)
  }

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  console.log(`\n🌲 Pinecone Index Setup`)
  console.log(`═══════════════════════════════════════`)
  console.log(`  Name:      ${INDEX_NAME}`)
  console.log(`  Dimension: ${EMBEDDING_DIM}`)
  console.log(`  Metric:    cosine`)
  console.log(`  Type:      ${POD_TYPE}`)
  console.log(`  Cloud:     ${CLOUD} ${REGION}`)
  console.log(`═══════════════════════════════════════\n`)

  // Check if index exists
  const indexes = await pc.listIndexes()
  const exists  = indexes.indexes?.some(i => i.name === INDEX_NAME)

  if (exists) {
    console.log(`✓ Index "${INDEX_NAME}" already exists`)

    const desc = await pc.describeIndex(INDEX_NAME)
    console.log(`\nIndex details:`)
    console.log(`  Status:    ${desc.status?.ready ? 'ready' : 'not ready'}`)
    console.log(`  Host:      ${desc.host}`)
    console.log(`  Dimension: ${desc.dimension}`)

    const index = pc.index(INDEX_NAME)
    const stats = await index.describeIndexStats()
    console.log(`\nStats:`)
    console.log(`  Total vectors: ${stats.totalRecordCount ?? 0}`)
    console.log(`  Index fullness: ${((stats.indexFullness ?? 0) * 100).toFixed(2)}%`)

    process.exit(0)
  }

  console.log(`Creating index "${INDEX_NAME}"...`)

  await pc.createIndex({
    name:      INDEX_NAME,
    dimension: EMBEDDING_DIM,
    metric:    'cosine',
    spec: {
      serverless: {
        cloud:  CLOUD,
        region: REGION,
      },
    },
  })

  console.log(`⏳ Waiting for index to be ready...`)

  // Poll until ready (max 60 detik)
  const startAt = Date.now()
  while (Date.now() - startAt < 60_000) {
    const desc = await pc.describeIndex(INDEX_NAME)
    if (desc.status?.ready) {
      console.log(`\n✓ Index ready! Host: ${desc.host}`)
      console.log(`\nNext steps:`)
      console.log(`  1. Update .env dengan PINECONE_INDEX_NAME=${INDEX_NAME}`)
      console.log(`  2. Restart dev server`)
      console.log(`  3. Cek cache stats di /api/admin/cache-stats (kalau dibuat)`)
      process.exit(0)
    }
    await new Promise(r => setTimeout(r, 3000))
  }

  console.error(`✗ Timeout: index masih belum ready setelah 60 detik`)
  console.error(`  Cek manual di https://app.pinecone.io`)
  process.exit(1)
}

main().catch(err => {
  console.error('✗ Error:', err)
  process.exit(1)
})