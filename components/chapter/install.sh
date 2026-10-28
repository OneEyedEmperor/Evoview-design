#!/usr/bin/env bash
# Installs / upgrades the Evoview chapter package (and the controls + foundation it needs) into a client project.
#
#   components/chapter/install.sh <client-project-dir> [sync flags]
#
# Thin wrapper over sync.sh (docs/SYNC.md): plans, applies only a clean plan,
# else prints the plan and exits non-zero; then review and run
# sync.sh plan / apply / verify by hand. Never overwrites client-owned files.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir> [sync flags]}"
shift
DEST="$TARGET/src/components/chapter"
fresh=1
[ -e "$DEST" ] && fresh=0

"$HERE/../../sync.sh" apply "$TARGET" chapter --if-clean "$@"

[ "$fresh" = 1 ] || exit 0
cat <<EOF

Next:
  1. Edit $DEST/chapter.config.tsx (brand name, inline mark, footer logo, legal, links; keep attribution).
  2. import { Chapter, ChapterHeading, ChapterFooter, buildChapterConfig } from "@/components/chapter";
  3. One <Chapter id tone rhythm rail> per section, one <ChapterHeading> each, <ChapterFooter> last.
     Remove any data-nav-tone="dark" page wrapper; feed the navbar chapterNavSections(...).
See $HERE/README.md for the contract and the verification checklist.
EOF
