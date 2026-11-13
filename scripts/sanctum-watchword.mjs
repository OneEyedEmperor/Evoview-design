#!/usr/bin/env node
/* The watchword is chosen by the emperor himself and passes through no agent,
   no vault and no log: this script only issues a one-time summons. Its link
   carries the token in the fragment, which browsers never send to a server.
   Answering it stores the scrypt hash, voids every entry and device mark, and
   enters. The data dir keeps only the token's hash; it expires and serves once.

   node scripts/sanctum-watchword.mjs --setup [--base=https://evoview-library.said.bet] [--minutes=60]
   node scripts/sanctum-watchword.mjs --status

   EVOVIEW_SANCTUM_DIR selects the data dir (default /root/.evoview-sanctum). */

import fs from "node:fs";
import path from "node:path";
import { SETUP_TTL_MS, issueSetup, pendingSetup } from "../server/sanctum/auth.ts";
import { dataDir, ensureDir } from "../server/sanctum/store.ts";

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const dir = dataDir();

if (args.includes("--setup")) {
  ensureDir(dir);
  const minutes = Number(opt("minutes") ?? SETUP_TTL_MS / 60000);
  if (!(minutes > 0 && minutes <= 24 * 60)) {
    console.error("--minutes must be between 1 and 1440");
    process.exit(2);
  }
  const base = (opt("base") ?? "https://evoview-library.said.bet").replace(/\/+$/, "");
  const token = issueSetup(dir, minutes * 60000);
  console.log(`summons for ${dir}, valid ${minutes} min, serves once (any earlier summons is replaced):`);
  console.log(`${base}/sanctum#setup=${token}`);
} else if (args.includes("--status")) {
  const pending = pendingSetup(dir);
  const hasHash = fs.existsSync(path.join(dir, "auth.json"));
  console.log(`${dir}: watchword hash ${hasHash ? "present" : "absent"}; summons ${pending ? `pending, ${Math.ceil((pending.expires - Date.now()) / 60000)} min left` : "none pending"}`);
} else {
  console.error("usage: --setup [--base=URL] [--minutes=N] | --status");
  process.exit(2);
}
