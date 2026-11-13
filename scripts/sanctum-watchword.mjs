#!/usr/bin/env node
/* The watchword is chosen by the emperor himself and passes through no agent,
   no vault and no log: this script only issues a one-time summons. Issuing it
   voids the current watchword at once (with every entry and device mark), so
   the gate is closed to everyone until the summons is sealed. Its link
   carries the token in the fragment, which browsers never send to a server.
   Answering it stores the scrypt hash of the chosen watchword and enters.
   The data dir keeps only the token's hash; it expires and serves once.

   node scripts/sanctum-watchword.mjs --setup [--base=https://evoview-library.said.bet] [--minutes=60] [--real]
   node scripts/sanctum-watchword.mjs --void [--real]     close the gate: no watchword opens it, no summons
   node scripts/sanctum-watchword.mjs --status

   EVOVIEW_SANCTUM_DIR selects the data dir (default /root/.evoview-sanctum).
   --setup and --void refuse to act on the real dir unless --real is given. */

import fs from "node:fs";
import path from "node:path";
import { SETUP_TTL_MS, isRealDir, pendingSetup, summon, voidWatchword } from "../server/sanctum/auth.ts";
import { dataDir, ensureDir, readJson } from "../server/sanctum/store.ts";

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const dir = dataDir();

if ((args.includes("--setup") || args.includes("--void")) && isRealDir(dir) && !args.includes("--real")) {
  console.error(`refusing: ${dir} is the real data dir; pass --real to act on it (trial dirs: set EVOVIEW_SANCTUM_DIR)`);
  process.exit(3);
}

if (args.includes("--void")) {
  ensureDir(dir);
  await voidWatchword(dir);
  console.log(`${dir}: the watchword, entries and device marks are void; no summons is pending; the gate is closed to everyone`);
} else if (args.includes("--setup")) {
  ensureDir(dir);
  const minutes = Number(opt("minutes") ?? SETUP_TTL_MS / 60000);
  if (!(minutes > 0 && minutes <= 24 * 60)) {
    console.error("--minutes must be between 1 and 1440");
    process.exit(2);
  }
  const base = (opt("base") ?? "https://evoview-library.said.bet").replace(/\/+$/, "");
  const token = await summon(dir, minutes * 60000);
  console.log(`summons for ${dir}: the current watchword, entries and device marks are void now;`);
  console.log(`the gate is closed until this summons is sealed (valid ${minutes} min, serves once):`);
  console.log(`${base}/sanctum#setup=${token}`);
} else if (args.includes("--status")) {
  const pending = pendingSetup(dir);
  const auth = readJson(path.join(dir, "auth.json"));
  const until = (t) => new Date(t).toISOString().slice(11, 16) + " UTC";
  const watchword = !fs.existsSync(path.join(dir, "auth.json")) ? "no watchword" : auth?.voided ? "watchword voided" : "watchword set";
  const lapsed = !pending && fs.existsSync(path.join(dir, "setup.json"));
  const summons = pending
    ? `summons pending, expires ${until(pending.expires)}`
    : lapsed
      ? "summons lapsed: the gate is closed until a new summons is sealed"
      : "no summons pending";
  console.log(`${dir}: ${watchword}, ${summons}`);
} else {
  console.error("usage: --setup [--base=URL] [--minutes=N] [--real] | --void [--real] | --status");
  process.exit(2);
}
