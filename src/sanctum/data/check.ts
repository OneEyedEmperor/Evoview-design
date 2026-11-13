/* Instant feedback: the same engine the server runs. The server stays the
   authority (it checks against the sealed canon, not the locked flags). */

import { applyOps, diffStates } from "../model/ops.ts";
import type { Diff, Id, Op, Refusal, SanctumState, VisionFiles } from "../model/types.ts";
import { canonOf, validate } from "../model/validate.ts";

export interface LocalCheck {
  state: SanctumState;
  refusals: Refusal[];
  diff: Diff;
}

export function checkLocally(state: SanctumState, ops: Op[], visionFiles: Record<Id, VisionFiles> = {}): LocalCheck {
  const { state: next, refusals } = applyOps(state, ops, { visionFiles: (id) => visionFiles[id] });
  const all = refusals.length ? refusals : validate(next, canonOf(state));
  return { state: next, refusals: all, diff: diffStates(state, next) };
}
