#!/usr/bin/env bash
# Copies the reservation package into a client project.
#
#   components/reservation/install.sh <client-project-dir>
#
# First run: copies everything, including the reference reservation.config.tsx.
# Later runs: replaces the component source (brand/ included: it is the
# Evoview signature, not client branding); reservation.config.tsx is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install.sh <client-project-dir>}"
TARGET="$(cd "$TARGET" && pwd)"
DEST="$TARGET/src/components/reservation"
VERSION="$(cat "$HERE/VERSION")"

[ -f "$TARGET/package.json" ] || { echo "no package.json in $TARGET"; exit 1; }
grep -q '"react"' "$TARGET/package.json" || { echo "$TARGET is not a React project"; exit 1; }
for dep in react-day-picker date-fns lucide-react; do
  grep -q "\"$dep\"" "$TARGET/package.json" || echo "warning: $dep missing from $TARGET/package.json"
done

mkdir -p "$DEST"
fresh=1
[ -f "$DEST/reservation.config.tsx" ] && fresh=0
# Drop package files removed upstream; the client config survives.
find "$DEST" -mindepth 1 -maxdepth 1 ! -name reservation.config.tsx -exec rm -rf {} +

for file in "$HERE"/src/*; do
  name="$(basename "$file")"
  case "$name" in
    reservation.config.tsx) [ "$fresh" = 1 ] && cp "$file" "$DEST/" ;;
    *) cp -r "$file" "$DEST/" ;;
  esac
done
echo "$VERSION" > "$DEST/.reservation-version"

echo "reservation $VERSION → $DEST"
if [ "$fresh" = 1 ]; then
  cat <<EOF

Next:
  1. Edit $DEST/reservation.config.tsx (copy, experiences, windows, guests, accent, submit).
  2. Mount: import { Reservation } from "@/components/reservation"; <Reservation config={buildReservationConfig(locale)} />
  3. Keep the signature copy; translate it if needed.
See $HERE/README.md for the contract and the verification checklist.
EOF
else
  echo "config preserved (upgrade). Check $HERE/CHANGELOG.md for breaking changes."
fi
