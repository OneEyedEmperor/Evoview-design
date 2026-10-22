#!/usr/bin/env bash
# Installs / upgrades the Evoview controls (and the foundation first) into a client project.
#
#   components/controls/install.sh <client-project-dir>
#
# First run: copies src/ including the reference controls.config.tsx.
# Later runs: replaces the source; controls.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/controls"
VERSION="$(cat "$HERE/VERSION")"

"$HERE/../foundation/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/controls.config.tsx" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name controls.config.tsx -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    controls.config.tsx) [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.controls-version"

echo "controls $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Check $DEST/controls.config.tsx (default labels, FR/EN).
  2. import { PrimaryPlate, ChipGroup, … } from "@/components/controls";
     Optional: <ControlsProvider config={buildControlsConfig(locale)}> around the app.
  3. Wrap the area in a tone: className="ev-tone-dark" | "ev-tone-light" | "ev-tone-paper".
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
