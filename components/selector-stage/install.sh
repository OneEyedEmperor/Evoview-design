#!/usr/bin/env bash
# Installs / upgrades the Evoview selector stage (and the controls + foundation it needs) into a client project.
#
#   components/selector-stage/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/selector-stage"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" selector-stage --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Replace the reference chapters in $DEST/selector-stage.config.tsx
     (copy FR/EN, media in media/, specimens). Delete unused reference media.
  2. import { SelectorStage, CompareToggle, ProofAtlas, buildSelectorStageConfig } from "@/components/selector-stage";
  3. Check the host --primary / --primary-foreground (the client accent).
See $HERE/README.md for the contract and the verification checklist.
EOF
