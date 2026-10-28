#!/usr/bin/env bash
# Installs / upgrades the Evoview finder navbar (and the foundation it needs) into a client project.
#
#   components/navbar/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/navbar"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" navbar --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/navbar.config.tsx (logo, labels, sections, deck, trays, actions).
  2. Mount: import { Navbar } from "@/components/navbar"; import { navbarConfig } from "@/components/navbar/navbar.config"; <Navbar config={navbarConfig} />
  3. Give page sections the ids listed in config.sections; add data-nav-tone="dark" to dark ones.
  4. Replace or delete $DEST/brand/ once the client logo and tray data are in place.
See $HERE/README.md for the contract and the verification checklist.
EOF
