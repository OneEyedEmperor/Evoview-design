#!/usr/bin/env bash
# Installs / upgrades the Evoview dossier (and the controls + foundation it needs) into a client project.
#
#   components/dossier/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/dossier"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" dossier --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
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
