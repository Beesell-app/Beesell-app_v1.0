// apps/web-app/scripts/generate-invite-codes.ts
// ── Generate beta invite codes ────────────────────────────────
// Usage:
//   npx tsx scripts/generate-invite-codes.ts --count 50 --max-uses 1 --label "Beta Batch 1"
//   npx tsx scripts/generate-invite-codes.ts --count 10 --max-uses 5 --expires 2026-06-01

import { PrismaClient } from '@prisma/client'
import { randomBytes }  from 'crypto'

const db = new PrismaClient()

// Parse CLI args
const args = process.argv.slice(2)
function arg(name: string, def: string = ''): string {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 ? args[idx + 1] : def
}

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // no confusing chars (0/O/I/1)
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

async function main() {
  const count    = parseInt(arg('count', '50'))
  const maxUses  = parseInt(arg('max-uses', '1'))
  const label    = arg('label', `Beta Batch — ${new Date().toLocaleDateString('id-ID')}`)
  const expires  = arg('expires', '')
  const plan     = arg('plan', 'basic')
  const prefix   = arg('prefix', 'BSAI')   // e.g. BSAI-XXXX

  console.log(`\n🐝 BeeSell AI — Generate Invite Codes`)
  console.log(`══════════════════════════════════════`)
  console.log(`  Count:    ${count}`)
  console.log(`  Max uses: ${maxUses} per code`)
  console.log(`  Label:    ${label}`)
  console.log(`  Plan:     ${plan}`)
  console.log(`  Expires:  ${expires || 'Never'}`)
  console.log(`══════════════════════════════════════\n`)

  const codes: string[] = []
  const created: string[] = []

  for (let i = 0; i < count; i++) {
    let code: string
    let attempts = 0

    // Generate unique code
    do {
      const random = generateCode(6)
      code = prefix ? `${prefix}-${random}` : random
      attempts++
      if (attempts > 10) throw new Error('Cannot generate unique code')
    } while (codes.includes(code))

    codes.push(code)
  }

  // Bulk insert
  let successCount = 0
  for (const code of codes) {
    try {
      await db.$executeRaw`
        INSERT INTO invite_codes (code, label, max_uses, expires_at, plan_granted, is_active)
        VALUES (
          ${code},
          ${label},
          ${maxUses},
          ${expires ? new Date(expires) : null}::timestamptz,
          ${plan},
          TRUE
        )
        ON CONFLICT (code) DO NOTHING
      `
      created.push(code)
      successCount++
    } catch (err: any) {
      console.error(`  ✗ Failed to insert ${code}: ${err.message}`)
    }
  }

  console.log(`✓ Created ${successCount}/${count} codes:\n`)
  created.forEach((c, i) => console.log(`  ${String(i + 1).padStart(2, '0')}. ${c}`))

  // Save to file
  const outFile = `invite-codes-${Date.now()}.txt`
  const fs = await import('fs/promises')
  await fs.writeFile(
    outFile,
    [
      `BeeSell AI Beta Invite Codes`,
      `Generated: ${new Date().toISOString()}`,
      `Label: ${label}`,
      `Max uses per code: ${maxUses}`,
      `Plan: ${plan}`,
      `Expires: ${expires || 'Never'}`,
      ``,
      ...created,
    ].join('\n'),
    'utf-8',
  )

  console.log(`\n✓ Saved to ${outFile}`)
  console.log('\nShare these codes with your beta users.')
  console.log('Register URL: https://beesell.id/register?invite=CODE\n')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => db.$disconnect())