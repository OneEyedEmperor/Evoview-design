#!/usr/bin/env bash
# Installs / upgrades the Evoview foundation into a client project.
#
#   components/foundation/install.sh <client-project-dir>
#
# Copies src/ to <client>/src/components/foundation/ (replaced on every run:
# there is no per-site file). Other packages' install.sh call this first.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/foundation"
VERSION="$(cat "$HERE/VERSION")"

[ -f "$TARGET/package.json" ] || { echo "no package.json in $TARGET"; exit 1; }
grep -q '"react"' "$TARGET/package.json" || { echo "$TARGET is not a React project"; exit 1; }

previous=""
[ -f "$DEST/.foundation-version" ] && previous="$(cat "$DEST/.foundation-version")"

mkdir -p "$DEST"
find "$DEST" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -r "$HERE"/src/. "$DEST/"
echo "$VERSION" > "$DEST/.foundation-version"

if [ -n "$previous" ] && [ "$previous" != "$VERSION" ]; then
  echo "foundation $previous → $VERSION ($DEST). Check $HERE/CHANGELOG.md."
else
  echo "foundation $VERSION → $DEST"
fi
