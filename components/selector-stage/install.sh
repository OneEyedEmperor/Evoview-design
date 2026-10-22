#!/usr/bin/env bash
# Installs / upgrades the Evoview selector stage (controls + foundation first) into a client project.
#
#   components/selector-stage/install.sh <client-project-dir>
#
# First run: copies src/ including the reference selector-stage.config.tsx and media/.
# Later runs: replaces the source; selector-stage.config.tsx and media/ are kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/selector-stage"
VERSION="$(cat "$HERE/VERSION")"

"$HERE/../controls/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/selector-stage.config.tsx" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name selector-stage.config.tsx ! -name media -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    selector-stage.config.tsx | media) [ "$fresh" = 1 ] && cp -r "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.selector-stage-version"

echo "selector-stage $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Replace the reference chapters in $DEST/selector-stage.config.tsx
     (copy FR/EN, media in media/, specimens). Delete unused reference media.
  2. import { SelectorStage, CompareToggle, ProofAtlas, buildSelectorStageConfig } from "@/components/selector-stage";
  3. Check the host --primary / --primary-foreground (the client accent).
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config + media preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
