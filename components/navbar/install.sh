#!/usr/bin/env bash
# Copies the navbar package into a client project.
#
#   components/navbar/install.sh <client-project-dir>
#
# First run: copies everything, including the reference navbar.config.tsx
# and the evoview brand/ folder, as a starting point.
# Later runs: refreshes the component source only; navbar.config.tsx and
# brand/ are left untouched so a site's adaptation survives an upgrade.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/navbar"
VERSION="$(cat "$HERE/VERSION")"

[ -f "$TARGET/package.json" ] || { echo "no package.json in $TARGET"; exit 1; }
grep -q '"react"' "$TARGET/package.json" || { echo "$TARGET is not a React project"; exit 1; }

# The menu number orbs fill through foundation's OrbFill.
"$HERE/../foundation/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/navbar.config.tsx" ] && fresh=0

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    navbar.config.tsx|brand) [ "$fresh" = 1 ] && cp -r "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.navbar-version"

echo "navbar $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/navbar.config.tsx (logo, labels, sections, deck, trays, actions).
  2. Mount: import { Navbar } from "@/components/navbar"; import { navbarConfig } from "@/components/navbar/navbar.config"; <Navbar config={navbarConfig} />
  3. Give page sections the ids listed in config.sections; add data-nav-tone="dark" to dark ones.
  4. Replace or delete $DEST/brand/ once the client logo and tray data are in place.
See $HERE/README.md for the full contract and the verification checklist.
EOF
else
  echo "config and brand/ preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
