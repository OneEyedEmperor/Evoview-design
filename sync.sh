#!/usr/bin/env bash
# Evoview package sync: plan | apply | verify. Contract: docs/SYNC.md.
exec node "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/scripts/evoview-sync.mjs" "$@"
