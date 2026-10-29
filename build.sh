#!/bin/sh
# Build index.html from src/. The game is a single file with no runtime deps
# except the three.js module pulled from the CDN import map in src/00-head.html.
set -e
cd "$(dirname "$0")"

FILES="src/00-head.html src/10-core.js src/12-kit.js src/14-cast.js src/30-const.js src/35-state.js src/40-state.js \
src/20-art.js src/32-artdegen.js src/34-bgart.js src/40-bake.js src/50-draw.js \
src/50-spawn.js src/60-game.js src/65-fx.js src/70-flow.js src/90-main.js"

out=${1:-index.html}
tmp="$out.new"
rm -f "$tmp"
for f in $FILES; do
  [ -f "$f" ] || { echo "missing $f" >&2; exit 1; }
  cat "$f" >> "$tmp"
  printf '\n' >> "$tmp"
done
printf '</script>\n</body>\n</html>\n' >> "$tmp"

# cheap syntax gate: extract the module body and let node parse it
if command -v node >/dev/null 2>&1; then
  python3 - "$tmp" <<'PY'
import sys
s = open(sys.argv[1]).read()
i = s.index('<script type="module">') + len('<script type="module">')
j = s.rindex('</script>')
open('/tmp/memerun-check.mjs', 'w').write(s[i:j])
PY
  node --check /tmp/memerun-check.mjs
  echo "syntax ok"
fi

mv "$tmp" "$out"
echo "built $out ($(wc -l < "$out") lines)"
