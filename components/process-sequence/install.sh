#!/usr/bin/env bash
# Installs / upgrades the Evoview process-sequence (controls + foundation first) into a client project.
#
#   components/process-sequence/install.sh <client-project-dir>
#
# First run: copies src/ including the reference process-sequence.config.tsx.
# Later runs: replaces the source; process-sequence.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/process-sequence"
CONFIG="process-sequence.config.tsx"
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
echo "$VERSION" > "$DEST/.process-sequence-version"

echo "process-sequence $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/$CONFIG: real steps, media (pass files via { media }), marks, CTA, FR/EN copy.
  2. import { ProcessSequence, buildProcessSequenceConfig } from "@/components/process-sequence";
     <ProcessSequence config={buildProcessSequenceConfig(locale, { media })} tone="dark" />
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
