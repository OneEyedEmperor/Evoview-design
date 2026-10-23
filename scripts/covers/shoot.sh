#!/usr/bin/env bash
# Raw 1440×900 @2x captures of each showcase for the cover crops (crop.sh).
#   scripts/covers/shoot.sh            # every entry below
#   scripts/covers/shoot.sh dossier    # only the named ones
# Waits for the frame's data-lib-ready (fonts + eager media settled), never a
# fixed delay; hides the library navbar and floating palette.
# Env: LIBRARY_URL (default https://evoview-library.said.bet), SESSION.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
RAW="$HERE/.generated/raw"
BASE=${LIBRARY_URL:-https://evoview-library.said.bet}
S=(--session "${SESSION:-evlib-covers}")
mkdir -p "$RAW"

ab() { agent-browser "${S[@]}" "$@"; }

# name | path | scroll target selector | offset px | optional JS run before the capture
ENTRIES=$(cat <<'EOF'
chapter|/layouts/chapter|#lumiere|-40|
card-track|/layouts/card-track|#card-track-portfolio|60|
process-sequence|/layouts/process-sequence|.ev-process|-20|
story-blocks|/layouts/story-blocks|.ev-story-blocks|90|
reservation|/components/reservation|.evo-resa__chassis|-30|
selector-stage|/components/selector-stage|.ev-selector-stage|70|document.querySelectorAll('.lib-variant').forEach((v, i) => { if (i > 0) v.style.visibility = 'hidden'; })
controls|/components/controls|.lib-variant:nth-of-type(2) .lib-variant__body|-30|
dossier|/components/dossier|.lib-showcase__stage|0|document.querySelector('.dsh-launcher')?.click()
EOF
)

HIDE_CHROME="(() => { const st = document.createElement('style'); st.textContent = '.ev-navbar, .lib-float, .lib-variant__caption { visibility: hidden !important; }'; document.head.appendChild(st); return 1; })()"
VIEWPORT_SETTLED="(() => [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).every((i) => i.complete))()"

wanted() { local w; for w in "${FILTER[@]}"; do [ "$w" = "$1" ] && return 0; done; return 1; }
FILTER=("$@")

ab set viewport 1440 900 2 >/dev/null
ab open "$BASE/" >/dev/null
ab eval "localStorage.setItem('evoview-library:locale', 'fr')" >/dev/null # covers are shot in French

while IFS='|' read -r name path sel off pre; do
  [ -z "$name" ] && continue
  if [ ${#FILTER[@]} -gt 0 ] && ! wanted "$name"; then continue; fi
  ab open "$BASE$path" >/dev/null
  ab wait --fn "!!document.querySelector('[data-lib-ready]')" --timeout 20000 >/dev/null
  ab eval "$HIDE_CHROME" >/dev/null
  ab eval "(() => { const e = document.querySelector('$sel'); if (!e) return 'missing $sel'; window.scrollTo(0, e.getBoundingClientRect().top + scrollY + ($off)); return scrollY; })()" >/dev/null
  ab wait --fn "$VIEWPORT_SETTLED" --timeout 15000 >/dev/null || echo "  ($name: viewport media still pending, capturing anyway)"
  ab wait 900 >/dev/null # reveal motion (600 ms) + one frame of slack
  if [ -n "$pre" ]; then
    ab eval "$pre" >/dev/null
    ab wait --fn "$VIEWPORT_SETTLED" --timeout 15000 >/dev/null || echo "  ($name: viewport media still pending, capturing anyway)"
    ab wait 1200 >/dev/null # modal entry (cinematic 900 ms)
  fi
  ab screenshot "$RAW/raw-$name.png" >/dev/null
  echo "$name → $RAW/raw-$name.png"
done <<< "$ENTRIES"

# Navbar: the reference demo with the capsule unfolded and the Services tray open.
if [ ${#FILTER[@]} -eq 0 ] || wanted navbar; then
  ab open "$BASE/navbar/reference" >/dev/null
  ab wait --fn "!!document.querySelector('.ev-navbar .nav-finder:not(.nav-finder--mobile)') && document.fonts.status === 'loaded'" --timeout 20000 >/dev/null
  center() { ab eval "(() => { const e = [...document.querySelectorAll('$1')].find((n) => n.getBoundingClientRect().width > 0 && (!'$2' || n.textContent.trim().toLowerCase() === '$2')); if (!e) return '0 0'; const r = e.getBoundingClientRect(); return Math.round(r.x + r.width / 2) + ' ' + Math.round(r.y + r.height / 2); })()" | tr -d '"'; }
  ab eval "(() => { document.querySelector('main').style.visibility = 'hidden'; return 1; })()" >/dev/null # the bar is the subject
  ab mouse move 720 600 >/dev/null
  # shellcheck disable=SC2046
  ab mouse move $(center '.nav-finder:not(.nav-finder--mobile) button' '') >/dev/null
  ab wait 700 >/dev/null
  # shellcheck disable=SC2046
  ab mouse move $(center '.nav-finder:not(.nav-finder--mobile) a, .nav-finder:not(.nav-finder--mobile) button' 'services') >/dev/null
  ab wait --fn "[...document.querySelectorAll('.nav-tray-card img, .nav-tray img')].every((i) => i.complete)" --timeout 15000 >/dev/null
  ab wait 900 >/dev/null
  ab screenshot "$RAW/raw-navbar.png" >/dev/null
  echo "navbar → $RAW/raw-navbar.png"
fi
