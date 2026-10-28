#!/usr/bin/env node
// Evoview library → client package sync: plan | apply | verify. Contract: docs/SYNC.md.
// Node stdlib + the git CLI only, so it runs against any client without an install step.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = 1;
const CODE_EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const RESOLVE_EXT = [...CODE_EXT, ".json", ".css"];
const NOEOL = "\u0000noeol";
const EXIT = { ok: 0, error: 1, review: 2 };

class Fail extends Error {}

const USAGE = `usage: sync.sh <plan|apply|verify> <client-dir> [package[@ref]…] [flags]

  plan     read-only: classify every file, check compatibility and the host
  apply    plan, then write (refuses on blockers or foreign uncommitted changes)
  verify   structural checks of the installed packages (no rendering)

  Without packages, plan/apply take every installed package, verify checks them all.

flags
  --ref <rev>              library commit / tag / branch to install (default HEAD)
  --worktree               read the library working tree (library development only)
  --components-dir <dir>   client components dir, relative to the client (default src/components)
  --json                   machine-readable output
  --brief                  plan: changelog highlights and template file names only
  --force                  apply: proceed despite uncommitted client changes in the target dirs
  --if-clean               apply: refuse unless the plan is clean (what install.sh uses)
  --typecheck              verify: also run the client's tsc

exit 0 clean · 2 needs review · 1 error. Contract: docs/SYNC.md`;

// ── process helpers ─────────────────────────────────────────────────────

