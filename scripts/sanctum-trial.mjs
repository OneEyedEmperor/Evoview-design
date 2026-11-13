#!/usr/bin/env node
/* A throwaway copy of the sanctum's data dir, for testing seals without
   touching the real record. Its own test watchword (never the real one)
   is hashed into its auth.json and written to <trial>/trial-watchword (600).

   node scripts/sanctum-trial.mjs [--fresh]       copy (--fresh replaces an existing trial)
   EVOVIEW_SANCTUM_DIR=/root/.evoview-sanctum-trial pnpm exec vite --port 37512 --strictPort --host 127.0.0.1 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hashWatchword } from "../server/sanctum/auth.ts";
import { DEFAULT_DIR } from "../server/sanctum/store.ts";

const source = DEFAULT_DIR;
const trial = process.env.EVOVIEW_SANCTUM_TRIAL || `${DEFAULT_DIR}-trial`;
if (path.resolve(trial) === path.resolve(source) || !trial.endsWith("-trial")) {
  console.error(`refusing: the trial dir must end in -trial and differ from ${source}`);
  process.exit(1);
}
if (fs.existsSync(trial)) {
  if (!process.argv.includes("--fresh")) {
    console.error(`${trial} exists; use --fresh to replace it`);
    process.exit(1);
  }
  fs.rmSync(trial, { recursive: true, force: true });
}

fs.mkdirSync(path.join(trial, "seed"), { recursive: true, mode: 0o700 });
fs.mkdirSync(path.join(trial, "state", "history"), { recursive: true, mode: 0o700 });
fs.mkdirSync(path.join(trial, "visions"), { recursive: true, mode: 0o700 });
fs.chmodSync(trial, 0o700);
fs.copyFileSync(path.join(source, "seed", "canon.json"), path.join(trial, "seed", "canon.json"));
fs.copyFileSync(path.join(source, "state", "current.json"), path.join(trial, "state", "current.json"));
for (const f of fs.readdirSync(path.join(source, "state", "history"))) {
  if (f.endsWith(".json")) fs.copyFileSync(path.join(source, "state", "history", f), path.join(trial, "state", "history", f));
}
/* Existing visions are read-only: linked, not copied. New ones are written into the trial. */
for (const v of fs.readdirSync(path.join(source, "visions"))) {
  if (!v.startsWith(".")) fs.symlinkSync(path.join(source, "visions", v), path.join(trial, "visions", v));
}
const word = crypto.randomBytes(9).toString("base64url");
fs.writeFileSync(path.join(trial, "auth.json"), JSON.stringify(await hashWatchword(word), null, 2), { mode: 0o600 });
fs.writeFileSync(path.join(trial, "trial-watchword"), `${word}\n`, { mode: 0o600 });
console.log(`trial ready: ${trial} (test watchword in ${path.join(trial, "trial-watchword")})`);
console.log(`serve: EVOVIEW_SANCTUM_DIR=${trial} pnpm exec vite --port 37512 --strictPort --host 127.0.0.1`);
