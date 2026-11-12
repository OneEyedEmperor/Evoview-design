#!/usr/bin/env node
/* Generates the watchword once: six random dictionary words (~90 bits).
   Plaintext goes only to the Vibehub secret vault (EVOVIEW_SANCTUM_WATCHWORD);
   the data dir keeps an scrypt hash. Nothing is printed but the outcome.

   node scripts/sanctum-watchword.mjs            first time only
   node scripts/sanctum-watchword.mjs --rotate   new watchword, every entry revoked */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hashWatchword } from "../server/sanctum/auth.ts";
import { dataDir, writeAtomic } from "../server/sanctum/store.ts";

const ENV_VAR = "EVOVIEW_SANCTUM_WATCHWORD";
const dir = dataDir();
const authPath = path.join(dir, "auth.json");
const rotate = process.argv.includes("--rotate");

if (fs.existsSync(authPath) && !rotate) {
  console.error("auth.json exists; use --rotate to replace the watchword");
  process.exit(1);
}
const base = process.env.VIBEHUB_URL;
const key = process.env.VIBEHUB_API_KEY;
if (!base || !key) {
  console.error("VIBEHUB_URL / VIBEHUB_API_KEY missing");
  process.exit(1);
}

const words = fs
  .readFileSync("/usr/share/dict/words", "utf8")
  .split("\n")
  .filter((w) => /^[a-z]{4,8}$/.test(w));
const watchword = Array.from({ length: 6 }, () => words[crypto.randomInt(words.length)]).join("-");

const api = (method, p, body) =>
  fetch(`${base}${p}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

const description = "Watchword of the hidden /sanctum page of the Evoview library (scrypt hash in /root/.evoview-sanctum/auth.json).";
const listed = await (await api("GET", `/api/secrets?q=${ENV_VAR}`)).json();
const existing = (listed.secrets ?? []).find((s) => s.envVar === ENV_VAR || s.key === ENV_VAR);
const res = existing
  ? await api("PUT", `/api/secrets/${encodeURIComponent(existing.key)}`, { value: watchword, description })
  : await api("POST", "/api/secrets", { key: ENV_VAR, envVar: ENV_VAR, value: watchword, description, category: "evoview" });
if (!res.ok) {
  console.error(`vault refused: ${res.status}`);
  process.exit(1);
}

const auth = await hashWatchword(watchword);
writeAtomic(authPath, JSON.stringify(auth, null, 2));
fs.rmSync(path.join(dir, "entries.json"), { force: true });
console.log(`watchword ${existing ? "rotated" : "created"}: plaintext in the vault as ${ENV_VAR}, scrypt hash in ${authPath}`);