function run(cmd, args, { cwd = LIB, input, allowFail = false, encoding = "utf8" } = {}) {
  const r = spawnSync(cmd, args, { cwd, input, maxBuffer: 1 << 30, ...(encoding === "buffer" ? {} : { encoding }) });
  if (r.error) throw new Fail(`${cmd}: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) {
    throw new Fail(`${cmd} ${args.join(" ")} failed: ${String(r.stderr ?? "").trim()}`);
  }
  return r;
}
const git = (args, o) => run("git", args, o);
const short = (sha) => (sha ? sha.slice(0, 8) : "—");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const toPosix = (p) => p.split(path.sep).join("/");

let objectFormat = null;
function gitOid(buf) {
  objectFormat ??= git(["rev-parse", "--show-object-format"]).stdout.trim() || "sha1";
  return crypto.createHash(objectFormat === "sha256" ? "sha256" : "sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}

function revParse(ref) {
  const r = git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { allowFail: true });
  if (r.status !== 0) throw new Fail(`unknown library ref "${ref}"`);
  return r.stdout.trim();
}
const commitExists = (sha) => git(["cat-file", "-e", `${sha}^{commit}`], { allowFail: true }).status === 0;

// `git cat-file --batch` for many objects in one process; null for missing ones.
function catBatch(specs, check = false) {
  if (!specs.length) return [];
  const r = run("git", ["cat-file", check ? "--batch-check" : "--batch"], { input: specs.join("\n") + "\n", encoding: "buffer" });
  const out = r.stdout;
  const res = [];
  let pos = 0;
  for (let i = 0; i < specs.length; i++) {
    const nl = out.indexOf(10, pos);
    const header = out.subarray(pos, nl).toString("utf8");
    pos = nl + 1;
    if (/ (missing|ambiguous)$/.test(header)) { res.push(null); continue; }
    const [oid, , size] = header.split(" ");
    if (check) { res.push(oid); continue; }
    res.push(out.subarray(pos, pos + Number(size)));
    pos += Number(size) + 1;
  }
  return res;
}

const blobs = new Map();
function loadOids(oids) {
  const need = [...new Set(oids)].filter((o) => !blobs.has(o));
  catBatch(need).forEach((buf, i) => {
    if (!buf) throw new Fail(`missing git object ${need[i]}`);
    blobs.set(need[i], buf);
  });
}
function blob(oid) {
  if (!blobs.has(oid)) loadOids([oid]);
  return blobs.get(oid);
}

function lsTree(commit, prefix) {
  const r = git(["ls-tree", "-r", "-z", commit, "--", prefix]);
  const entries = [];
  for (const rec of r.stdout.split("\0")) {
    if (!rec) continue;
    const tab = rec.indexOf("\t");
    const [mode, type, oid] = rec.slice(0, tab).split(" ");
    entries.push({ mode, type, oid, path: rec.slice(tab + 1) });
  }
  return entries;
}

function walk(dir, base = dir, out = new Map()) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, base, out);
    else if (ent.isFile() || ent.isSymbolicLink()) out.set(toPosix(path.relative(base, abs)), abs);
  }
  return out;
}

// ── semver (the subset evoview.json uses: comparators, x-ranges, ^, ~, ||) ─

function parseVer(s) {
  const m = /^\s*v?(\d+)\.(\d+)\.(\d+)/.exec(String(s ?? ""));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmpVer(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
const cmpStr = (a, b) => cmpVer(parseVer(a), parseVer(b));

function testComparator(v, c) {
  const m = /^(>=|<=|>|<|=|\^|~)?v?(\d+|x|\*)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/.exec(c);
  if (!m) throw new Fail(`unsupported version range "${c}"`);
  if (m[2] === "x" || m[2] === "*") return true;
  const parts = [m[2], m[3], m[4]].map((p) => (p === undefined || p === "x" || p === "*" ? null : Number(p)));
  const lo = parts.map((p) => p ?? 0);
  const firstNull = parts.indexOf(null);
  const precision = firstNull === -1 ? 3 : firstNull;
  const bump = (idx) => lo.map((p, i) => (i < idx ? p : i === idx ? p + 1 : 0));
  const op = m[1] ?? "=";
  switch (op) {
    case ">=": return cmpVer(v, lo) >= 0;
    case "<": return cmpVer(v, lo) < 0;
    case ">": return precision === 3 ? cmpVer(v, lo) > 0 : cmpVer(v, bump(precision - 1)) >= 0;
    case "<=": return precision === 3 ? cmpVer(v, lo) <= 0 : cmpVer(v, bump(precision - 1)) < 0;
    case "=": return precision === 3 ? cmpVer(v, lo) === 0 : cmpVer(v, lo) >= 0 && cmpVer(v, bump(precision - 1)) < 0;
    case "^": {
      const idx = lo[0] > 0 || precision === 1 ? 0 : lo[1] > 0 || precision === 2 ? 1 : 2;
      return cmpVer(v, lo) >= 0 && cmpVer(v, bump(idx)) < 0;
    }
    case "~": return cmpVer(v, lo) >= 0 && cmpVer(v, bump(precision === 1 ? 0 : 1)) < 0;
  }
  return false;
}
function satisfies(version, range) {
  const v = parseVer(version);
  if (!v) return false;
  return String(range).split("||").some((alt) => {
    const comps = alt.trim().replace(/([<>=^~]+)\s+/g, "$1").split(/\s+/).filter(Boolean);
    return comps.every((c) => testComparator(v, c));
  });
}

// ── line diff (Myers, with common prefix/suffix trimmed) ─────────────────

function splitLines(text) {
  if (text === "") return [];
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  else lines[lines.length - 1] += NOEOL;
  return lines;
}

function diffOps(a, b, cap = 2000) {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let ea = a.length;
  let eb = b.length;
  while (ea > pre && eb > pre && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
  const ops = [];
  for (let i = 0; i < pre; i++) ops.push({ t: "=", i, j: i });
  ops.push(...myers(a, pre, ea, b, pre, eb, cap));
  for (let k = 0; k < a.length - ea; k++) ops.push({ t: "=", i: ea + k, j: eb + k });
  return ops;
}

function myers(a, a0, a1, b, b0, b1, cap) {
  const N = a1 - a0;
  const M = b1 - b0;
  const dels = () => Array.from({ length: N }, (_, k) => ({ t: "-", i: a0 + k }));
  const adds = () => Array.from({ length: M }, (_, k) => ({ t: "+", j: b0 + k }));
  if (!N || !M) return [...dels(), ...adds()];
  const max = N + M;
  const off = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace = [];
  for (let d = 0; d <= max; d++) {
    // Past the cap a minimal script is not worth the memory: replace the block.
    if (d > cap) return [...dels(), ...adds()];
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && a[a0 + x] === b[b0 + y]) { x++; y++; }
      v[off + k] = x;
      if (x >= N && y >= M) return backtrack(trace, a0, b0, N, M);
    }
  }
  return [...dels(), ...adds()];
}

function backtrack(trace, a0, b0, N, M) {
  const ops = [];
  let x = N;
  let y = M;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vd = trace[d];
    const get = (k) => vd[k + d + 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1;
    const prevX = get(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push({ t: "=", i: a0 + x - 1, j: b0 + y - 1 }); x--; y--; }
    if (d > 0) ops.push(x === prevX ? { t: "+", j: b0 + y - 1 } : { t: "-", i: a0 + x - 1 });
    x = prevX;
    y = prevY;
  }
  return ops.reverse();
}

const isBinary = (buf) => buf.subarray(0, 8000).includes(0);
const changeCountCache = new Map();
function changedLines(aBuf, bBuf) {
  if (isBinary(aBuf) || isBinary(bBuf)) return 1;
  const key = `${gitOid(aBuf)}:${gitOid(bBuf)}`;
  if (!changeCountCache.has(key)) {
    const ops = diffOps(splitLines(aBuf.toString("utf8")), splitLines(bBuf.toString("utf8")));
    changeCountCache.set(key, ops.filter((o) => o.t !== "=").length);
  }
  return changeCountCache.get(key);
}
const lineCount = (buf) => (isBinary(buf) ? 1 : splitLines(buf.toString("utf8")).length || 1);

// git-style unified diff of one file; null side = absent.
function unifiedDiff(rel, aBuf, bBuf, context = 3) {
  const head = [`diff --git a/${rel} b/${rel}`];
  if (!aBuf) head.push("new file mode 100644");
  if (!bBuf) head.push("deleted file mode 100644");
  if ((aBuf && isBinary(aBuf)) || (bBuf && isBinary(bBuf))) {
    return `${head.join("\n")}\nBinary files ${aBuf ? `a/${rel}` : "/dev/null"} and ${bBuf ? `b/${rel}` : "/dev/null"} differ\n`;
  }
  const a = splitLines(aBuf ? aBuf.toString("utf8") : "");
  const b = splitLines(bBuf ? bBuf.toString("utf8") : "");
  const ops = diffOps(a, b);
  if (!ops.some((o) => o.t !== "=")) return "";
  head.push(`--- ${aBuf ? `a/${rel}` : "/dev/null"}`, `+++ ${bBuf ? `b/${rel}` : "/dev/null"}`);
  const aPos = [];
  const bPos = [];
  let ai = 0;
  let bi = 0;
  for (const o of ops) {
    aPos.push(ai);
    bPos.push(bi);
    if (o.t !== "+") ai++;
    if (o.t !== "-") bi++;
  }
  const out = [];
  const line = (prefix, text) => (text.endsWith(NOEOL) ? `${prefix}${text.slice(0, -NOEOL.length)}\n\\ No newline at end of file` : `${prefix}${text}`);
  let idx = 0;
  while (idx < ops.length) {
    if (ops[idx].t === "=") { idx++; continue; }
    const start = Math.max(idx - context, 0);
    let last = idx;
    let j = idx;
    while (j < ops.length) {
      if (ops[j].t !== "=") { last = j; j++; continue; }
      let r = j;
      while (r < ops.length && ops[r].t === "=") r++;
      if (r < ops.length && r - j <= 2 * context) { j = r; continue; }
      break;
    }
    const end = Math.min(last + context + 1, ops.length);
    const hunk = ops.slice(start, end);
    const oldLen = hunk.filter((o) => o.t !== "+").length;
    const newLen = hunk.filter((o) => o.t !== "-").length;
    const oldStart = oldLen ? aPos[start] + 1 : aPos[start];
    const newStart = newLen ? bPos[start] + 1 : bPos[start];
    out.push(`@@ -${oldStart},${oldLen} +${newStart},${newLen} @@`);
    for (const o of hunk) out.push(o.t === "=" ? line(" ", a[o.i]) : o.t === "-" ? line("-", a[o.i]) : line("+", b[o.j]));
    idx = end;
  }
  return `${head.join("\n")}\n${out.join("\n")}\n`;
}

// Identifiers (custom properties, camelCase, snake_case) a side adds that the base never had.
// The same new identifier on both sides means the client's patch and upstream may implement
// the same thing: a clean textual merge can then apply it twice.
const IDENT = /--[A-Za-z][\w-]*|[A-Za-z_$][\w$]*/g;
const identLike = (t) => t.length >= 5 && (t.startsWith("--") || /[a-z][A-Z]|_/.test(t));
function newIdents(baseBuf, sideBuf) {
  const baseText = baseBuf.toString("utf8");
  const a = splitLines(baseText);
  const b = splitLines(sideBuf.toString("utf8"));
  const known = new Set(baseText.match(IDENT) ?? []);
  const out = new Set();
  for (const o of diffOps(a, b)) if (o.t === "+") for (const t of b[o.j].match(IDENT) ?? []) if (identLike(t) && !known.has(t)) out.add(t);
  return out;
}
function sharedNewIdents(o, b, t) {
  if (!b) return [];
  const theirs = newIdents(b, t);
  return [...newIdents(b, o)].filter((x) => theirs.has(x)).slice(0, 6);
}

function merge3(ours, base, theirs, labels) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evoview-merge-"));
  try {
    const files = ["ours", "base", "theirs"].map((n) => path.join(dir, n));
    [ours, base, theirs].forEach((buf, i) => fs.writeFileSync(files[i], buf));
    const r = spawnSync("git", ["merge-file", "-p", "--diff3", "-L", labels[0], "-L", labels[1], "-L", labels[2], ...files], { cwd: dir, maxBuffer: 1 << 30 });
    if (r.error || r.status === null || r.status > 127) throw new Fail(`git merge-file failed: ${String(r.stderr ?? r.error)}`);
    return { buf: r.stdout, conflicts: r.status };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const MARKER = /^(<{7}|>{7}|\|{7}) /m;
const hasMarkers = (buf) => !isBinary(buf) && MARKER.test(buf.toString("utf8"));

// ── library snapshots ───────────────────────────────────────────────────

const snapCache = new Map();
function snapshot(target, name) {
  const key = `${target.kind}:${target.commit}:${name}`;
  if (!snapCache.has(key)) snapCache.set(key, target.kind === "worktree" ? worktreeSnapshot(name, target) : gitSnapshot(target.commit, name, target.ref));
  return snapCache.get(key);
}

function gitSnapshot(commit, name, ref = commit) {
  const prefix = `components/${name}/`;
  const [version, metaBuf, changelog] = catBatch([`${commit}:${prefix}VERSION`, `${commit}:${prefix}evoview.json`, `${commit}:${prefix}CHANGELOG.md`]);
  if (!version) return null;
  const files = new Map();
  for (const e of lsTree(commit, `${prefix}src`)) {
    if (e.type !== "blob") continue;
    if (e.mode === "120000") throw new Fail(`${name} at ${short(commit)}: symlink ${e.path} in src/ is not supported`);
    files.set(e.path.slice(prefix.length + 4), { oid: e.oid, mode: e.mode });
  }
  const snap = { name, kind: "git", commit, ref, dirty: false, version: version.toString("utf8").trim(), files, changelog: changelog?.toString("utf8") ?? null, metaRaw: metaBuf?.toString("utf8") ?? null };
  snap.meta = resolveMeta(snap);
  return snap;
}

function worktreeSnapshot(name, target) {
  const dir = path.join(LIB, "components", name);
  if (!fs.existsSync(path.join(dir, "VERSION"))) return null;
  const files = new Map();
  for (const [rel, abs] of walk(path.join(dir, "src"))) {
    const st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) throw new Fail(`${name} (worktree): symlink src/${rel} is not supported`);
    const buf = fs.readFileSync(abs);
    const oid = gitOid(buf);
    blobs.set(oid, buf);
    files.set(rel, { oid, mode: st.mode & 0o111 ? "100755" : "100644" });
  }
  const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8") : null);
  const dirty = git(["status", "--porcelain", "--untracked-files=all", "--", `components/${name}`]).stdout.trim() !== "";
  const snap = { name, kind: "worktree", commit: target.commit, ref: "worktree", dirty, version: read("VERSION").trim(), files, changelog: read("CHANGELOG.md"), metaRaw: read("evoview.json") };
  snap.meta = resolveMeta(snap);
  return snap;
}

function resolveMeta(snap) {
  if (snap.metaRaw) {
    let m;
    try { m = JSON.parse(snap.metaRaw); } catch (e) { throw new Fail(`${snap.name}/evoview.json at ${short(snap.commit)}: ${e.message}`); }
    return { requires: m.requires ?? {}, clientOwned: m.clientOwned ?? [`${snap.name}.config.tsx`], hostDeps: m.hostDeps ?? {}, inferred: false };
  }
  // Trees older than evoview.json: assume lockstep with the dependency as it was in the same commit.
  return { requires: inferRequires(snap), clientOwned: ownedPolicy(snap.name), hostDeps: {}, inferred: true };
}

function inferRequires(snap) {
  const code = [...snap.files].filter(([rel]) => CODE_EXT.some((e) => rel.endsWith(e)));
  loadOids(code.map(([, f]) => f.oid));
  const deps = new Set();
  for (const [, f] of code) for (const m of blob(f.oid).toString("utf8").matchAll(/["']\.\.\/(foundation|controls)(?:\/[^"']*)?["']/g)) deps.add(m[1]);
  const requires = {};
  for (const dep of deps) {
    const v = snap.kind === "worktree"
      ? fs.readFileSync(path.join(LIB, "components", dep, "VERSION"), "utf8").trim()
      : catBatch([`${snap.commit}:components/${dep}/VERSION`])[0]?.toString("utf8").trim();
    const pv = parseVer(v);
    if (pv) requires[dep] = `>=${v} <${pv[0] + 1}`;
  }
  return requires;
}

// Client-owned paths are the client's view of the package, so trees without metadata take today's policy.
const ownedCache = new Map();
function ownedPolicy(name) {
  if (!ownedCache.has(name)) {
    let raw = catBatch([`HEAD:components/${name}/evoview.json`])[0]?.toString("utf8");
    const wt = path.join(LIB, "components", name, "evoview.json");
    if (!raw && fs.existsSync(wt)) raw = fs.readFileSync(wt, "utf8");
    let owned = [`${name}.config.tsx`];
    try { if (raw) owned = JSON.parse(raw).clientOwned ?? owned; } catch { /* fall back to the config file */ }
    ownedCache.set(name, owned);
  }
  return ownedCache.get(name);
}

function libraryPackages() {
  const names = new Set();
  for (const line of git(["ls-tree", "--name-only", "HEAD", "components/"]).stdout.split("\n")) {
    const n = line.replace(/^components\//, "").trim();
    if (n) names.add(n);
  }
  const dir = path.join(LIB, "components");
  for (const n of fs.readdirSync(dir)) if (fs.existsSync(path.join(dir, n, "VERSION"))) names.add(n);
  return [...names].filter((n) => !n.startsWith("."));
}

const isOwned = (rel, owned) => owned.some((o) => (o.endsWith("/") ? rel.startsWith(o) : rel === o));
const unionOwned = (...lists) => [...new Set(lists.flat().filter(Boolean))];

// ── client state ────────────────────────────────────────────────────────

function readClient(ctx, name) {
  const dir = path.join(ctx.compDir, name);
  const st = {
    name,
    dir,
    provPath: path.join(ctx.stateDir, `${name}.json`),
    patchPath: path.join(ctx.stateDir, "patches", `${name}.diff`),
    stampPath: path.join(dir, `.${name}-version`),
    prov: null,
    stamp: null,
    files: new Map(),
    cache: new Map(),
  };
  if (fs.existsSync(st.provPath)) {
    try { st.prov = JSON.parse(fs.readFileSync(st.provPath, "utf8")); } catch (e) { throw new Fail(`${st.provPath}: ${e.message}`); }
    if (st.prov.schema > SCHEMA) throw new Fail(`${st.provPath}: schema ${st.prov.schema} is newer than this tool (${SCHEMA}); update the library`);
  }
  if (fs.existsSync(st.stampPath)) st.stamp = fs.readFileSync(st.stampPath, "utf8").trim();
  for (const [rel, abs] of walk(dir)) {
    if (rel === `.${name}-version`) continue;
    if (fs.lstatSync(abs).isSymbolicLink()) throw new Fail(`${toPosix(path.relative(ctx.client, abs))}: symlinks inside a package dir are not supported`);
    st.files.set(rel, abs);
  }
  return st;
}
function clientBuf(st, rel) {
  if (!st.cache.has(rel)) st.cache.set(rel, fs.readFileSync(st.files.get(rel)));
  return st.cache.get(rel);
}
const installedVersion = (st) => st.prov?.version ?? st.stamp ?? null;

function detectInstalled(ctx) {
  const names = new Set(libraryPackages());
  if (fs.existsSync(ctx.stateDir)) for (const f of fs.readdirSync(ctx.stateDir)) if (f.endsWith(".json")) names.add(f.slice(0, -5));
  const map = new Map();
  for (const name of [...names].sort()) {
    const st = readClient(ctx, name);
    if (st.prov || st.stamp) map.set(name, st);
  }
  return map;
}

// ── base: provenance, or adoption of a legacy install ──────────────────

function resolveBase(ctx, st) {
  if (st.prov) {
    if (!commitExists(st.prov.commit)) {
      ctx.warnings.push(`${st.name}: recorded base ${short(st.prov.commit)} is not in the library history; base re-adopted by content`);
      return adopt(ctx, st, st.prov.version, "provenance (base commit missing)");
    }
    const snap = gitSnapshot(st.prov.commit, st.name);
    if (!snap) throw new Fail(`${st.name}: no package at recorded base ${short(st.prov.commit)}`);
    if (st.prov.dirty) ctx.warnings.push(`${st.name}: installed from a dirty library worktree; merge base approximated by ${short(st.prov.commit)} plus the recorded checksums`);
    return { snap, commit: st.prov.commit, version: st.prov.version, dirty: !!st.prov.dirty, adopted: null };
  }
  if (st.stamp) return adopt(ctx, st, st.stamp, `.${st.name}-version`);
  return null;
}

function adopt(ctx, st, version, from) {
  const name = st.name;
  const prefix = `components/${name}`;
  const commits = git(["rev-list", "HEAD", "--", `${prefix}/src`, `${prefix}/VERSION`]).stdout.split("\n").filter(Boolean);
  const versions = catBatch(commits.map((c) => `${c}:${prefix}/VERSION`)).map((b) => b?.toString("utf8").trim() ?? null);
  const trees = catBatch(commits.map((c) => `${c}:${prefix}/src`), true);
  const states = new Map();
  commits.forEach((c, i) => {
    if (!versions[i] || !trees[i]) return;
    const key = `${trees[i]}|${versions[i]}`;
    if (!states.has(key)) states.set(key, { commit: c, version: versions[i] });
  });
  let candidates = [...states.values()].filter((s) => s.version === version);
  let note = `${candidates.length} library state(s) at ${version}`;
  if (!candidates.length) {
    candidates = [...states.values()];
    note = `no library commit carries ${version}; closest of all ${candidates.length} states`;
    ctx.warnings.push(`${name}: ${from} says ${version}, which no library commit carries; base chosen by content alone`);
  }
  if (!candidates.length) throw new Fail(`${name}: no library history to adopt from`);
  const owned = ownedPolicy(name);
  let best = null;
  for (const c of candidates) {
    const snap = gitSnapshot(c.commit, name);
    const d = distance(snap, st, unionOwned(owned, snap.meta.clientOwned));
    if (!best || d.lines < best.d.lines || (d.lines === best.d.lines && d.files < best.d.files)) best = { snap, d };
  }
  return {
    snap: best.snap,
    commit: best.snap.commit,
    version: best.snap.version,
    dirty: false,
    adopted: { from, stamp: version, note, distance: best.d },
  };
}

function distance(snap, st, owned) {
  let files = 0;
  let lines = 0;
  const diffRels = [];
  for (const rel of new Set([...snap.files.keys(), ...st.files.keys()])) {
    if (isOwned(rel, owned)) continue;
    const c = snap.files.get(rel);
    const has = st.files.has(rel);
    if (c && has && c.oid === gitOid(clientBuf(st, rel))) continue;
    diffRels.push(rel);
  }
  loadOids(diffRels.map((r) => snap.files.get(r)?.oid).filter(Boolean));
  for (const rel of diffRels) {
    const c = snap.files.get(rel);
    files++;
    if (c && st.files.has(rel)) lines += changedLines(blob(c.oid), clientBuf(st, rel));
    else lines += lineCount(c ? blob(c.oid) : clientBuf(st, rel));
  }
  return { files, lines };
}

// ── changelog ───────────────────────────────────────────────────────────

const HIGHLIGHT = /config change|requires|breaking/i;
function changelogExcerpt(text, from, to) {
  if (!text || !from) return [];
  const sections = [];
  let cur = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("## ")) { cur = { heading: line.slice(3).trim(), lines: [] }; sections.push(cur); continue; }
    if (cur) cur.lines.push(line);
  }
  const fv = parseVer(from);
  const tv = parseVer(to);
  return sections
    .filter((s) => {
      if (/unreleased/i.test(s.heading)) return true;
      const v = parseVer((/(\d+\.\d+\.\d+)/.exec(s.heading) ?? [])[1]);
      return v && fv && tv && cmpVer(v, fv) > 0 && cmpVer(v, tv) <= 0;
    })
    .map((s) => {
      const blocks = [];
      let b = [];
      for (const line of s.lines) {
        if (!line.trim() || /^\s*[-*] /.test(line)) { if (b.length) blocks.push(b); b = []; }
        if (line.trim()) b.push(line.trim());
      }
      if (b.length) blocks.push(b);
      return { heading: s.heading, text: s.lines.join("\n").trim(), highlights: blocks.map((x) => x.join(" ")).filter((x) => HIGHLIGHT.test(x)) };
    });
}

// ── source scanning (imports / exports; comments blanked, strings kept) ──

// Comments blanked (same offsets). `masked` also blanks string interiors, so a match can be
// checked to start in code, not inside a string (an SVG data URI, a code sample).
function stripComments(text, css = false) {
  let code = "";
  let masked = "";
  const put = (c, m = c) => { code += c; masked += m; };
  let i = 0;
  let state = "code";
  while (i < text.length) {
    const ch = text[i];
    const nx = text[i + 1];
    if (state === "code") {
      if (ch === "/" && nx === "*") { state = "block"; i += 2; put("  "); continue; }
      if (!css && ch === "/" && nx === "/") { state = "line"; i += 2; put("  "); continue; }
      if (ch === '"' || ch === "'" || (!css && ch === "`")) state = ch;
      put(ch);
      i++;
    } else if (state === "block" || state === "line") {
      if (state === "block" && ch === "*" && nx === "/") { state = "code"; i += 2; put("  "); continue; }
      if (state === "line" && ch === "\n") state = "code";
      put(ch === "\n" ? "\n" : " ");
      i++;
    } else {
      if (ch === "\\") { put(ch + (nx ?? ""), "  ".slice(0, nx === undefined ? 1 : 2)); i += 2; continue; }
      // An unterminated quote (a regex literal, say) ends at the line break.
      if (ch === state || (ch === "\n" && state !== "`")) { state = "code"; put(ch); i++; continue; }
      put(ch, ch === "\n" ? "\n" : " ");
      i++;
    }
  }
  return { code, masked };
}

