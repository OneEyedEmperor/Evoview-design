/* The sanctum's client store: one snapshot, replaced (never mutated) on
   every change, read through useSanctum. */

import { useSyncExternalStore } from "react";
import type { ChangeResponse, Id, Op, RecordEntry, Refusal, SanctumState, VisionFiles } from "../model/types";
import { checkLocally } from "./check";
import { NotEntered, Refused, api } from "./client";

export type Status = "unknown" | "gate" | "gathering" | "open";

export type Preview = Extract<ChangeResponse, { accepted: true }> & { ops: Op[]; restoring?: number };

export interface SanctumSnapshot {
  status: Status;
  state: SanctumState | null;
  /** A dry run awaiting the seal (the sight shows it ghosted). */
  preview: Preview | null;
  refusals: Refusal[];
  record: RecordEntry[] | null;
  /** Visions brought but not yet set into the map. */
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
  /** Checks locally, then asks the server for a dry run. */
  preview(ops: Op[], summary?: string): Promise<boolean>;
  /** Seals the ops (or the current preview's ops) as a new entry of the record. */
  seal(ops?: Op[], summary?: string): Promise<boolean>;
  clearPreview(): void;
  restore(version: number, dryRun?: boolean): Promise<boolean>;
  loadRecord(): Promise<RecordEntry[]>;
  recordAt(version: number): Promise<SanctumState>;
  bringVision(picture: Blob): Promise<VisionFiles | null>;
}

const INITIAL: SanctumSnapshot = { status: "unknown", state: null, preview: null, refusals: [], record: null, brought: {}, busy: false, word: "" };

export function createSanctumStore(): SanctumStore {
  let snap = INITIAL;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SanctumSnapshot>) => {
    snap = { ...snap, ...patch };
    listeners.forEach((l) => l());
  };

  /** Runs a call; a lost entry returns to the gate, other refusals become words. */
  async function guarded<T>(fn: () => Promise<T>): Promise<T | undefined> {
    set({ busy: true });
    try {
      return await fn();
    } catch (err) {
      if (err instanceof NotEntered) set({ status: "gate", state: null, preview: null, record: null });
      else set({ word: err instanceof Refused ? err.message : "The sanctum could not answer." });
      return undefined;
    } finally {
      set({ busy: false });
    }
  }

  const answer = (res: ChangeResponse, ops: Op[], dryRun: boolean, restoring?: number): boolean => {
    if (!res.accepted) {
      set({ refusals: res.refusals, preview: null, word: res.refusals[0]?.message ?? "" });
      if (res.refusals.some((r) => r.rule === "moved")) void store.gather();
      return false;
    }
    if (dryRun) set({ preview: { ...res, ops, ...(restoring ? { restoring } : {}) }, refusals: [], word: "" });
    else set({ state: res.state, preview: null, refusals: [], record: null, word: "The change is sealed." });
    return true;
  };

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
      await guarded(() => api.leave());
      snap = INITIAL;
      set({ status: "gate" });
    },

    async gather() {
      if (!snap.state) set({ status: "gathering" });
      const state = await guarded(() => api.map());
      if (state) set({ status: "open", state, preview: null });
    },

    async preview(ops, summary) {
      const state = snap.state;
      if (!state) return false;
      const local = checkLocally(state, ops, snap.brought);
      if (local.refusals.length) {
        set({ refusals: local.refusals, preview: null, word: local.refusals[0].message });
        return false;
      }
      const res = await guarded(() => api.change({ ops, dryRun: true, baseVersion: state.meta.version, summary }));
      return res ? answer(res, ops, true) : false;
    },

    async seal(ops, summary) {
      const state = snap.state;
      const chosen = ops ?? snap.preview?.ops;
      if (!state || !chosen) return false;
      if (!ops && snap.preview?.restoring) return store.restore(snap.preview.restoring, false);
      const res = await guarded(() => api.change({ ops: chosen, baseVersion: state.meta.version, summary: summary ?? snap.preview?.summary }));
      return res ? answer(res, chosen, false) : false;
    },

    clearPreview() {
      set({ preview: null, refusals: [], word: "" });
    },

    async restore(version, dryRun = true) {
      const state = snap.state;
      if (!state) return false;
      const res = await guarded(() => api.restore(version, state.meta.version, dryRun));
      return res ? answer(res, [], dryRun, version) : false;
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
