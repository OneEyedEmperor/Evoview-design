#!/usr/bin/env bash
# Installs / upgrades the Evoview controls (and the foundation they need) into a client project.
#
#   components/controls/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/controls"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" controls --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Check $DEST/controls.config.tsx (default labels, FR/EN).
  2. import { PrimaryPlate, ChipGroup, … } from "@/components/controls";
     Optional: <ControlsProvider config={buildControlsConfig(locale)}> around the app.
  3. Wrap the area in a tone: className="ev-tone-dark" | "ev-tone-light" | "ev-tone-paper".
See $HERE/README.md for the contract and the verification checklist.
EOF
