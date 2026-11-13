#!/usr/bin/env node
/* Live entries of the data dir (EVOVIEW_SANCTUM_DIR or /root/.evoview-sanctum).

   node scripts/sanctum-entries.mjs           count the live entries
   node scripts/sanctum-entries.mjs revoke    revoke every entry (the watchword is kept;
                                              known-device marks stay, they open nothing) */

import path from "node:path";
import { dataDir, readJson, writeAtomic } from "../server/sanctum/store.ts";

const file = path.join(dataDir(), "entries.json");
const all = readJson(file) ?? {};
const now = Date.now();
const live = Object.values(all).filter((exp) => typeof exp === "number" && exp > now).length;
if (process.argv[2] === "revoke") {
  writeAtomic(file, "{}");
  console.log(`revoked ${live} live entr${live === 1 ? "y" : "ies"} in ${file}`);
} else {
  console.log(`${live} live entr${live === 1 ? "y" : "ies"} in ${file}`);
}
