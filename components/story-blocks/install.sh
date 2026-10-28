#!/usr/bin/env bash
# Installs / upgrades the Evoview story blocks (and the controls + foundation they need) into a client project.
#
#   components/story-blocks/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/story-blocks"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" story-blocks --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/story-blocks.config.tsx: media labels FR/EN; replace the reference winery
     stories with the client's (or pass content as props from the page).
  2. import { Story, StoryIntro, IndexedRows, ProofGrid, RuledPillars, PayoffBand } from "@/components/story-blocks";
  3. Put the client's media in public/ and point StoryMedia.src at it.
See $HERE/README.md for the contract and the verification checklist.
EOF
