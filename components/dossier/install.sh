#!/usr/bin/env bash
# Installs / upgrades the Evoview dossier (and controls + foundation first) into a client project.
#
#   components/dossier/install.sh <client-project-dir>
#
# First run: copies src/ including the reference dossier.config.tsx.
# Later runs: replaces the source; dossier.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/dossier"
VERSION="$(cat "$HERE/VERSION")"

"$HERE/../controls/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/dossier.config.tsx" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name dossier.config.tsx -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    dossier.config.tsx) [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.dossier-version"

echo "dossier $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Rewrite $DEST/dossier.config.tsx: brand, kicker, items (4 entries each),
     entry media + detail chapters, copy FR/EN. Replace the /library/dossier/
     placeholder media with the client's own.
  2. Keep attribution.enabled = true (approved placement: the header strip).
  3. import { Dossier, buildDossierConfig, dossierRoutes } from "@/components/dossier";
     <Dossier config={config} view={view} onNavigate={setView} hrefFor={routeHrefs(base, dossierRoutes.key)} />
     Every view gets a URL: wire routes + prerender per README "Crawlable views".
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
