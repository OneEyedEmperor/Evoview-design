#!/usr/bin/env bash
# Installs / upgrades the Evoview card package (and the controls + foundation it needs) into a client project.
#
#   components/card/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/card"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" card --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/card.config.tsx: the client's tracks (items, media), copy FR/EN.
  2. import { CardTrack, buildCardTrackConfig } from "@/components/card";
     <CardTrack track={config.tracks.services} copy={config.copy} tone="light" heading={…} onOpen={…} />
  3. Replace the reference media paths with the client's own posters (and optional loops).
See $HERE/README.md for the contract and the verification checklist.
EOF
