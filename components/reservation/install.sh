#!/usr/bin/env bash
# Installs / upgrades the Evoview reservation package (and the controls + foundation it needs) into a client project.
#
#   components/reservation/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/reservation"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" reservation --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/reservation.config.tsx (copy, experiences, windows, guests, accent, submit).
  2. Mount: import { Reservation } from "@/components/reservation"; <Reservation config={buildReservationConfig(locale)} />
     Short form: import { ReservationFlow } …; <ReservationFlow config={buildReservationFlowConfig(locale)} />
  3. Keep the signature copy; translate it if needed.
See $HERE/README.md for the contract and the verification checklist.
EOF
