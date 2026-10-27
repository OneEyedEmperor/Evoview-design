#!/usr/bin/env bash
# Installs / upgrades the Evoview card package (and controls + foundation first) into a client project.
#
#   components/card/install.sh <client-project-dir>
#
# First run: copies src/ including the reference card.config.tsx.
# Later runs: replaces the source; card.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/card"
VERSION="$(cat "$HERE/VERSION")"

# controls installs foundation first.
"$HERE/../controls/install.sh" "$TARGET" >/dev/null
echo "controls $(cat "$HERE/../controls/VERSION") + foundation $(cat "$HERE/../foundation/VERSION") installed"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/card.config.tsx" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name card.config.tsx -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    card.config.tsx) [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.card-version"

echo "card $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/card.config.tsx: the client's tracks (items, media), copy FR/EN.
  2. import { CardTrack, buildCardTrackConfig } from "@/components/card";
     <CardTrack track={config.tracks.services} copy={config.copy} tone="light" heading={…} onOpen={…} />
  3. Replace the reference media paths with the client's own posters (and optional loops).
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
