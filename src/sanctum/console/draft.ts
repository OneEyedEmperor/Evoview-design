import type { SanctumStore } from "../data";

/** Writes the draft only while the console is open (setDraft opens the shell). */
export function patchDraft(store: SanctumStore, patch: Parameters<SanctumStore["setDraft"]>[0]) {
  if (store.get().draft.open) store.setDraft(patch);
}
