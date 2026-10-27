#!/usr/bin/env bash
# Crops the raw captures (shoot.sh) into public/library/covers/:
#   <id>-card.webp    index well. 7-column entries 1280×800 (16:10); 5-column
#                     entries (2nd and 3rd of each category) 1280×1135, the
#                     ratio their well takes when it shares the row height.
#   <id>-banner.webp  navbar tray card, 900×216.
# Boxes are CSS px on the 1440×900 @2x capture; the box is cover-fitted to
# the output size (centre crop), so pick a box near the output ratio.
# Banners carry the tray card's title on top: crop image or structure, not
# display type.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
RAW="$HERE/.generated/raw"
OUT="$ROOT/public/library/covers"
mkdir -p "$OUT"

crop() {
  local name=$1 kind=$2 x=$3 y=$4 w=$5 h=$6 size=$7
  convert "$RAW/raw-$name.png" -crop "$((w * 2))x$((h * 2))+$((x * 2))+$((y * 2))" +repage \
    -resize "$size^" -gravity center -extent "$size" -strip -quality 76 -define webp:method=6 "$OUT/$name-$kind.webp"
}

# name             card size   card x y w h          banner x y w h
while read -r name size cx cy cw ch bx by bw bh; do
  [ -z "$name" ] && continue
  [ -f "$RAW/raw-$name.png" ] || { echo "skip $name (no raw capture)"; continue; }
  crop "$name" card "$cx" "$cy" "$cw" "$ch" "$size"
  crop "$name" banner "$bx" "$by" "$bw" "$bh" 900x216
  echo "$name cropped"
done <<'EOF'
chapter           1280x800   152 150 1136  710   132 330 1174 282
card              1280x1135   40  92  553  490    40 160 1400 336
process-sequence  1280x1135  130  40  970  860   130 150 1180 283
story-blocks      1280x800   120  30 1200  750   136 300 1170 281
reservation       1280x800   220  50 1000  625   272 368  896 215
dossier           1280x1135   86   8  900  798    86 130 1270 305
selector-stage    1280x1135  136  10 1000  887   576 100  728 175
controls          1280x800   560  20  800  500   570  32  790 190
navbar            1280x800   560   0  880  550   600   5  820 197
EOF

# Cache key for the fixed file names (covers.tsx appends it as ?v=).
printf '/* Written by scripts/covers/crop.sh. */\nexport const COVERS_REV = "%s";\n' "$(date +%Y%m%d%H%M%S)" > "$ROOT/src/library/covers.rev.ts"
