#!/usr/bin/env bash
# Installs / upgrades the Evoview chapter shell (and the foundation first) into a client project.
#
#   components/chapter/install.sh <client-project-dir>
#
# First run: copies src/ including the reference chapter.config.tsx.
# Later runs: replaces the source; chapter.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/chapter"
VERSION="$(cat "$HERE/VERSION")"

"$HERE/../foundation/install.sh" "$TARGET"

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/chapter.config.tsx" ] && fresh=0
find "$DEST" -mindepth 1 -maxdepth 1 ! -name chapter.config.tsx -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    chapter.config.tsx) [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.chapter-version"

echo "chapter $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/chapter.config.tsx (brand name, inline mark, footer logo, legal, links; keep attribution).
  2. import { Chapter, ChapterHeading, ChapterFooter, buildChapterConfig } from "@/components/chapter";
  3. One <Chapter id tone rhythm rail> per section, one <ChapterHeading> each, <ChapterFooter> last.
     Remove any data-nav-tone="dark" page wrapper; feed the navbar chapterNavSections(...).
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
