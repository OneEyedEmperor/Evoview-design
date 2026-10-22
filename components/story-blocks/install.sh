#!/usr/bin/env bash
# Installs / upgrades the Evoview story blocks (controls + foundation first) into a client project.
#
#   components/story-blocks/install.sh <client-project-dir>
#
# First run: copies src/ including the reference story-blocks.config.tsx.
# Later runs: replaces the source; story-blocks.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/story-blocks"
CONFIG="story-blocks.config.tsx"
VERSION="$(cat "$HERE/VERSION")"

"$HERE/../controls/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/$CONFIG" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name "$CONFIG" -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    "$CONFIG") [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.story-blocks-version"

echo "story-blocks $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/$CONFIG: media labels FR/EN; replace the reference winery
     stories with the client's (or pass content as props from the page).
  2. import { Story, StoryIntro, IndexedRows, ProofGrid, RuledPillars, PayoffBand } from "@/components/story-blocks";
  3. Put the client's media in public/ and point StoryMedia.src at it.
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
