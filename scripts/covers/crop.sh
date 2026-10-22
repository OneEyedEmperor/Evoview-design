#!/usr/bin/env bash
# name  card(x y w h)  banner(x y w h) — CSS px on a 1440x900 @2x capture
set -e
OUT=/root/.vibehub/projects/evoview-design-library/public/library/covers
mkdir -p "$OUT"
crop() {
  local name=$1 kind=$2 x=$3 y=$4 w=$5 h=$6 size=$7
  convert "/tmp/evlib/raw-$name.png" -crop "$((w*2))x$((h*2))+$((x*2))+$((y*2))" +repage \
    -resize "$size^" -gravity center -extent "$size" -strip -quality 76 -define webp:method=6 "$OUT/$name-$kind.webp"
}
while read -r name cx cy cw ch bx by bw bh; do
  [ -z "$name" ] && continue
  crop "$name" card "$cx" "$cy" "$cw" "$ch" 1280x800
  crop "$name" banner "$bx" "$by" "$bw" "$bh" 900x216
done <<'EOF'
chapter           120 150 1200 750     0 600 1200 288
card-track        100 120 1200 750     0 330 1440 346
process-sequence  100 100 1240 775     0 260 1440 346
story-blocks      120 120 1200 750   160 490 1140 274
reservation       232  30  976 610    60 330  900 216
selector-stage    120  80 1200 750   140 330 1176 282
controls          100  80 1200 750   606 446  700 168
dossier            80  30 1280 800   140 190 1200 288
navbar            590  10  840 525   600 160  820 197
EOF
ls -la "$OUT"
