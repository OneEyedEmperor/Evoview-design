#!/usr/bin/env node
/* Live entries of the data dir (EVOVIEW_SANCTUM_DIR or /root/.evoview-sanctum).

   node scripts/sanctum-entries.mjs                  count the live entries
   node scripts/sanctum-entries.mjs revoke [--real]  revoke every entry (the watchword is kept;
                                                     known-device marks stay, they open nothing);
                                                     on the real dir only with --real */

import path from "node:path";
import { isRealDir } from "../server/sanctum/auth.ts";
import { dataDir, readJson, writeAtomic } from "../server/sanctum/store.ts";

const dir = dataDir();
const file = path.join(dir, "entries.json");
const all = readJson(file) ?? {};
const now = Date.now();
const live = Object.values(all).filter((exp) => typeof exp === "number" && exp > now).length;
if (process.argv[2] === "revoke") {
  if (isRealDir(dir) && !process.argv.includes("--real")) {
    console.error(`refusing: ${dir} is the real data dir; pass --real to revoke there (trial dirs: set EVOVIEW_SANCTUM_DIR)`);
    process.exit(3);
  }
  writeAtomic(file, "{}");
  console.log(`revoked ${live} live entr${live === 1 ? "y" : "ies"} in ${file}`);
} else {
  console.log(`${live} live entr${live === 1 ? "y" : "ies"} in ${file}`);
}
