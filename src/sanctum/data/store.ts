/* The sanctum's client store: one snapshot, replaced (never mutated) on
   every change, read through useSanctum. The draft is the seam between the
   console (writes it) and the sight (renders it ghosted, answers taps). */

import { useSyncExternalStore } from "react";
import type { Diff, Id, Op, RecordEntry, Refusal, SanctumState, ThreadEnd, VisionFiles } from "../model/types.ts";
import { checkLocally } from "./check.ts";
import { NotEntered, Refused, api } from "./client.ts";

export type Status = "unknown" | "gate" | "gathering" | "open";

export interface DraftSubject {
  type: "element" | "thread" | "layer" | "reading" | "vision";
  id?: Id;
}

export type Socket = { socket: { realm: Id; order: number } };
export type AwaitChoice = ({ value: ThreadEnd } | Socket) & { ok: boolean; why?: string };

export interface Verdict {
  state: "empty" | "checking" | "accepted" | "refused";
  /** Confirmed by the server's dry run (the authority). */
  confirmed: boolean;
  refusals: Refusal[];
  /** The record's words for the change, when accepted. */
  summary: string;
}

export interface Draft {
  open: boolean;
  subject: DraftSubject | null;
  ops: Op[];
  /** `state.meta.version` the ops were composed on. */
  baseVersion: number;
  /** The would-be map: local at once, the server's once confirmed. */
  previewState: SanctumState | null;
  diff: Diff | null;
  verdict: Verdict;
  /** What a tap on the eye may answer (the console writes it). */
  awaiting: { slot: string; choices: AwaitChoice[] } | null;
  /** The end named by the slot under the pointer or focus (the sight pulses it). */
  hover: ThreadEnd | null;
  /** The sight's answer to `awaiting`. */
  picked: { slot: string; value: ThreadEnd | Socket; at: number } | null;
  /** Set when the draft previews a restore of that version. */
  restoring: number | null;
}

export interface SanctumSnapshot {
  status: Status;
  state: SanctumState | null;
  draft: Draft;
  record: RecordEntry[] | null;
  /** Visions brought, not yet in the map. */
  brought: Record<Id, VisionFiles>;
  busy: boolean;
  /** Pure-language words for the last outcome, ready to show. */
  word: string;
}

export interface SanctumStore {
  get(): SanctumSnapshot;
  subscribe(listener: () => void): () => void;
  check(): Promise<void>;
  enter(watchword: string): Promise<{ entered: boolean; rest?: number }>;
  leave(): Promise<void>;
  gather(): Promise<void>;
  openDraft(subject?: DraftSubject | null): void;
  /** Withdraws: clears ops, preview, awaiting. */
  closeDraft(): void;
  /** New ops are judged at once (local engine), then confirmed by a debounced server dry run. */
  setDraft(patch: Partial<Pick<Draft, "subject" | "ops" | "awaiting" | "hover">>): void;
  pick(value: ThreadEnd | Socket): void;
  /** Seals the draft (its ops, or its restore). Clears it when accepted, keeping `open`. */
  seal(summary?: string): Promise<boolean>;
  /** Opens a draft previewing the restore of `version`; seal() confirms it. */
  restore(version: number): Promise<boolean>;
  loadRecord(): Promise<RecordEntry[]>;
  recordAt(version: number): Promise<SanctumState>;
  bringVision(picture: Blob): Promise<VisionFiles | null>;
}

const EMPTY_VERDICT: Verdict = { state: "empty", confirmed: false, refusals: [], summary: "" };
const DRY_RUN_DELAY = 260;

const emptyDraft = (baseVersion = 0): Draft => ({
  open: false,
  subject: null,
  ops: [],
  baseVersion,
  previewState: null,
  diff: null,
  verdict: EMPTY_VERDICT,
  awaiting: null,
  hover: null,
  picked: null,
  restoring: null,
});

const INITIAL: SanctumSnapshot = { status: "unknown", state: null, draft: emptyDraft(), record: null, brought: {}, busy: false, word: "" };