function cssUrl(code, at) {
  let i = at;
  while (/\s/.test(code[i] ?? "")) i++;
  const q = code[i];
  if (q === '"' || q === "'") {
    const end = code.indexOf(q, i + 1);
    return end === -1 ? null : code.slice(i + 1, end);
  }
  const end = code.indexOf(")", i);
  return end === -1 ? null : code.slice(i, end).trim();
}

function parseModule(text, css) {
  const { code, masked } = stripComments(text, css);
  const inCode = (m) => masked.startsWith(m[0].slice(0, 6), m.index);
  const imports = [];
  if (css) {
    for (const m of masked.matchAll(/@import\s+(?:url\(\s*)?/g)) {
      const spec = cssUrl(code, m.index + m[0].length);
      if (spec && !/^(data:|https?:|\/)/.test(spec)) imports.push({ spec: spec.startsWith(".") ? spec : `./${spec}`, names: [] });
    }
    for (const m of masked.matchAll(/url\(/g)) {
      const spec = cssUrl(code, m.index + 4);
      if (spec && !/^(data:|https?:|\/|#|%23|var\()/.test(spec)) imports.push({ spec: spec.startsWith(".") ? spec : `./${spec}`, names: [] });
    }
    return { imports, exports: { names: new Set(), stars: [] } };
  }
  const names = (list, left) =>
    list.split(",").map((s) => s.trim().replace(/^type\s+/, "")).filter(Boolean).map((s) => {
      const [a, b] = s.split(/\s+as\s+/);
      return left ? a.trim() : (b ?? a).trim();
    });
  const all = (re) => [...code.matchAll(re)].filter(inCode);
  for (const m of all(/\bimport\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(\{[^}]*\}|\*\s+as\s+[\w$]+)?\s*from\s*["']([^"']+)["']/g)) {
    const n = [];
    if (m[1]) n.push("default");
    if (m[2]?.startsWith("{")) n.push(...names(m[2].slice(1, -1), true));
    imports.push({ spec: m[3], names: n });
  }
  for (const m of all(/\bimport\s*\(?\s*["']([^"']+)["']/g)) imports.push({ spec: m[1], names: [] });
  for (const m of all(/\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)) imports.push({ spec: m[1], names: [] });
  const ex = { names: new Set(), stars: [] };
  if (all(/\bexport\s+default\b/g).length) ex.names.add("default");
  for (const m of all(/\bexport\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:const\s+enum|function\s*\*?|const|let|var|class|type|interface|enum|namespace)\s+([A-Za-z_$][\w$]*)/g)) ex.names.add(m[1]);
  for (const m of all(/\bexport\s+(?:type\s+)?\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/g)) {
    for (const n of names(m[1], false)) ex.names.add(n);
    if (m[2]) imports.push({ spec: m[2], names: names(m[1], true) });
  }
  for (const m of all(/\bexport\s+(?:type\s+)?\*\s+(?:as\s+([\w$]+)\s+)?from\s*["']([^"']+)["']/g)) {
    if (m[1]) ex.names.add(m[1]);
    else ex.stars.push(m[2]);
    imports.push({ spec: m[2], names: [] });
  }
  return { imports, exports: ex };
}

function resolveSpec(fromAbs, spec) {
  if (!spec.startsWith("./") && !spec.startsWith("../")) return undefined;
  const clean = spec.replace(/[?#].*$/, "");
  const base = path.resolve(path.dirname(fromAbs), clean);
  const tries = [base, ...RESOLVE_EXT.map((e) => base + e), ...CODE_EXT.map((e) => path.join(base, `index${e}`))];
  if (/\.jsx?$/.test(base)) tries.push(base.replace(/\.jsx?$/, ".ts"), base.replace(/\.jsx?$/, ".tsx"));
  return tries.find((t) => fs.existsSync(t) && fs.statSync(t).isFile()) ?? null;
}

const moduleCache = new Map();
function moduleAt(abs) {
  if (!moduleCache.has(abs)) moduleCache.set(abs, parseModule(fs.readFileSync(abs, "utf8"), abs.endsWith(".css")));
  return moduleCache.get(abs);
}
// Exported names of a module, following relative `export *`; open = some names are unknowable.
function exportsOf(abs, seen = new Set()) {
  if (seen.has(abs)) return { names: new Set(), open: false };
  seen.add(abs);
  const mod = moduleAt(abs);
  const names = new Set(mod.exports.names);
  let open = false;
  for (const spec of mod.exports.stars) {
    const target = resolveSpec(abs, spec);
    if (!target || !CODE_EXT.some((e) => target.endsWith(e))) { open = true; continue; }
    const sub = exportsOf(target, seen);
    open ||= sub.open;
    for (const n of sub.names) if (n !== "default") names.add(n);
  }
  return { names, open };
}

// Every relative import of every file in `dir` resolves, and named imports exist.
function importProblems(dir) {
  const problems = [];
  for (const [rel, abs] of walk(dir)) {
    const css = rel.endsWith(".css");
    if (!css && !CODE_EXT.some((e) => rel.endsWith(e))) continue;
    for (const imp of moduleAt(abs).imports) {
      const target = resolveSpec(abs, imp.spec);
      if (target === undefined) continue;
      if (target === null) { problems.push(`${rel}: "${imp.spec}" does not resolve`); continue; }
      if (!imp.names.length || !CODE_EXT.some((e) => target.endsWith(e)) || /[?]/.test(imp.spec)) continue;
      const ex = exportsOf(target);
      if (ex.open) continue;
      const missing = imp.names.filter((n) => !ex.names.has(n));
      if (missing.length) problems.push(`${rel}: "${imp.spec}" does not export ${missing.join(", ")}`);
    }
  }
  return problems;
}

// ── plan ────────────────────────────────────────────────────────────────

function parseSpec(s) {
  const at = s.indexOf("@");
  return at > 0 ? { name: s.slice(0, at), ref: s.slice(at + 1) } : { name: s, ref: null };
}

function makePlan(ctx) {
  const { opts } = ctx;
  const defaultTarget = opts.worktree ? { kind: "worktree", ref: "worktree", commit: ctx.head } : { kind: "git", ref: opts.ref, commit: revParse(opts.ref) };
  const installed = detectInstalled(ctx);
  const specs = opts.packages.length ? opts.packages.map(parseSpec) : [...installed.keys()].map((name) => ({ name, ref: null }));
  if (!specs.length) throw new Fail(`no Evoview package installed under ${toPosix(path.relative(ctx.client, ctx.compDir))}; name the packages to install`);
  const known = new Set(libraryPackages());
  const targets = new Map();
  for (const s of specs) {
    if (!known.has(s.name)) throw new Fail(`unknown package "${s.name}" (library: ${[...known].sort().join(", ")})`);
    if (s.ref && opts.worktree) throw new Fail("package@ref cannot be combined with --worktree");
    targets.set(s.name, s.ref ? { kind: "git", ref: s.ref, commit: revParse(s.ref) } : defaultTarget);
  }
  const targetSnap = (name) => {
    const t = targets.get(name) ?? defaultTarget;
    const snap = snapshot(t, name);
    if (!snap) throw new Fail(`${name} does not exist in the library at ${t.ref}`);
    return snap;
  };

  // Requested packages, plus each dependency whose installed version their target does not accept.
  const set = new Map(specs.map((s) => [s.name, ["requested"]]));
  const work = specs.map((s) => s.name);
  while (work.length) {
    const name = work.shift();
    const t = targetSnap(name);
    for (const [dep, range] of Object.entries(t.meta.requires)) {
      if (set.has(dep)) { set.get(dep).push(`${name} ${t.version} requires ${range}`); continue; }
      const iv = installed.has(dep) ? installedVersion(installed.get(dep)) : null;
      if (iv && satisfies(iv, range)) continue;
      set.set(dep, [`${name} ${t.version} requires ${range} (${iv ? `installed ${iv}` : "not installed"})`]);
      work.push(dep);
    }
  }

  const plan = { command: "plan", client: ctx.client, componentsDir: toPosix(path.relative(ctx.client, ctx.compDir)), library: { path: LIB, head: ctx.head }, target: { ref: defaultTarget.ref, commit: defaultTarget.commit, worktree: !!opts.worktree }, packages: [], untouched: [], compat: [], host: [], blockers: [], review: [], warnings: ctx.warnings };
  const order = (n) => (n === "foundation" ? 0 : n === "controls" ? 1 : 2);
  const names = [...set.keys()].sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  for (const name of names) {
    const st = installed.get(name) ?? readClient(ctx, name);
    if (!st.prov && !st.stamp && st.files.size) {
      plan.blockers.push(`${name}: ${toPosix(path.relative(ctx.client, st.dir))} exists but is not an Evoview install (no provenance, no .${name}-version); move it aside first`);
      continue;
    }
    if (st.prov && !fs.existsSync(st.dir)) {
      plan.blockers.push(`${name}: provenance ${toPosix(path.relative(ctx.client, st.provPath))} but no package dir; delete the provenance to reinstall from scratch`);
      continue;
    }
    plan.packages.push(classify(ctx, st, resolveBase(ctx, st), targetSnap(name), set.get(name)));
  }

  // Compatibility: one foundation / controls serves every installed package.
  const final = new Map();
  for (const [name, st] of installed) {
    if (set.has(name)) continue;
    const base = st.prov?.requires ? null : resolveBase(ctx, st);
    final.set(name, { version: installedVersion(st), requires: st.prov?.requires ?? base.snap.meta.requires, source: "installed", base: st.prov?.commit ?? base?.commit, adopted: !!base?.adopted });
  }
  for (const p of plan.packages) final.set(p.name, { version: p.to.version, requires: p._target.meta.requires, source: "target" });
  for (const [name, f] of final) {
    const checks = [];
    for (const [dep, range] of Object.entries(f.requires)) {
      const d = final.get(dep);
      const ok = !!d && satisfies(d.version, range);
      checks.push({ dep, range, version: d?.version ?? null, ok });
      if (ok) continue;
      if (f.source === "target") {
        plan.blockers.push(`${name} ${f.version} requires ${dep} ${range}, but ${dep} resolves to ${d?.version ?? "nothing"}`);
        continue;
      }
      const t = snapshot(defaultTarget, name);
      const tr = t?.meta.requires[dep];
      if (t && (!tr || satisfies(d?.version, tr))) plan.compat.push({ package: name, required: true, message: `${name} ${f.version} requires ${dep} ${range}, which ${dep} ${d?.version ?? "(absent)"} breaks: upgrade it too (add "${name}" to the package list; library has ${t.version})` });
      else plan.blockers.push(`${name}: neither installed ${f.version} (${dep} ${range}) nor library ${t?.version ?? "—"} (${dep} ${tr ?? "—"}) accepts ${dep} ${d?.version ?? "(absent)"}`);
    }
    if (f.source === "installed") plan.untouched.push({ name, version: f.version, base: f.base ?? null, adopted: f.adopted, checks, compatible: checks.every((c) => c.ok) });
  }

  plan.host = hostChecks(ctx, plan.packages);

  for (const p of plan.packages) {
    const conflicts = p.files.filter((f) => f.class === "conflict");
    if (conflicts.length) plan.review.push(`${p.name}: ${conflicts.length} conflict(s): ${conflicts.map((f) => f.path).join(", ")}`);
    for (const f of p.files.filter((x) => x.class === "merge-clean" && x.overlap)) plan.review.push(`${p.name}: ${f.path} merges cleanly, but client and upstream both introduce ${f.overlap.join(", ")}: check the patch is not now duplicated upstream`);
    if (p.unrecorded.length) plan.review.push(`${p.name}: ${p.unrecorded.length} unrecorded local change(s): ${p.unrecorded.map((u) => u.path).join(", ")}`);
    if (p.markers.length) plan.blockers.push(`${p.name}: conflict markers left in ${p.markers.join(", ")}; resolve them first`);
    for (const c of p.configImports) plan.review.push(`${p.name}: ${c}`);
  }
  for (const c of plan.compat) plan.review.push(c.message);
  for (const h of plan.host) {
    if (h.level === "block") plan.blockers.push(`host: ${h.message}`);
    if (h.level === "review") plan.review.push(`host: ${h.message}`);
  }
  plan.status = plan.blockers.length ? "blocked" : plan.review.length ? "review" : "clean";
  plan.exit = plan.status === "clean" ? EXIT.ok : EXIT.review;
  return plan;
}

function classify(ctx, st, base, target, reasons) {
  const name = st.name;
  const owned = unionOwned(base?.snap.meta.clientOwned, target.meta.clientOwned);
  const B = base?.snap.files ?? new Map();
  const T = target.files;
  const prov = st.prov && !base?.adopted ? st.prov : null;
  const pending = prov?.pending ?? {};
  const labels = ["client", `base ${name} ${base?.version ?? "-"} ${short(base?.commit)}`, `library ${name} ${target.version} ${short(target.commit)}`];
  const files = [];
  const ops = [];
  const unrecorded = [];
  const markers = [];
  const newPending = {};
  loadOids([...B.values(), ...T.values()].map((f) => f.oid));
  const same = (x, y) => (x === null ? y === null : y !== null && x.equals(y));
  const write = (rel, buf, mode) => ops.push({ op: "write", rel, buf, mode });

  for (const rel of [...new Set([...B.keys(), ...T.keys(), ...st.files.keys()])].sort()) {
    const o = st.files.has(rel) ? clientBuf(st, rel) : null;
    if (o && hasMarkers(o)) markers.push(rel);
    if (isOwned(rel, owned)) continue;
    const b = B.get(rel);
    const t = T.get(rel);
    let bBuf = b ? blob(b.oid) : null;
    // A dirty-worktree base is not in git: an untouched, unpatched file is its own base.
    if (base?.dirty && o && prov && !prov.patches?.[rel] && prov.files?.[rel] === sha256(o)) bBuf = o;
    const tBuf = t ? blob(t.oid) : null;
    const clientChanged = !same(o, bBuf);
    const upstreamChanged = !same(tBuf, bBuf);

    if (clientChanged && !(rel in pending)) {
      const recorded = prov && (o ? prov.files?.[rel] === sha256(o) : !(rel in (prov.files ?? {})));
      if (!recorded) unrecorded.push({ path: rel, change: !o ? "deleted" : !bBuf ? "added" : "modified" });
    }

    let cls;
    let note;
    let conflicts;
    let overlap = [];
    if (!clientChanged && !upstreamChanged) {
      if (!o) continue;
      cls = "unchanged";
    } else if (!clientChanged) {
      if (!tBuf) { cls = "removed"; ops.push({ op: "delete", rel }); }
      else { cls = bBuf ? "fast-forward" : "added"; write(rel, tBuf, t.mode); }
    } else if (!upstreamChanged) {
      if (!o) { cls = "kept"; note = "deleted by the client"; }
      else if (!bBuf) cls = "client-added";
      else { cls = "kept"; note = "client patch, upstream unchanged"; }
    } else if (same(o, tBuf)) {
      if (!o) continue;
      cls = "merge-clean";
      note = "client already matches upstream (patch absorbed)";
    } else if (!tBuf) {
      cls = "conflict";
      note = "modified by the client, removed upstream: client file kept";
      newPending[rel] = "removed-upstream";
    } else if (!o) {
      cls = "conflict";
      note = "deleted by the client, changed upstream: upstream file restored";
      newPending[rel] = "deleted-by-client";
      write(rel, tBuf, t.mode);
    } else if (isBinary(o) || isBinary(tBuf) || (bBuf && isBinary(bBuf))) {
      cls = "conflict";
      note = "binary changed on both sides: client file kept";
      newPending[rel] = "binary";
    } else {
      const m = merge3(o, bBuf ?? Buffer.alloc(0), tBuf, labels);
      if (m.conflicts === 0) {
        cls = "merge-clean";
        note = m.buf.equals(tBuf) ? "patch absorbed upstream" : "client patch carried onto upstream";
        if (!m.buf.equals(o)) write(rel, m.buf, t.mode);
      } else {
        cls = "conflict";
        conflicts = m.conflicts;
        note = `${m.conflicts} conflict hunk(s)${bBuf ? "" : ", added on both sides"}: written with markers`;
        newPending[rel] = "content";
        write(rel, m.buf, t.mode);
      }
      if (!(cls === "merge-clean" && note === "patch absorbed upstream")) overlap = sharedNewIdents(o, bBuf, tBuf);
      if (overlap.length) note += `; client and upstream both introduce ${overlap.join(", ")}: the patch may now duplicate upstream`;
    }
    files.push({ path: rel, class: cls, ...(note ? { note } : {}), ...(conflicts ? { conflicts } : {}), ...(overlap.length ? { overlap } : {}) });
  }

  // Client-owned: never overwritten; created from the template when absent.
  const ownedOut = [];
  const fresh = !base && st.files.size === 0;
  for (const entry of owned) {
    if (entry.endsWith("/")) {
      const inT = [...T.keys()].filter((r) => r.startsWith(entry));
      const inO = [...st.files.keys()].filter((r) => r.startsWith(entry));
      const inB = [...B.keys()].filter((r) => r.startsWith(entry));
      if (!inT.length && !inO.length) continue;
      if (fresh) {
        for (const r of inT) write(r, blob(T.get(r).oid), T.get(r).mode);
        ownedOut.push({ path: entry, state: "create", files: inT.length });
      } else if (!inO.length) {
        ownedOut.push({ path: entry, state: "absent", note: "removed by the client; not recreated" });
      } else {
        const changes = [...new Set([...inB, ...inT])].sort().filter((r) => B.get(r)?.oid !== T.get(r)?.oid)
          .map((r) => ({ path: r, change: !B.has(r) ? "added" : !T.has(r) ? "removed" : "modified", diff: base ? unifiedDiff(r, B.has(r) ? blob(B.get(r).oid) : null, T.has(r) ? blob(T.get(r).oid) : null) : null }));
        ownedOut.push({ path: entry, state: "kept", ...(base && changes.length ? { templateChanges: changes } : {}) });
      }
      continue;
    }
    const t = T.get(entry);
    const b = B.get(entry);
    if (!st.files.has(entry)) {
      if (t) { write(entry, blob(t.oid), t.mode); ownedOut.push({ path: entry, state: "create" }); }
      continue;
    }
    const out = { path: entry, state: "kept" };
    if (b && t && b.oid !== t.oid) {
      out.templateChanged = true;
      out.clientIsOldTemplate = gitOid(clientBuf(st, entry)) === b.oid;
      out.diff = unifiedDiff(entry, blob(b.oid), blob(t.oid));
      out.gitDiff = `git -C ${LIB} diff ${short(base.commit)} ${target.kind === "worktree" ? "" : short(target.commit)} -- components/${name}/src/${entry}`.replace(/\s+--/, " --");
    } else if (!b && t && base) {
      out.note = "the template is new upstream; the client file predates it";
    }
    ownedOut.push(out);
  }

  // Named imports the target package takes from a client-owned module the client already has.
  const configImports = [];
  if (base) {
    for (const [rel, f] of T) {
      if (!CODE_EXT.some((e) => rel.endsWith(e)) || isOwned(rel, owned)) continue;
      for (const imp of parseModule(blob(f.oid).toString("utf8"), false).imports) {
        if (!imp.names.length || !imp.spec.startsWith(".")) continue;
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), imp.spec));
        const ownedRel = [resolved, ...CODE_EXT.map((e) => resolved + e)].find((r) => isOwned(r, owned) && st.files.has(r));
        if (!ownedRel || !CODE_EXT.some((e) => ownedRel.endsWith(e))) continue;
        const ex = parseModule(clientBuf(st, ownedRel).toString("utf8"), false).exports;
        if (ex.stars.length) continue;
        const missing = imp.names.filter((n) => !ex.names.has(n));
        if (missing.length) configImports.push(`library ${rel} imports ${missing.join(", ")} from ${ownedRel}, which the client's copy does not export (see the changelog's config changes)`);
      }
    }
  }

  const from = base ? { version: base.version, commit: base.commit, dirty: base.dirty, adopted: base.adopted } : null;
  const action = !base ? "install"
    : base.commit === target.commit && !target.dirty && !base.dirty ? "current"
      : cmpStr(target.version, base.version) > 0 ? "upgrade"
        : cmpStr(target.version, base.version) < 0 ? "downgrade" : "update";
  return {
    name,
    reasons,
    action,
    from,
    to: { version: target.version, commit: target.commit, ref: target.ref, dirty: target.dirty },
    files,
    owned: ownedOut,
    unrecorded,
    pendingResolved: Object.keys(pending).filter((r) => !markers.includes(r)),
    markers,
    configImports,
    changelog: base ? changelogExcerpt(target.changelog, base.version, target.version) : [],
    requires: target.meta.requires,
    _ops: ops,
    _pending: newPending,
    _owned: owned,
    _target: target,
    _st: st,
    _base: base,
  };
}

// ── host checks ─────────────────────────────────────────────────────────

function hostChecks(ctx, packages) {
  const out = [];
  const pjPath = path.join(ctx.client, "package.json");
  if (!fs.existsSync(pjPath)) throw new Fail(`no package.json in ${ctx.client}`);
  let pj;
  try { pj = JSON.parse(fs.readFileSync(pjPath, "utf8")); } catch (e) { throw new Fail(`package.json: ${e.message}`); }
  const deps = { ...pj.peerDependencies, ...pj.devDependencies, ...pj.dependencies };
  const needs = new Map([["react", { range: ">=19", by: ["all packages"] }]]);
  for (const p of packages) {
    for (const [dep, range] of Object.entries(p._target.meta.hostDeps ?? {})) {
      const cur = needs.get(dep);
      if (cur) { if (!cur.by.includes(p.name)) cur.by.push(p.name); if (cur.range !== range && range !== "*") cur.range = `${cur.range} ${range}`.replace(/^\*\s*/, ""); }
      else needs.set(dep, { range, by: [p.name] });
    }
  }
  for (const [dep, { range, by }] of needs) {
    const severe = dep === "react" ? "block" : "review";
    const spec = deps[dep];
    if (!spec) { out.push({ level: severe, check: dep, message: `${dep} missing from package.json (${by.join(", ")}; ${range})` }); continue; }
    const nm = path.join(ctx.client, "node_modules", dep, "package.json");
    let v = null;
    let src = "node_modules";
    try { v = JSON.parse(fs.readFileSync(nm, "utf8")).version; } catch { /* not installed */ }
    if (!v) { src = "package.json"; const m = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(String(spec)); v = m && !/^\s*</.test(spec) ? `${m[1]}.${m[2] ?? 0}.${m[3] ?? 0}` : null; }
    if (!v) out.push({ level: "warn", check: dep, message: `${dep} "${spec}": version not determinable (${range} needed)` });
    else if (range !== "*" && !satisfies(v, range)) out.push({ level: severe, check: dep, message: `${dep} ${v} (${src}) does not satisfy ${range} (${by.join(", ")})` });
    else out.push({ level: "ok", check: dep, message: `${dep} ${v} (${src})${range !== "*" ? ` satisfies ${range}` : ""}` });
  }
  if (!deps.vite) out.push({ level: "warn", check: "vite", message: "vite not in package.json: packages use ?raw imports and asset URLs (Vite host assumed)" });
  else out.push({ level: "ok", check: "vite", message: `vite ${deps.vite}` });
  const tsconfigs = fs.readdirSync(ctx.client).filter((f) => /^tsconfig.*\.json$/.test(f));
  const alias = tsconfigs.some((f) => /["']@\/\*["']\s*:/.test(fs.readFileSync(path.join(ctx.client, f), "utf8")));
  out.push(alias ? { level: "ok", check: "alias", message: "@/ alias in tsconfig" } : { level: "warn", check: "alias", message: "no @/* path alias in tsconfig*.json (README imports use @/components/…)" });
  const skip = new Set(["node_modules", ".git", "dist", "build", "public", ".next", "coverage", ".vite"]);
  const pkgDirs = new Set(libraryPackages().map((n) => path.join(ctx.compDir, n)));
  let primary = null;
  const scan = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (primary) return;
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) { if (!skip.has(ent.name) && !pkgDirs.has(abs) && abs !== ctx.stateDir) scan(abs); }
      else if (/\.(css|scss|sass|less|pcss|html)$/.test(ent.name) && /--primary\s*:/.test(fs.readFileSync(abs, "utf8"))) primary = toPosix(path.relative(ctx.client, abs));
    }
  };
  scan(ctx.client);
  out.push(primary ? { level: "ok", check: "--primary", message: `--primary defined in ${primary}` } : { level: "warn", check: "--primary", message: "--primary not defined in the host CSS: packages fall back to the reference accent" });
  return out;
}

// ── apply ───────────────────────────────────────────────────────────────

function apply(ctx) {
  const plan = makePlan(ctx);
  plan.command = "apply";
  plan.applied = false;
  if (plan.blockers.length) return { ...plan, refused: "the plan is blocked", exit: EXIT.review };
  if (ctx.opts.ifClean && plan.status !== "clean") return { ...plan, refused: "the plan needs review: read it, then run `sync.sh apply` without --if-clean", exit: EXIT.review };
  const foreign = foreignChanges(ctx, plan);
  if (foreign.length && !ctx.opts.force) {
    plan.foreign = foreign;
    return { ...plan, refused: "uncommitted client changes under the target package dirs (another agent's work?): commit or stash them, or run in a worktree / branch; --force overrides", exit: EXIT.review };
  }
  const results = plan.packages.map((p) => writePackage(ctx, p));
  plan.applied = true;
  plan.results = results;
  plan.exit = results.some((r) => Object.keys(r.pending).length) ? EXIT.review : EXIT.ok;
  return plan;
}

function foreignChanges(ctx, plan) {
  const top = git(["rev-parse", "--show-toplevel"], { cwd: ctx.client, allowFail: true });
  if (top.status !== 0) {
    ctx.warnings.push("client is not a git repository: no protection against overwriting uncommitted work");
    return [];
  }
  const root = top.stdout.trim();
  const dirs = plan.packages.map((p) => path.join(ctx.compDir, p.name));
  const r = git(["status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames", "--", ...dirs.map((d) => toPosix(path.relative(root, d)))], { cwd: root });
  const foreign = [];
  for (const rec of r.stdout.split("\0")) {
    if (!rec) continue;
    const abs = path.join(root, rec.slice(3));
    const p = plan.packages.find((x) => abs.startsWith(path.join(ctx.compDir, x.name) + path.sep));
    if (!p) continue;
    const rel = toPosix(path.relative(path.join(ctx.compDir, p.name), abs));
    if (!isOurs(p, rel, abs)) foreign.push(`${rec.slice(0, 2)} ${rec.slice(3)}`);
  }
  return foreign;
}

// Uncommitted, but exactly what the last recorded sync wrote (or a conflict it left to resolve).
function isOurs(p, rel, abs) {
  const prov = p._st.prov;
  if (!prov || p.from?.adopted) return false;
  if (rel === `.${p.name}-version`) return fs.existsSync(abs) && fs.readFileSync(abs, "utf8").trim() === prov.version;
  if (prov.pending && rel in prov.pending) return true;
  if (!fs.existsSync(abs)) return !(rel in (prov.files ?? {}));
  return prov.files?.[rel] === sha256(fs.readFileSync(abs));
}

function writeAtomic(abs, buf, mode) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && fs.readFileSync(abs).equals(buf)) return false;
  const tmp = `${abs}.evoview-tmp`;
  fs.writeFileSync(tmp, buf, { mode: mode === "100755" ? 0o755 : 0o644 });
  fs.renameSync(tmp, abs);
  return true;
}

