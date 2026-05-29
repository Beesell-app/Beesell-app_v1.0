#!/usr/bin/env bash
# apps/web-app/scripts/analyze-bundle.sh
# ── Bundle analysis + size report ─────────────────────────────
# Usage:
#   bash scripts/analyze-bundle.sh           → full analysis + open browser
#   bash scripts/analyze-bundle.sh --no-open → CI mode, just build + report
#   bash scripts/analyze-bundle.sh --json    → output JSON report only

set -e
cd "$(dirname "$0")/.."

OPEN=true
JSON_ONLY=false

for arg in "$@"; do
  case $arg in
    --no-open)  OPEN=false ;;
    --json)     JSON_ONLY=true; OPEN=false ;;
  esac
done

echo ""
echo "🔍 BeeSell AI — Bundle Analysis"
echo "════════════════════════════════"
echo ""

# ── Step 1: Clean build cache ────────────────────────────────
echo "→ Cleaning previous build..."
rm -rf .next

# ── Step 2: Production build with analyzer ───────────────────
echo "→ Building (ANALYZE=true)..."
ANALYZE=true NODE_ENV=production \
  npx next build 2>&1 | tee /tmp/next-build-output.txt

# ── Step 3: Parse build output for route sizes ───────────────
echo ""
echo "📦 Route Bundle Sizes"
echo "─────────────────────"

# Extract route sizes from Next.js build output
grep -E "^\s+(First Load JS|○|●|λ|ƒ)" /tmp/next-build-output.txt \
  | grep -v "chunks" \
  | head -40 \
  || echo "(build output not parseable)"

echo ""

# ── Step 4: Analyze .next/analyze directory ──────────────────
ANALYZE_DIR=".next/analyze"

if [ -d "$ANALYZE_DIR" ]; then
  echo "📊 Analyzer reports generated:"
  ls -lh "$ANALYZE_DIR"/*.html 2>/dev/null || echo "  No HTML reports found"

  if [ "$OPEN" = true ]; then
    echo ""
    echo "→ Opening reports in browser..."
    for f in "$ANALYZE_DIR"/*.html; do
      [ -f "$f" ] && open "$f" 2>/dev/null || xdg-open "$f" 2>/dev/null || echo "  (open manually: $f)"
    done
  fi
else
  echo "⚠️  No analyze directory found. Make sure @next/bundle-analyzer is installed."
fi

# ── Step 5: Check for large chunks ───────────────────────────
echo ""
echo "🔎 Largest JS chunks"
echo "───────────────────"

find .next/static/chunks -name "*.js" 2>/dev/null \
  | xargs ls -s 2>/dev/null \
  | sort -rn \
  | head -15 \
  | awk '{ printf "  %7.1f KB  %s\n", $1/2, $2 }' \
  || echo "  (no chunks found)"

# ── Step 6: Total JS size ────────────────────────────────────
echo ""
TOTAL_KB=$(find .next/static/chunks -name "*.js" 2>/dev/null \
  | xargs ls -s 2>/dev/null \
  | awk '{sum += $1} END {printf "%.0f", sum/2}')

echo "📐 Total JS: ${TOTAL_KB:-0} KB ($(echo "scale=1; ${TOTAL_KB:-0}/1024" | bc 2>/dev/null || echo "?") MB)"

# Warn if total > 1MB (Lighthouse threshold)
if [ "${TOTAL_KB:-0}" -gt 1024 ] 2>/dev/null; then
  echo "⚠️  Total JS > 1MB — consider code splitting"
fi

# ── Step 7: First Load JS breakdown ─────────────────────────
echo ""
echo "🎯 Key thresholds:"
echo "  < 130 KB  First Load JS  → ✅ Good"
echo "  130-250 KB               → ⚠️  Needs attention"
echo "  > 250 KB                 → ❌ Too large"

# ── Step 8: JSON output (for CI) ────────────────────────────
if [ "$JSON_ONLY" = true ]; then
  echo ""
  echo "{"
  echo "  \"totalKb\": ${TOTAL_KB:-0},"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
  echo "}"
fi

echo ""
echo "✅ Analysis complete"
echo "   Reports: .next/analyze/"
echo ""