export function createSanctumStore(): SanctumStore {
  let snap = INITIAL;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Bumped on every draft change, so a late dry run never overwrites a newer draft. */
  let token = 0;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SanctumSnapshot>) => {
    snap = { ...snap, ...patch };
    listeners.forEach((l) => l());
  };
  const setDraftState = (patch: Partial<Draft>) => set({ draft: { ...snap.draft, ...patch } });

  /** Runs a call; a lost entry returns to the gate, other refusals become words. */
  async function guarded<T>(fn: () => Promise<T>): Promise<T | undefined> {
    set({ busy: true });
    try {
      return await fn();
    } catch (err) {
      if (err instanceof NotEntered) set({ status: "gate", state: null, draft: emptyDraft(), record: null });
      else set({ word: err instanceof Refused ? err.message : "The sanctum could not answer." });
      return undefined;
    } finally {
      set({ busy: false });
    }
  }

  /** Judges the draft's ops: locally at once, then by the server after a pause. */
  function judge() {
    const state = snap.state;
    const ops = snap.draft.ops;
    clearTimeout(timer);
    const mine = ++token;
    if (!state || !ops.length) {
      setDraftState({ previewState: null, diff: null, verdict: EMPTY_VERDICT, baseVersion: state?.meta.version ?? 0 });
      return;
    }
    const local = checkLocally(state, ops, snap.brought);
    const refused = local.refusals.length > 0;
    setDraftState({
      baseVersion: state.meta.version,
      previewState: local.state,
      diff: local.diff,
      verdict: { state: refused ? "refused" : "checking", confirmed: false, refusals: local.refusals, summary: "" },
    });
    if (refused) return;
    timer = setTimeout(async () => {
      try {
        const res = await api.change({ ops, dryRun: true, baseVersion: state.meta.version });
        if (mine !== token) return;
        if (res.accepted) setDraftState({ previewState: res.state, diff: res.diff, verdict: { state: "accepted", confirmed: true, refusals: [], summary: res.summary } });
        else {
          setDraftState({ verdict: { state: "refused", confirmed: true, refusals: res.refusals, summary: "" } });
          if (res.refusals.some((r) => r.rule === "moved")) void store.gather();
        }
      } catch (err) {
        if (mine !== token) return;
        if (err instanceof NotEntered) set({ status: "gate", state: null, draft: emptyDraft(), record: null });
        else set({ word: err instanceof Refused ? err.message : "The sanctum could not answer." });
      }
    }, DRY_RUN_DELAY);
  }

  const store: SanctumStore = {
    get: () => snap,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async check() {
      const s = await guarded(() => api.session());
      if (!s) return;
      if (s.entered) await store.gather();
      else set({ status: "gate" });
    },

    async enter(watchword) {
      const s = await guarded(() => api.enter(watchword));
      if (!s) return { entered: false };
      if (s.entered) await store.gather();
      return s;
    },

    async leave() {
      clearTimeout(timer);
      token++;
      await guarded(() => api.leave());
      snap = INITIAL;
      set({ status: "gate" });
    },

    async gather() {
      if (!snap.state) set({ status: "gathering" });
      const state = await guarded(() => api.map());
      if (!state) return;
      set({ status: "open", state });
      /* A pending draft is recomposed upon the map as it now stands. */
      if (snap.draft.ops.length && !snap.draft.restoring) judge();
      else if (!snap.draft.restoring) setDraftState({ baseVersion: state.meta.version });
    },

    openDraft(subject = null) {
      setDraftState({ open: true, subject });
    },

    closeDraft() {
      clearTimeout(timer);
      token++;
      set({ draft: emptyDraft(snap.state?.meta.version ?? 0) });
    },

    setDraft(patch) {
      const opsChanged = patch.ops !== undefined && patch.ops !== snap.draft.ops;
      setDraftState({ ...patch, open: true, ...(opsChanged ? { restoring: null } : {}) });
      if (opsChanged) judge();
    },

    pick(value) {
      const slot = snap.draft.awaiting?.slot;
      if (!slot) return;
      setDraftState({ picked: { slot, value, at: Date.now() } });
    },

    async seal(summary) {
      const state = snap.state;
      const draft = snap.draft;
      if (!state) return false;
      if (!draft.restoring && !draft.ops.length) return false;
      clearTimeout(timer);
      token++;
      const res = await guarded(() =>
        draft.restoring
          ? api.restore(draft.restoring, state.meta.version, false)
          : api.change({ ops: draft.ops, baseVersion: draft.baseVersion, ...(summary ? { summary } : {}) }),
      );
      if (!res) return false;
      if (res.accepted) {
        /* The shell stays as it was, so the sealed knot can be seen and shaping go on. */
        set({ state: res.state, draft: { ...emptyDraft(res.state.meta.version), open: draft.open }, record: null, word: res.summary });
        return true;
      }
      setDraftState({ verdict: { state: "refused", confirmed: true, refusals: res.refusals, summary: "" } });
      if (res.refusals.some((r) => r.rule === "moved")) await store.gather();
      return false;
    },

    async restore(version) {
      const state = snap.state;
      if (!state) return false;
      clearTimeout(timer);
      const mine = ++token;
      setDraftState({ open: true, ops: [], restoring: version, baseVersion: state.meta.version, previewState: null, diff: null, verdict: { ...EMPTY_VERDICT, state: "checking" } });
      const res = await guarded(() => api.restore(version, state.meta.version, true));
      if (!res || mine !== token) return false;
      if (res.accepted) setDraftState({ previewState: res.state, diff: res.diff, verdict: { state: "accepted", confirmed: true, refusals: [], summary: res.summary } });
      else setDraftState({ verdict: { state: "refused", confirmed: true, refusals: res.refusals, summary: "" } });
      return res.accepted;
    },

    async loadRecord() {
      const record = await guarded(() => api.record());
      if (record) set({ record });
      return record ?? [];
    },

    async recordAt(version) {
      return api.recordAt(version);
    },

    async bringVision(picture) {
      const files = await guarded(() => api.bringVision(picture));
      if (!files) return null;
      set({ brought: { ...snap.brought, [files.id]: files } });
      if (snap.draft.ops.length) judge();
      return files;
    },
  };
  return store;
}

export function useSanctum(store: SanctumStore): SanctumSnapshot;
export function useSanctum<T>(store: SanctumStore, select: (s: SanctumSnapshot) => T): T;
/** `select` must return a field (or a primitive), not a fresh object. */
export function useSanctum<T>(store: SanctumStore, select?: (s: SanctumSnapshot) => T) {
  return useSyncExternalStore(store.subscribe, () => (select ? select(store.get()) : store.get()));
}