function pruneEmpty(dir, stop) {
  while (dir.startsWith(stop + path.sep) && fs.existsSync(dir) && !fs.readdirSync(dir).length) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

function writePackage(ctx, p) {
  const st = p._st;
  const counts = { written: 0, deleted: 0 };
  fs.mkdirSync(st.dir, { recursive: true });
  for (const op of p._ops) {
    const abs = path.join(st.dir, op.rel);
    if (op.op === "write") counts.written += writeAtomic(abs, op.buf, op.mode) ? 1 : 0;
    else if (fs.existsSync(abs)) { fs.rmSync(abs); counts.deleted++; pruneEmpty(path.dirname(abs), st.dir); }
  }
  writeAtomic(st.stampPath, Buffer.from(`${p.to.version}\n`));

  const after = readClient(ctx, p.name);
  const T = p._target.files;
  const owned = p._owned;
  const fileHashes = {};
  for (const rel of [...after.files.keys()].sort()) fileHashes[rel] = sha256(clientBuf(after, rel));

  // Patch record: every package file that differs from the library at the new base.
  const prevReasons = st.prov?.patches ?? {};
  const diffs = [];
  const patches = {};
  for (const rel of [...new Set([...T.keys(), ...after.files.keys()])].sort()) {
    if (isOwned(rel, owned) || rel in p._pending) continue;
    const tBuf = T.has(rel) ? blob(T.get(rel).oid) : null;
    const oBuf = after.files.has(rel) ? clientBuf(after, rel) : null;
    if (tBuf && oBuf && tBuf.equals(oBuf)) continue;
    patches[rel] = prevReasons[rel] ?? "TODO: reason";
    diffs.push(unifiedDiff(rel, tBuf, oBuf));
  }
  if (diffs.length) {
    const header = `# Local patches: ${p.name} ${p.to.version} vs library ${p.to.commit}\n# Paths relative to ${toPosix(path.relative(ctx.client, st.dir))}/; reasons in ../${p.name}.json (patches).\n\n`;
    writeAtomic(st.patchPath, Buffer.from(header + diffs.join("")));
  } else if (fs.existsSync(st.patchPath)) {
    fs.rmSync(st.patchPath);
    pruneEmpty(path.dirname(st.patchPath), ctx.stateDir);
  }

  const prov = {
    schema: SCHEMA,
    package: p.name,
    version: p.to.version,
    commit: p.to.commit,
    ref: p.to.ref,
    dirty: !!p.to.dirty,
    installedAt: new Date().toISOString(),
    source: "evoview-design-library",
    requires: p._target.meta.requires,
    clientOwned: owned,
    hostDeps: p._target.meta.hostDeps,
    files: fileHashes,
    patches,
    ...(Object.keys(p._pending).length ? { pending: p._pending } : {}),
    ...(p.from?.adopted ? { adoptedFrom: { ...p.from.adopted, commit: p.from.commit, version: p.from.version } } : st.prov?.adoptedFrom ? { adoptedFrom: st.prov.adoptedFrom } : {}),
  };
  // Client-owned hashes only serve the uncommitted-change guard: an edit there alone is no reason to rewrite.
  const strip = (o) => JSON.stringify({ ...o, installedAt: null, files: Object.fromEntries(Object.entries(o.files ?? {}).filter(([r]) => !isOwned(r, owned))) });
  if (!st.prov || strip(st.prov) !== strip(prov)) {
    fs.mkdirSync(ctx.stateDir, { recursive: true });
    writeAtomic(st.provPath, Buffer.from(`${JSON.stringify(prov, null, 2)}\n`));
    counts.provenance = true;
  }
  const newPatches = Object.keys(patches).filter((r) => !(r in prevReasons));
  return { name: p.name, ...counts, pending: p._pending, patches, newPatches, provenance: toPosix(path.relative(ctx.client, st.provPath)) };
}

// ── verify ──────────────────────────────────────────────────────────────

function verify(ctx) {
  const installed = detectInstalled(ctx);
  const names = ctx.opts.packages.length ? ctx.opts.packages.map((s) => parseSpec(s).name) : [...installed.keys()];
  if (!names.length) throw new Fail(`no Evoview package installed under ${toPosix(path.relative(ctx.client, ctx.compDir))}`);
  const result = { command: "verify", client: ctx.client, scope: "structural only: files, checksums, markers, requires, imports. Rendering, motion and responsiveness are not checked (reviewer at 1440 / 1024 / 390).", packages: [], warnings: ctx.warnings };
  for (const name of names) {
    const st = installed.get(name) ?? readClient(ctx, name);
    const checks = [];
    const add = (level, message) => checks.push({ level, message });
    result.packages.push({ name, version: installedVersion(st), commit: st.prov?.commit ?? null, checks });
    if (!st.prov) {
      add("fail", st.stamp ? `no provenance (legacy .${name}-version ${st.stamp}): run sync.sh plan, then apply, to adopt it` : "not installed");
      continue;
    }
    const prov = st.prov;
    const owned = prov.clientOwned ?? [];
    const pending = prov.pending ?? {};
    const edited = [];
    const missing = [];
    const extra = [];
    for (const [rel, hash] of Object.entries(prov.files ?? {})) {
      if (isOwned(rel, owned) || rel in pending) continue;
      if (!st.files.has(rel)) missing.push(rel);
      else if (sha256(clientBuf(st, rel)) !== hash) edited.push(rel);
    }
    for (const rel of st.files.keys()) if (!isOwned(rel, owned) && !(rel in (prov.files ?? {})) && !(rel in pending)) extra.push(rel);
    if (edited.length) add("fail", `edited since the last sync, not in the patch record: ${edited.join(", ")} (record with sync.sh apply, or revert)`);
    if (missing.length) add("fail", `deleted since the last sync: ${missing.join(", ")}`);
    if (extra.length) add("fail", `added since the last sync: ${extra.join(", ")}`);
    if (!edited.length && !missing.length && !extra.length) add("ok", `${Object.keys(prov.files ?? {}).filter((r) => !isOwned(r, owned)).length} package files match the provenance checksums`);
    const markers = [...st.files.keys()].filter((rel) => hasMarkers(clientBuf(st, rel)));
    if (markers.length) add("fail", `conflict markers in ${markers.join(", ")}`);
    const resolved = Object.keys(pending).filter((r) => !markers.includes(r));
    if (resolved.length) add("fail", `conflicts resolved but not recorded: ${resolved.join(", ")} (run sync.sh apply ${ctx.opts.client} ${name} to record them as patches)`);
    const todo = Object.entries(prov.patches ?? {}).filter(([, r]) => /^TODO\b/.test(r)).map(([f]) => f);
    if (todo.length) add("fail", `patch reasons to fill in ${toPosix(path.relative(ctx.client, st.provPath))}: ${todo.join(", ")}`);
    const patchCount = Object.keys(prov.patches ?? {}).length;
    if (patchCount && !fs.existsSync(st.patchPath)) add("fail", `patch record missing: ${toPosix(path.relative(ctx.client, st.patchPath))}`);
    else if (patchCount && !todo.length) add("ok", `${patchCount} local patch(es) recorded with reasons`);
    if (st.stamp !== prov.version) add("fail", `.${name}-version is ${st.stamp ?? "missing"}, provenance says ${prov.version}`);
    for (const [dep, range] of Object.entries(prov.requires ?? {})) {
      const d = installed.get(dep);
      const v = d ? installedVersion(d) : null;
      add(v && satisfies(v, range) ? "ok" : "fail", `requires ${dep} ${range}: ${v ? `installed ${v}` : "not installed"}`);
    }
    const problems = importProblems(st.dir);
    if (problems.length) for (const pr of problems) add("fail", `import: ${pr}`);
    else add("ok", "every relative import resolves, named imports exist");
  }
  if (ctx.opts.typecheck) result.typecheck = typecheck(ctx);
  const failed = result.packages.some((p) => p.checks.some((c) => c.level === "fail")) || (result.typecheck && !result.typecheck.ok);
  result.status = failed ? "review" : "clean";
  result.exit = failed ? EXIT.review : EXIT.ok;
  return result;
}

function typecheck(ctx) {
  const tsc = path.join(ctx.client, "node_modules", ".bin", "tsc");
  if (!fs.existsSync(tsc)) return { ok: false, command: null, output: "node_modules/.bin/tsc not found (install the client's dependencies first)" };
  const cfg = path.join(ctx.client, "tsconfig.json");
  const build = fs.existsSync(cfg) && /"references"\s*:/.test(fs.readFileSync(cfg, "utf8"));
  const args = build ? ["-b"] : ["--noEmit", "-p", "tsconfig.json"];
  const r = spawnSync(tsc, args, { cwd: ctx.client, encoding: "utf8", maxBuffer: 1 << 28 });
  const output = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { ok: r.status === 0, command: `tsc ${args.join(" ")}`, output: output.split("\n").slice(0, 60).join("\n") };
}

// ── output ──────────────────────────────────────────────────────────────

function jsonReplacer(key, value) {
  if (key.startsWith("_")) return undefined;
  return value;
}

function wrapList(items, indent, width = 96) {
  const out = [];
  let line = indent;
  for (const it of items) {
    if (line.length > indent.length && line.length + it.length + 2 > width) { out.push(line); line = indent; }
    line += line.length > indent.length ? `  ${it}` : it;
  }
  if (line.length > indent.length) out.push(line);
  return out;
}

function renderPlan(plan, opts) {
  const L = [];
  const rel = (p) => toPosix(path.relative(process.cwd(), p)) || ".";
  L.push(`Evoview sync · ${plan.command}`);
  L.push(`client   ${plan.client} (${plan.componentsDir})`);
  L.push(`library  ${plan.library.path} · target ${plan.target.worktree ? "working tree" : plan.target.ref} @ ${short(plan.target.commit)}`);
  for (const p of plan.packages) {
    L.push("");
    const from = p.from ? p.from.version : "—";
    L.push(`${p.name}  ${from} → ${p.to.version}  ${p.action}${p.to.dirty ? " (dirty worktree)" : ""}  [${p.reasons.join("; ")}]`);
    if (p.from) {
      const a = p.from.adopted;
      L.push(`  base     ${short(p.from.commit)}${a ? ` · adopted from ${a.from} ${a.stamp}: ${a.note}; ${a.distance.files} file(s) / ${a.distance.lines} line(s) differ` : ""}${p.from.dirty ? " · dirty-worktree base" : ""}`);
    }
    L.push(`  target   ${short(p.to.commit)}${p.to.ref && p.to.ref !== p.to.commit ? ` (${p.to.ref})` : ""}`);
    const byClass = new Map();
    for (const f of p.files) { if (!byClass.has(f.class)) byClass.set(f.class, []); byClass.get(f.class).push(f); }
    for (const cls of ["conflict", "merge-clean", "kept", "client-added", "fast-forward", "added", "removed", "unchanged"]) {
      const list = byClass.get(cls);
      if (!list) continue;
      L.push(`  ${cls.padEnd(13)} ${list.length}`);
      if (cls === "unchanged" || (cls === "added" && p.action === "install")) continue;
      if (["fast-forward", "added", "removed"].includes(cls)) L.push(...wrapList(list.map((f) => f.path), "    "));
      else for (const f of list) L.push(`    ${f.path}${f.note ? ` — ${f.note}` : ""}`);
    }
    if (p.owned.length) {
      L.push("  client-owned");
      for (const o of p.owned) {
        const bits = [o.state];
        if (o.files) bits.push(`${o.files} file(s)`);
        if (o.note) bits.push(o.note);
        if (o.templateChanged) bits.push(`template changed upstream${o.clientIsOldTemplate ? " (client copy = old template)" : ""}`);
        if (o.templateChanges) bits.push(`template changes: ${o.templateChanges.map((c) => `${c.path} (${c.change})`).join(", ")}`);
        L.push(`    ${o.path}  ${bits.join(" · ")}`);
        if (o.templateChanged && !opts.brief) {
          const lines = o.diff.trimEnd().split("\n");
          const shown = lines.slice(0, 120);
          for (const l of shown) L.push(`      ${l}`);
          if (lines.length > shown.length) L.push(`      … ${lines.length - shown.length} more line(s): ${o.gitDiff}`);
        }
      }
    }
    if (p.unrecorded.length) {
      L.push(`  unrecorded local changes${p.from?.adopted ? " (no provenance: found by adoption)" : " (since the last sync)"}`);
      for (const u of p.unrecorded) L.push(`    ${u.path} (${u.change})`);
    }
    if (p.pendingResolved.length) L.push(`  resolved conflicts to record: ${p.pendingResolved.join(", ")}`);
    if (p.markers.length) L.push(`  conflict markers: ${p.markers.join(", ")}`);
    for (const c of p.configImports) L.push(`  config: ${c}`);
    if (p.changelog.length) {
      L.push(`  changelog ${p.from.version} → ${p.to.version}`);
      for (const s of p.changelog) {
        L.push(`    ## ${s.heading}`);
        if (opts.brief) for (const h of s.highlights) L.push(`      ▶ ${h}`);
        else for (const line of s.text.split("\n")) L.push(`      ${HIGHLIGHT.test(line) ? "▶" : " "} ${line}`.trimEnd());
      }
    }
  }
  if (plan.untouched.length) {
    L.push("");
    for (const u of plan.untouched) {
      const req = u.checks.length ? u.checks.map((c) => `${c.dep} ${c.range} ${c.ok ? "✓" : "✗"} ${c.version ?? "absent"}`).join(", ") : "requires nothing";
      L.push(`${u.name}  ${u.version}  untouched${u.base ? ` · base ${short(u.base)}${u.adopted ? " (adopted)" : ""}` : ""} · ${u.compatible ? "compatible" : "INCOMPATIBLE"}: ${req}`);
    }
  }
  L.push("");
  L.push("host");
  for (const h of plan.host) L.push(`  ${h.level.padEnd(6)} ${h.message}`);
  for (const w of plan.warnings) L.push(`warning  ${w}`);
  if (plan.foreign) { L.push(""); L.push("uncommitted client changes:"); for (const f of plan.foreign) L.push(`  ${f}`); }
  L.push("");
  if (plan.command === "apply" && plan.applied) {
    for (const r of plan.results) {
      const pend = Object.entries(r.pending);
      L.push(`applied  ${r.name}: ${r.written} written, ${r.deleted} deleted${r.provenance ? `, provenance ${r.provenance}` : ""}${Object.keys(r.patches).length ? `, ${Object.keys(r.patches).length} local patch(es)` : ""}`);
      if (r.newPatches.length) L.push(`         new patches (reason "TODO: reason", fill them in ${r.provenance}): ${r.newPatches.join(", ")}`);
      for (const [f, kind] of pend) L.push(`         CONFLICT ${f} (${kind})`);
    }
    if (plan.results.some((r) => Object.keys(r.pending).length)) L.push(`next     resolve the conflicts, run \`sync.sh apply ${rel(plan.client)}\` again to record them, then \`sync.sh verify ${rel(plan.client)}\``);
    else L.push(`next     sync.sh verify ${rel(plan.client)}`);
    L.push(`result   applied${plan.exit ? " with conflicts (exit 2)" : " (exit 0)"}`);
    return L.join("\n");
  }
  if (plan.refused) L.push(`REFUSED  ${plan.refused}`);
  L.push(`result   ${plan.status === "clean" ? "clean" : plan.status === "blocked" ? "blocked" : "needs review"} (exit ${plan.exit})`);
  for (const b of plan.blockers) L.push(`  blocker  ${b}`);
  for (const r of plan.review) L.push(`  review   ${r}`);
  return L.join("\n");
}

function renderVerify(v) {
  const L = [`Evoview sync · verify`, `client   ${v.client}`, `scope    ${v.scope}`];
  for (const p of v.packages) {
    L.push("");
    L.push(`${p.name}  ${p.version ?? "—"}${p.commit ? ` @ ${short(p.commit)}` : ""}`);
    for (const c of p.checks) L.push(`  ${c.level.padEnd(5)} ${c.message}`);
  }
  if (v.typecheck) {
    L.push("");
    L.push(`typecheck ${v.typecheck.ok ? "ok" : "FAILED"}${v.typecheck.command ? ` (${v.typecheck.command})` : ""}`);
    if (!v.typecheck.ok && v.typecheck.output) for (const l of v.typecheck.output.split("\n")) L.push(`  ${l}`);
  }
  for (const w of v.warnings) L.push(`warning  ${w}`);
  L.push("");
  L.push(`result   ${v.status === "clean" ? "clean" : "needs review"} (exit ${v.exit})`);
  return L.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const [command, client, ...rest] = argv;
  if (!command || command === "-h" || command === "--help") { console.log(USAGE); process.exit(command ? 0 : 1); }
  if (!["plan", "apply", "verify"].includes(command)) throw new Fail(`unknown command "${command}" (plan | apply | verify)\n\n${USAGE}`);
  if (!client || client.startsWith("--")) throw new Fail(`missing <client-dir>\n\n${USAGE}`);
  const opts = { command, client, ref: "HEAD", refSet: false, worktree: false, componentsDir: "src/components", json: false, brief: false, force: false, ifClean: false, typecheck: false, packages: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const val = () => {
      const v = rest[++i];
      if (v === undefined || v.startsWith("--")) throw new Fail(`${a} needs a value`);
      return v;
    };
    if (a === "--ref") { opts.ref = val(); opts.refSet = true; }
    else if (a === "--worktree") opts.worktree = true;
    else if (a === "--components-dir") opts.componentsDir = val();
    else if (a === "--json") opts.json = true;
    else if (a === "--brief") opts.brief = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--if-clean") opts.ifClean = true;
    else if (a === "--typecheck") opts.typecheck = true;
    else if (a.startsWith("-")) throw new Fail(`unknown flag ${a}`);
    else opts.packages.push(a);
  }
  if (opts.worktree && opts.refSet) throw new Fail("--worktree and --ref are exclusive");
  if ((opts.force || opts.ifClean) && command !== "apply") throw new Fail("--force / --if-clean apply to `apply` only");
  if (opts.typecheck && command !== "verify") throw new Fail("--typecheck applies to `verify` only");
  if (command === "verify" && (opts.refSet || opts.worktree)) throw new Fail("verify reads the client only: --ref / --worktree do not apply");
  return opts;
}

function main(argv) {
  let opts = null;
  try {
    opts = parseArgs(argv);
    const client = path.resolve(opts.client);
    if (!fs.existsSync(client) || !fs.statSync(client).isDirectory()) throw new Fail(`client dir not found: ${opts.client}`);
    if (client === LIB || client.startsWith(LIB + path.sep)) throw new Fail("the client cannot be the library itself");
    const compDir = path.resolve(client, opts.componentsDir);
    const ctx = { opts, client, compDir, stateDir: path.join(compDir, ".evoview"), head: revParse("HEAD"), warnings: [] };
    const result = opts.command === "verify" ? verify(ctx) : opts.command === "apply" ? apply(ctx) : makePlan(ctx);
    if (opts.json) console.log(JSON.stringify(result, jsonReplacer, 2));
    else console.log(opts.command === "verify" ? renderVerify(result) : renderPlan(result, opts));
    return result.exit;
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    if (opts?.json) console.log(JSON.stringify({ error: e.message, exit: EXIT.error }, null, 2));
    else console.error(`evoview sync: ${e.message}`);
    return EXIT.error;
  }
}

process.exitCode = main(process.argv.slice(2));
