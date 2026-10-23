#!/usr/bin/env bash
# Crops the raw captures (shoot.sh) into public/library/covers/:
#   <id>-card.webp    index well. 7-column entries 1280×800 (16:10); 5-column
#                     entries (2nd and 3rd of each category) 1280×1135, the
#                     ratio their well takes when it shares the row height.
#   <id>-banner.webp  navbar tray card, 900×216.
# Boxes are CSS px on the 1440×900 @2x capture; the box is cover-fitted to
# the output size (centre crop), so pick a box near the output ratio.
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
chapter           1280x800   120 150 1200 750     0 600 1200 288
card-track        1280x1135  260 100  880 780     0 330 1440 346
process-sequence  1280x1135  260  80  900 798     0 260 1440 346
story-blocks      1280x800   120 120 1200 750   160 490 1140 274
reservation       1280x800   232  30  976 610    60 330  900 216
dossier           1280x1135  280  30  900 798   140 190 1200 288
selector-stage    1280x1135  260  60  900 798   140 330 1176 282
controls          1280x800   100  80 1200 750   606 446  700 168
navbar            1280x800   590  10  840 525   600 160  820 197
EOF
