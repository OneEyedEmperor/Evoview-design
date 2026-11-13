#!/usr/bin/env node
/* Sanctum importer (trusted tool; the manifest and all content live in the
   private data dir, EVOVIEW_SANCTUM_DIR or /root/.evoview-sanctum).

   node scripts/sanctum-import.mjs seed [--force]  vault → seed/ + state v1
   node scripts/sanctum-import.mjs merge [file]     explanations + readings → new state
   node scripts/sanctum-import.mjs rules [--dry]    rule tables re-read from the manifest → new state
   node scripts/sanctum-import.mjs amend <file> [--dry]
                                                    canon amendments (rulings): each entry of the
                                                    private file is checked and sealed as its own state
   node scripts/sanctum-import.mjs check            current state against every invariant

   seed reproduces the vault only; later canon lives in the record (merge, rules, amend). */

import fs from "node:fs";
import path from "node:path";
import { amendRules, applyAmendment, buildSeed, mergeExplanations } from "../server/sanctum/importer.ts";
import { Store, dataDir, ensureDir, readJson, writeAtomic } from "../server/sanctum/store.ts";
import { canonOf, validate } from "../src/sanctum/model/validate.ts";
import { diffStates } from "../src/sanctum/model/ops.ts";
import { SCHEMA_VERSION } from "../src/sanctum/model/types.ts";

const [mode = "check", ...rest] = process.argv.slice(2);
const dir = dataDir();
const store = new Store(dir);
const manifest = readJson(path.join(dir, "seed", "manifest.json"));
fs.chmodSync(dir, 0o700);

function report(refusals) {
  for (const r of refusals) console.error(`  [${r.rule}] ${r.message}`);
}

if (mode === "seed") {
  if (!manifest) throw new Error("no seed/manifest.json in the data dir");
  if (store.exists()) {
    if (!rest.includes("--force")) {
      console.error("state exists; use --force to archive it and seed again");
      process.exit(1);
    }
    const archive = path.join(dir, "archive", new Date().toISOString().replace(/[:.]/g, "-"));
    ensureDir(archive);
    fs.renameSync(path.join(dir, "state"), path.join(archive, "state"));
    if (fs.existsSync(store.canonPath)) fs.renameSync(store.canonPath, path.join(archive, "canon.json"));
    console.log(`archived previous state to ${archive}`);
  }
  const { state, vault } = await buildSeed(manifest, dir);
  const canon = canonOf(state);
  const refusals = validate(state, canon);
  if (refusals.length) {
    console.error(`seed refused (${refusals.length}):`);
    report(refusals);
    process.exit(1);
  }
  writeAtomic(path.join(dir, "seed", "vault.json"), JSON.stringify(vault, null, 2));
  store.writeCanon(canon);
  store.seal(state, { version: 1, at: state.meta.updatedAt, summary: state.meta.summary, ops: 0, trusted: "seed" });
  console.log(`seeded v1: ${state.elements.length} elements, ${state.threads.length} cords, ${state.ties.length} ties, ${state.visions.length} visions`);
} else if (mode === "merge") {
  const file = rest.find((a) => !a.startsWith("--")) ?? manifest?.explanations;
  if (!file || !fs.existsSync(file)) {
    console.error(`no explanations at ${file ?? "(none given)"}`);
    process.exit(1);
  }
  const base = store.current();
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const { state, canon, applied, refused } = mergeExplanations(base, store.canon(), data);
  for (const r of refused) {
    console.error(`refused ${r.what}:`);
    report(r.refusals);
  }
  if (!applied.length) {
    console.error("nothing to merge");
    process.exit(refused.length ? 1 : 0);
  }
  const version = base.meta.version + 1;
  const summary = rest.find((a) => a.startsWith("--summary="))?.slice(10) || "The explanations and readings were set into the map.";
  state.meta = { schemaVersion: SCHEMA_VERSION, version, updatedAt: new Date().toISOString(), summary };
  const final = validate(state, canon);
  if (final.length) {
    report(final);
    process.exit(1);
  }
  store.writeCanon(canon);
  store.seal(state, { version, at: state.meta.updatedAt, summary, ops: applied.length, trusted: "merge" });
  const d = diffStates(base, state);
  console.log(`merged into v${version}: ${applied.length} applied, ${refused.length} refused; readings +${d.readings.added.length} ~${d.readings.changed.length}`);
} else if (mode === "rules") {
  if (!manifest) throw new Error("no seed/manifest.json in the data dir");
  const base = store.current();
  const { state, canon, changed } = amendRules(base, store.canon(), manifest);
  if (!changed.length) {
    console.log("the rules already match the manifest");
    process.exit(0);
  }
  const version = base.meta.version + 1;
  const summary = "The rules of the cords were amended.";
  state.meta = { schemaVersion: SCHEMA_VERSION, version, updatedAt: new Date().toISOString(), summary };
  const refusals = validate(state, canon);
  console.log(`changed: ${changed.join(", ")}`);
  if (refusals.length) {
    console.error("the map would not hold under the amended rules:");
    report(refusals);
    process.exit(1);
  }
  if (rest.includes("--dry")) {
    console.log("dry: nothing sealed");
    process.exit(0);
  }
  store.writeCanon(canon);
  store.seal(state, { version, at: state.meta.updatedAt, summary, ops: 0, trusted: "rules" });
  console.log(`sealed v${version}`);
} else if (mode === "amend") {
  const file = rest.find((a) => !a.startsWith("--"));
  if (!file || !fs.existsSync(file)) {
    console.error("usage: amend <file> [--dry]");
    process.exit(2);
  }
  const { entries } = JSON.parse(fs.readFileSync(file, "utf8"));
  /* Every entry is checked before any is sealed. */
  let state = store.current();
  const results = [];
  for (const [i, entry] of entries.entries()) {
    const result = applyAmendment(state, entry);
    if (result.refusals.length) {
      console.error(`entry ${i + 1} ("${entry.summary}") refused; nothing sealed:`);
      report(result.refusals);
      process.exit(1);
    }
    const version = state.meta.version + 1;
    result.state.meta = { schemaVersion: result.state.meta.schemaVersion, version, updatedAt: new Date().toISOString(), summary: entry.summary };
    results.push({ entry, ...result });
    state = result.state;
  }
  if (!rest.includes("--dry")) {
    for (const { entry, state: s, canon } of results) {
      store.writeCanon(canon);
      store.seal(s, { version: s.meta.version, at: s.meta.updatedAt, summary: entry.summary, ops: entry.edits.length, trusted: "amend" });
    }
  }
  console.log(`${rest.includes("--dry") ? "dry, would seal" : "sealed"}: ${results.map((r) => `v${r.state.meta.version}`).join(", ")}`);
} else if (mode === "check") {
  const state = store.current();
  const refusals = validate(state, store.canon());
  console.log(`v${state.meta.version}: ${state.elements.length} elements, ${state.threads.length} cords, ${state.ties.length} ties, ${state.visions.length} visions, ${state.readings.length} readings; ${refusals.length} refusals`);
  report(refusals);
  process.exit(refusals.length ? 1 : 0);
} else {
  console.error(`unknown mode ${mode}`);
  process.exit(2);
}
