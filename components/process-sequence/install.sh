#!/usr/bin/env bash
# Installs / upgrades the Evoview process-sequence (and the controls + foundation it needs) into a client project.
#
#   components/process-sequence/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/process-sequence"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" process-sequence --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/process-sequence.config.tsx: real steps, media (pass files via { media }), marks, CTA, FR/EN copy.
  2. import { ProcessSequence, buildProcessSequenceConfig } from "@/components/process-sequence";
     <ProcessSequence config={buildProcessSequenceConfig(locale, { media })} tone="dark" />
See $HERE/README.md for the contract and the verification checklist.
EOF
