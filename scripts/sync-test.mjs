#!/usr/bin/env node
// Scratch-client tests for scripts/evoview-sync.mjs (node scripts/sync-test.mjs [--keep]).
// Everything runs under /tmp: the library is cloned there with its working tree committed
// on top (commit S), fixtures branch off S, so the real library history is never touched.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = fs.mkdtempSync("/tmp/evoview-sync-test-");
const LIB = path.join(TMP, "lib");
const TOOL = path.join(LIB, "scripts", "evoview-sync.mjs");
const KEEP = process.argv.includes("--keep");
const GITC = ["-c", "user.name=sync-test", "-c", "user.email=sync-test@example.invalid", "-c", "commit.gpgsign=false"];

// Real library commits the cases rely on (navbar 2.1.0 / 2.3.0, reservation 2.8.0).
const NAVBAR_210 = "1fd9195bbba4a8887214bb2482e8476fd685367d";
const NAVBAR_230 = "6b93d9bc34ff7117c15f9d70099645883b270941";
const RESERVATION_280 = "b811804bcb9444fabf060484aa61c7eea9d65d89";

function sh(cmd, args, cwd = TMP, input) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", input, maxBuffer: 1 << 28 });
  if (r.error) throw r.error;
  return r;
}
function must(cmd, args, cwd) {
  const r = sh(cmd, args, cwd);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} (${cwd}) → ${r.status}\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
}
const git = (cwd, ...args) => must("git", [...GITC, ...args], cwd);
const lib = (...args) => git(LIB, ...args);

function sync(args, { json = true } = {}) {
  const r = sh("node", [TOOL, ...args, ...(json ? ["--json"] : [])]);
  let out = null;
  if (json) {
    try { out = JSON.parse(r.stdout); } catch { throw new Error(`no JSON from sync ${args.join(" ")}:\n${r.stdout}\n${r.stderr}`); }
  }
  return { code: r.status, out, stdout: r.stdout, stderr: r.stderr };
}

// ── harness ─────────────────────────────────────────────────────────────

const results = [];
let current = null;
function test(name, fn) {
  current = { name, checks: 0, failed: [] };
  try { fn(); } catch (e) { current.failed.push(`threw: ${e.stack ?? e}`); }
  results.push(current);
  const status = current.failed.length ? "FAIL" : "ok  ";
  console.log(`${status} ${name} (${current.checks} checks)`);
  for (const f of current.failed) console.log(`       ✗ ${f}`);
}
function ok(cond, msg) {
  current.checks++;
  if (!cond) current.failed.push(msg);
  return !!cond;
}
const eq = (a, b, msg) => ok(a === b, `${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// ── fixtures ────────────────────────────────────────────────────────────

function setupLibrary() {
  must("git", ["clone", "-q", "--no-checkout", SRC, LIB], TMP);
  lib("checkout", "-q", "-B", "test-main", must("git", ["rev-parse", "HEAD"], SRC).trim());
  // Overlay the working tree of the tool-relevant paths, so uncommitted library edits are tested.
  const scope = ["components", "scripts", "sync.sh"];
  for (const f of lib("ls-files", "-z", "--", ...scope).split("\0").filter(Boolean)) {
    const p = path.join(LIB, f);
    if (isSymlink(p)) fs.unlinkSync(p);
    else fs.rmSync(p, { force: true });
  }
  for (const f of must("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...scope], SRC).split("\0").filter(Boolean)) {
    const from = path.join(SRC, f);
    if (!fs.existsSync(from) && !isSymlink(from)) continue;
    const to = path.join(LIB, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (isSymlink(from)) { if (isSymlink(to)) fs.unlinkSync(to); fs.symlinkSync(fs.readlinkSync(from), to); }
    else fs.copyFileSync(from, to);
  }
  lib("add", "-A", "--", ...scope);
  lib("commit", "-q", "--allow-empty", "-m", "test: library working tree");
  return lib("rev-parse", "HEAD").trim();
}
function isSymlink(p) { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } }

// A commit on a side branch off S; HEAD returns to S.
function fixture(name, mutate) {
  lib("checkout", "-q", "-B", `fixture-${name}`, S);
  mutate((rel) => path.join(LIB, rel));
  lib("add", "-A");
  lib("commit", "-q", "-m", `fixture: ${name}`);
  const sha = lib("rev-parse", "HEAD").trim();
  lib("checkout", "-q", "test-main");
  return sha;
}

let clientN = 0;
function client(name, { gitInit = true, nodeModules = false } = {}) {
  const dir = path.join(TMP, `${String(++clientN).padStart(2, "0")}-${name}`);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  const pj = { name, private: true, type: "module", dependencies: { react: "^19.2.0", "react-dom": "^19.2.0", "react-day-picker": "^9.14.0", "date-fns": "^4.4.0", "lucide-react": "^0.555.0", tailwindcss: "^4.1.17" }, devDependencies: { vite: "^7.2.4", typescript: "~5.9.3" } };
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pj, null, 2) + "\n");
  const tsconfig = { compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", types: ["vite/client"], skipLibCheck: true, moduleResolution: "bundler", allowImportingTsExtensions: true, verbatimModuleSyntax: true, moduleDetection: "force", noEmit: true, jsx: "react-jsx", strict: true, noUnusedLocals: true, noUnusedParameters: true, erasableSyntaxOnly: true, noFallthroughCasesInSwitch: true, noUncheckedSideEffectImports: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } }, include: ["src"] };
  fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "src", "index.css"), ":root { --primary: #d4a017; --primary-foreground: #101011; }\n");
  if (nodeModules) fs.symlinkSync(path.join(SRC, "node_modules"), path.join(dir, "node_modules"));
  if (gitInit) {
    fs.writeFileSync(path.join(dir, ".gitignore"), "node_modules\n");
    git(dir, "init", "-q");
    commitAll(dir, "client: scaffold");
  }
  return dir;
}
function commitAll(dir, msg) { git(dir, "add", "-A"); git(dir, "commit", "-q", "--allow-empty", "-m", msg); }
const status = (dir) => must("git", ["status", "--porcelain", "--untracked-files=all"], dir).trim();
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), "utf8");
const exists = (dir, rel) => fs.existsSync(path.join(dir, rel));
const libFile = (commit, rel) => lib("show", `${commit}:${rel}`);
const prov = (dir, name) => JSON.parse(read(dir, `src/components/.evoview/${name}.json`));
const pkgPlan = (out, name) => out.packages.find((p) => p.name === name);
const fileClass = (p, rel) => p.files.find((f) => f.path === rel)?.class;
function libTree(commit, name) {
  return lib("ls-tree", "-r", "--name-only", commit, "--", `components/${name}/src`).split("\n").filter(Boolean).map((f) => f.slice(`components/${name}/src/`.length));
}
function sameAsLibrary(dir, commit, name, skip = []) {
  const bad = [];
  for (const rel of libTree(commit, name)) {
    if (skip.some((s) => (s.endsWith("/") ? rel.startsWith(s) : rel === s))) continue;
    const a = path.join(dir, "src/components", name, rel);
    if (!fs.existsSync(a)) { bad.push(`${rel} missing`); continue; }
    const want = spawnSync("git", ["show", `${commit}:components/${name}/src/${rel}`], { cwd: LIB, maxBuffer: 1 << 28 }).stdout;
    if (!fs.readFileSync(a).equals(want)) bad.push(`${rel} differs`);
  }
  return bad;
}

// Install as the pre-sync install.sh did: run that script from a library worktree at `commit`.
function legacyInstall(dir, name, commit) {
  const wt = path.join(TMP, `legacy-${name}-${commit.slice(0, 7)}`);
  if (!fs.existsSync(wt)) lib("worktree", "add", "-q", "--detach", wt, commit);
  must("bash", [path.join(wt, "components", name, "install.sh"), dir], TMP);
}

// First line where two texts differ, and whether the first `n` lines agree.
function firstDiffLine(a, b) {
  const x = a.split("\n");
  const y = b.split("\n");
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return i;
}

// ── cases ───────────────────────────────────────────────────────────────

const S = setupLibrary();
console.log(`library clone ${LIB} @ ${S.slice(0, 8)} (working tree of ${SRC})\n`);

test("fresh install: reservation pulls controls + foundation; provenance, stamps, theme, config", () => {
  const c = client("fresh");
  const r = sync(["apply", c, "reservation"]);
  eq(r.code, 0, "apply exit");
  eq(r.out.packages.map((p) => p.name).join(","), "foundation,controls,reservation", "packages in dependency order");
  eq(r.out.packages.every((p) => p.action === "install"), true, "all installs");
  for (const name of ["foundation", "controls", "reservation"]) {
    const p = prov(c, name);
    eq(p.commit, S, `${name} provenance commit`);
    eq(p.version, libFile(S, `components/${name}/VERSION`).trim(), `${name} provenance version`);
    eq(read(c, `src/components/${name}/.${name}-version`).trim(), p.version, `${name} legacy stamp`);
    eq(Object.keys(p.patches).length, 0, `${name} no patches`);
    eq(sameAsLibrary(c, S, name).join("; "), "", `${name} files equal library`);
  }
  ok(exists(c, "src/components/reservation/reservation.theme.css"), "theme created");
  ok(exists(c, "src/components/reservation/reservation.config.tsx"), "config created");
  ok(!exists(c, "src/components/.evoview/patches"), "no patch dir");
  const v = sync(["verify", c]);
  eq(v.code, 0, `verify exit (${JSON.stringify(v.out.packages.flatMap((p) => p.checks.filter((x) => x.level === "fail")))})`);
});

test("re-run is a no-op (sync.sh apply and install.sh), no file touched", () => {
  const c = client("rerun");
  eq(sync(["apply", c, "navbar"]).code, 0, "first apply");
  commitAll(c, "install navbar");
  const before = read(c, "src/components/.evoview/navbar.json");
  const r = sync(["apply", c, "navbar"]);
  eq(r.code, 0, "second apply exit");
  eq(r.out.packages.find((p) => p.name === "navbar").action, "current", "action current");
  eq(r.out.results.reduce((n, x) => n + x.written + x.deleted, 0), 0, "nothing written");
  eq(status(c), "", "git status clean after re-run");
  eq(read(c, "src/components/.evoview/navbar.json"), before, "provenance untouched (installedAt kept)");
  const w = sh("bash", [path.join(LIB, "components/navbar/install.sh"), c]);
  eq(w.status, 0, "install.sh re-run exit");
  eq(status(c), "", "git status clean after install.sh");
  eq(sync(["plan", c]).out.status, "clean", "plan of all installed packages clean");
});

test("upgrade by --ref: navbar 2.3.0 → HEAD fast-forwards, adds foundation as a dependency", () => {
  const c = client("upgrade");
  eq(sync(["apply", c, "navbar", "--ref", NAVBAR_230]).code, 0, "install old");
  eq(prov(c, "navbar").version, "2.3.0", "old version");
  ok(!exists(c, "src/components/foundation"), "2.3.0 needs no foundation");
  commitAll(c, "navbar 2.3.0");
  const plan = sync(["plan", c, "navbar"]);
  eq(plan.code, 0, `plan exit (${plan.out.review.concat(plan.out.blockers).join(" | ")})`);
  const p = pkgPlan(plan.out, "navbar");
  eq(p.action, "upgrade", "action upgrade");
  ok(p.files.filter((f) => f.class === "fast-forward").length > 3, "several fast-forwards");
  ok(p.changelog.some((s) => s.heading.startsWith("2.8.0")) && !p.changelog.some((s) => s.heading.startsWith("2.3.0")), "changelog excerpt (2.3.0, 2.8.0]");
  ok(p.changelog.some((s) => s.highlights.some((h) => /Requires `foundation`/.test(h))), "Requires line highlighted");
  eq(pkgPlan(plan.out, "foundation")?.action, "install", "foundation installed as dependency");
  ok(pkgPlan(plan.out, "foundation").reasons[0].includes("navbar"), "dependency reason names navbar");
  eq(sync(["apply", c, "navbar"]).code, 0, "apply");
  eq(sameAsLibrary(c, S, "navbar", ["navbar.config.tsx", "brand/"]).join("; "), "", "navbar = HEAD (client-owned aside)");
  eq(prov(c, "navbar").commit, S, "new base recorded");
  ok(exists(c, "src/components/navbar/navbar.theme.css"), "theme created on upgrade");
  eq(sync(["verify", c]).code, 0, "verify");
});

test("removal upstream: a file deleted upstream is deleted from an untouched client (navbar purge fix)", () => {
  const R = fixture("navbar-extra-file", (p) => {
    fs.writeFileSync(p("components/navbar/src/legacyHelper.ts"), "export const legacy = 1;\n");
    fs.writeFileSync(p("components/navbar/VERSION"), "2.7.9\n");
  });
  const c = client("removal");
  eq(sync(["apply", c, "navbar", "--ref", R]).code, 0, "install fixture");
  ok(exists(c, "src/components/navbar/legacyHelper.ts"), "extra file installed");
  commitAll(c, "navbar fixture");
  const plan = sync(["plan", c, "navbar"]);
  eq(fileClass(pkgPlan(plan.out, "navbar"), "legacyHelper.ts"), "removed", "classified removed");
  eq(sync(["apply", c, "navbar"]).code, 0, "apply");
  ok(!exists(c, "src/components/navbar/legacyHelper.ts"), "removed from client");
  ok(!("legacyHelper.ts" in prov(c, "navbar").files), "gone from provenance");
});

test("client patch merging cleanly: carried onto upstream, recorded as a patch with a TODO reason", () => {
  const c = client("merge");
  eq(sync(["apply", c, "navbar", "--ref", NAVBAR_230]).code, 0, "install old");
  // A file upstream changed below its first lines: prepend a comment there.
  const candidates = libTree(NAVBAR_230, "navbar").filter((f) => /\.(tsx?|css)$/.test(f) && !f.startsWith("brand/") && f !== "navbar.config.tsx");
  const target = candidates.find((f) => {
    const a = libFile(NAVBAR_230, `components/navbar/src/${f}`);
    const b = sh("git", ["show", `${S}:components/navbar/src/${f}`], LIB);
    return b.status === 0 && a !== b.stdout && firstDiffLine(a, b.stdout) > 8;
  });
  ok(target, "found an upstream-changed file to patch");
  const rel = `src/components/navbar/${target}`;
  const patchLine = target.endsWith(".css") ? "/* client: tchin overflow shift */" : "// client: tchin overflow shift";
  fs.writeFileSync(path.join(c, rel), `${patchLine}\n${read(c, rel)}`);
  commitAll(c, "client patch");
  const plan = sync(["plan", c, "navbar"]);
  const f = pkgPlan(plan.out, "navbar").files.find((x) => x.path === target);
  eq(f?.class, "merge-clean", "classified merge-clean");
  eq(f?.note, "client patch carried onto upstream", "note");
  ok(plan.out.review.some((r) => r.includes("unrecorded")), "unrecorded change flagged (exit 2)");
  eq(plan.code, 2, "plan exit 2");
  const w = sh("bash", [path.join(LIB, "components/navbar/install.sh"), c]);
  eq(w.status, 2, "install.sh refuses a plan that needs review");
  eq(status(c), "", "install.sh wrote nothing");
  const a = sync(["apply", c, "navbar"]);
  eq(a.code, 0, "apply exit");
  const merged = read(c, rel);
  eq(merged, `${patchLine}\n${libFile(S, `components/navbar/src/${target}`)}`, "result = upstream + client line");
  const pv = prov(c, "navbar");
  eq(pv.patches[target], "TODO: reason", "patch recorded with TODO reason");
  const diff = read(c, "src/components/.evoview/patches/navbar.diff");
  ok(diff.includes(`+${patchLine}`), "patch diff carries the line");
  // The record is a real patch: it applies to the library file and reproduces the client's.
  const scratch = path.join(TMP, "patch-check");
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(path.join(scratch, target)), { recursive: true });
  fs.writeFileSync(path.join(scratch, target), libFile(S, `components/navbar/src/${target}`));
  const ap = sh("git", ["apply", "--unsafe-paths", "--directory=.", path.join(c, "src/components/.evoview/patches/navbar.diff")], scratch);
  eq(ap.status, 0, `git apply of the patch record (${ap.stderr.trim()})`);
  eq(fs.readFileSync(path.join(scratch, target), "utf8"), merged, "patched library file = client file");
  const v1 = sync(["verify", c]);
  eq(v1.code, 2, "verify flags the TODO reason");
  ok(v1.out.packages.find((p) => p.name === "navbar").checks.some((x) => /patch reasons/.test(x.message)), "TODO reported");
  pv.patches[target] = "overflow shift for the Tchin capsule";
  fs.writeFileSync(path.join(c, "src/components/.evoview/navbar.json"), JSON.stringify(pv, null, 2) + "\n");
  eq(sync(["verify", c]).code, 0, "verify clean once the reason is filled");
  commitAll(c, "upgrade");
  // A later sync keeps the reason and the patch.
  const again = sync(["apply", c, "navbar"]);
  eq(again.code, 0, "re-apply");
  eq(prov(c, "navbar").patches[target], "overflow shift for the Tchin capsule", "reason survives a later sync");
  eq(status(c), "", "re-apply is a no-op");
  // An edit after the sync is reported by verify.
  fs.appendFileSync(path.join(c, rel), "\n");
  const v2 = sync(["verify", c]);
  ok(v2.out.packages.find((p) => p.name === "navbar").checks.some((x) => x.level === "fail" && /edited since the last sync/.test(x.message)), "post-sync edit reported");
});

test("conflicting patch: markers written, exit 2; resolve → apply records it → verify", () => {
  const c = client("conflict");
  eq(sync(["apply", c, "navbar", "--ref", NAVBAR_230]).code, 0, "install old");
  const target = "NavFinder.tsx";
  const base = libFile(NAVBAR_230, `components/navbar/src/${target}`);
  const theirs = libFile(S, `components/navbar/src/${target}`);
  const i = firstDiffLine(base, theirs);
  const lines = base.split("\n");
  lines[i] = `${lines[i]} /* client edit on the same line */`;
  fs.writeFileSync(path.join(c, "src/components/navbar", target), lines.join("\n"));
  commitAll(c, "client conflicting edit");
  const plan = sync(["plan", c, "navbar"]);
  eq(fileClass(pkgPlan(plan.out, "navbar"), target), "conflict", "classified conflict");
  eq(plan.code, 2, "plan exit 2");
  const a = sync(["apply", c, "navbar"]);
  eq(a.code, 2, "apply exit 2");
  const written = read(c, `src/components/navbar/${target}`);
  ok(/^<{7} client$/m.test(written) && /^\|{7} base navbar 2\.3\.0/m.test(written) && /^>{7} library navbar/m.test(written), "diff3 markers with labels");
  eq(prov(c, "navbar").pending?.[target], "content", "pending conflict in provenance");
  const v = sync(["verify", c]);
  eq(v.code, 2, "verify exit 2");
  ok(v.out.packages.find((p) => p.name === "navbar").checks.some((x) => /conflict markers/.test(x.message)), "verify reports markers");
  eq(sync(["plan", c, "navbar"]).out.status, "blocked", "plan blocked while markers remain");
  eq(sync(["apply", c, "navbar"]).code, 2, "apply refuses while markers remain");
  // Foreign uncommitted work elsewhere in the package blocks apply.
  const typesPath = path.join(c, "src/components/navbar/types.ts");
  const typesAsApplied = fs.readFileSync(typesPath);
  fs.appendFileSync(typesPath, "// another agent\n");
  // Resolve: take upstream's version of the hunk, keep the client's comment on its own line.
  const resolved = `${theirs.replace(/\n$/, "")}\n/* client edit on the same line */\n`;
  fs.writeFileSync(path.join(c, "src/components/navbar", target), resolved);
  const refused = sync(["apply", c, "navbar"]);
  eq(refused.code, 2, "foreign uncommitted change refuses apply");
  ok(refused.out.refused?.includes("uncommitted"), "refusal names uncommitted changes");
  ok(refused.out.foreign?.some((f) => f.endsWith("types.ts")) && !refused.out.foreign?.some((f) => f.endsWith(target)), "only the foreign file is listed (the resolved conflict is ours)");
  fs.writeFileSync(typesPath, typesAsApplied);
  const rec = sync(["apply", c, "navbar"]);
  eq(rec.code, 0, `apply records the resolution (${rec.out.refused ?? ""} ${rec.out.blockers?.join(" | ") ?? ""})`);
  eq(prov(c, "navbar").pending, undefined, "pending cleared");
  eq(prov(c, "navbar").patches[target], "TODO: reason", "resolution recorded as a patch");
  eq(read(c, `src/components/navbar/${target}`), resolved, "resolution untouched");
  const pv = prov(c, "navbar");
  pv.patches[target] = "client comment";
  fs.writeFileSync(path.join(c, "src/components/.evoview/navbar.json"), JSON.stringify(pv, null, 2) + "\n");
  eq(sync(["verify", c]).code, 0, "verify clean");
});

test("clean merge where client and upstream add the same new identifier is flagged for review", () => {
  const U = fixture("upstream-shift", (p) => {
    const f = p("components/story-blocks/src/story-blocks.css");
    fs.writeFileSync(f, `${fs.readFileSync(f, "utf8")}\n.evsb-demo { translate: var(--evsb-demo-shift, 0px) 0; }\n`);
  });
  const c = client("overlap");
  eq(sync(["apply", c, "story-blocks"]).code, 0, "install at S");
  const rel = "src/components/story-blocks/story-blocks.css";
  fs.writeFileSync(path.join(c, rel), `/* client */ .ev-story-blocks { --evsb-demo-shift: 4px; }\n${read(c, rel)}`);
  commitAll(c, "client shift");
  const plan = sync(["plan", c, "story-blocks", "--ref", U]);
  const f = pkgPlan(plan.out, "story-blocks").files.find((x) => x.path === "story-blocks.css");
  eq(f?.class, "merge-clean", "textually clean");
  ok(f?.overlap?.includes("--evsb-demo-shift"), "shared new identifier detected");
  ok(plan.out.review.some((r) => r.includes("duplicated upstream")), "review item");
});

test("client-owned preserved (legacy navbar 2.3.0 install, edited config, deleted brand/), theme created then kept", () => {
  const c = client("owned");
  legacyInstall(c, "navbar", NAVBAR_230);
  eq(read(c, "src/components/navbar/.navbar-version").trim(), "2.3.0", "legacy stamp written by the old install.sh");
  const cfg = path.join(c, "src/components/navbar/navbar.config.tsx");
  // The client drops the reference brand/ and takes the wordmark from foundation (installed by the upgrade).
  const cfgText = fs.readFileSync(cfg, "utf8").replace('"./brand/EvoviewLogo"', '"../foundation/brand/EvoviewLogo"');
  fs.writeFileSync(cfg, `${cfgText}\n// client: Tchin labels\n`);
  fs.rmSync(path.join(c, "src/components/navbar/brand"), { recursive: true });
  commitAll(c, "legacy navbar, customised");
  const cfgBefore = fs.readFileSync(cfg, "utf8");
  const plan = sync(["plan", c, "navbar"]);
  const p = pkgPlan(plan.out, "navbar");
  ok(p.from.adopted, "adopted (no provenance)");
  eq(p.from.adopted.distance.files, 0, "adoption found an exact package match");
  const owned = Object.fromEntries(p.owned.map((o) => [o.path, o]));
  eq(owned["navbar.config.tsx"]?.state, "kept", "config kept");
  eq(owned["navbar.config.tsx"]?.templateChanged, true, "template change reported");
  ok(owned["navbar.config.tsx"]?.diff?.startsWith("diff --git a/navbar.config.tsx"), "template diff included");
  eq(owned["navbar.theme.css"]?.state, "create", "theme to create");
  eq(owned["brand/"]?.state, "absent", "brand/ absent, not recreated");
  eq(sync(["apply", c, "navbar"]).code, 0, "apply");
  eq(fs.readFileSync(cfg, "utf8"), cfgBefore, "config byte-identical");
  ok(!exists(c, "src/components/navbar/brand"), "brand/ still absent");
  ok(exists(c, "src/components/navbar/navbar.theme.css"), "theme created");
  ok(prov(c, "navbar").adoptedFrom?.stamp === "2.3.0", "adoption recorded in provenance");
  commitAll(c, "upgrade");
  const theme = path.join(c, "src/components/navbar/navbar.theme.css");
  fs.writeFileSync(theme, fs.readFileSync(theme, "utf8").replace("/* --nav-accent: #3f51b5; */", "--nav-accent: #c0392b;"));
  commitAll(c, "client theme");
  const themed = fs.readFileSync(theme, "utf8");
  const again = sync(["apply", c, "navbar"]);
  eq(again.code, 0, "re-apply");
  eq(fs.readFileSync(theme, "utf8"), themed, "edited theme never overwritten");
  eq(status(c), "", "no-op");
  eq(sync(["verify", c]).code, 0, "verify (client-owned edits are not patches)");
});

test("compat: foundation 2.0.0 fixture → controls listed as a required upgrade, reservation a blocker", () => {
  const F = fixture("foundation-major", (p) => {
    fs.writeFileSync(p("components/foundation/VERSION"), "2.0.0\n");
    const nav = JSON.parse(fs.readFileSync(p("components/navbar/evoview.json"), "utf8"));
    nav.requires.foundation = ">=2.0.0 <3";
    fs.writeFileSync(p("components/navbar/evoview.json"), JSON.stringify(nav, null, 2) + "\n");
    const ctl = JSON.parse(fs.readFileSync(p("components/controls/evoview.json"), "utf8"));
    ctl.requires.foundation = ">=1.9.0 <3";
    fs.writeFileSync(p("components/controls/evoview.json"), JSON.stringify(ctl, null, 2) + "\n");
  });
  const c = client("compat");
  eq(sync(["apply", c, "reservation"]).code, 0, "install reservation (+controls, foundation 1.9.x)");
  commitAll(c, "reservation");
  const plan = sync(["plan", c, "navbar", "--ref", F]);
  eq(plan.code, 2, "plan exit 2");
  eq(pkgPlan(plan.out, "foundation")?.to.version, "2.0.0", "foundation pulled to 2.0.0");
  ok(plan.out.compat.some((x) => x.package === "controls" && x.required), "controls: required upgrade (library controls accepts 2.0.0)");
  ok(plan.out.blockers.some((b) => b.startsWith("reservation:")), "reservation: blocker (library reservation still <2)");
  const untouched = Object.fromEntries(plan.out.untouched.map((u) => [u.name, u]));
  eq(untouched.reservation?.compatible, false, "reservation incompatible");
  const a = sync(["apply", c, "navbar", "--ref", F]);
  eq(a.code, 2, "apply refuses");
  eq(status(c), "", "nothing written");
  // Same library, compatible case: navbar at S needs foundation >=1.9.0, which is installed → untouched.
  const ok2 = sync(["plan", c, "navbar"]);
  eq(ok2.code, 0, "plan at S clean");
  eq(pkgPlan(ok2.out, "foundation"), undefined, "foundation left untouched (compatible, not lockstep)");
  ok(ok2.out.untouched.every((u) => u.compatible), "installed packages compatible");
});

test("legacy adopt: old install.sh copies → base = the library commit (reservation 2.8.0, navbar 2.1.0 with a patch)", () => {
  const c = client("adopt");
  legacyInstall(c, "reservation", RESERVATION_280);
  legacyInstall(c, "navbar", NAVBAR_210);
  // The Tchin-style patch: a client line in NavFinder.tsx and navbar.css.
  for (const f of ["NavFinder.tsx", "navbar.css"]) {
    const abs = path.join(c, "src/components/navbar", f);
    fs.writeFileSync(abs, fs.readFileSync(abs, "utf8").replace(/\n$/, f.endsWith(".css") ? "\n/* client overflow shift */\n" : "\n// client overflow shift\n"));
  }
  const cfg = path.join(c, "src/components/reservation/reservation.config.tsx");
  fs.writeFileSync(cfg, fs.readFileSync(cfg, "utf8").replace(/\n$/, "\n// client venue\n"));
  commitAll(c, "legacy installs");
  const r1 = sync(["plan", c, "reservation", "--ref", RESERVATION_280]);
  const pr = pkgPlan(r1.out, "reservation");
  eq(pr.from.commit, RESERVATION_280, "reservation base = b811804");
  eq(pr.from.adopted.distance.files, 0, "reservation: exact match");
  eq(pr.action, "current", "adopting in place = current");
  eq(r1.code, 0, "adopt-in-place plan clean");
  const r2 = sync(["plan", c, "navbar", "--ref", NAVBAR_210]);
  const pn = pkgPlan(r2.out, "navbar");
  eq(pn.from.commit, NAVBAR_210, "navbar base = 1fd9195");
  eq(pn.from.adopted.distance.files, 2, "navbar: the two patched files differ");
  eq(pn.unrecorded.map((u) => u.path).sort().join(","), "NavFinder.tsx,navbar.css", "patched files are unrecorded changes");
  eq(r2.code, 2, "unrecorded changes need review");
  // Adopt in place: records the provenance and the two patches, writes no package file.
  const a = sync(["apply", c, "navbar", "--ref", NAVBAR_210]);
  eq(a.code, 0, "apply in place");
  eq(Object.keys(prov(c, "navbar").patches).sort().join(","), "NavFinder.tsx,navbar.css", "patches recorded");
  eq(must("git", ["status", "--porcelain"], c).split("\n").filter((l) => !l.includes(".evoview/")).filter(Boolean).length, 0, "only .evoview/ written");
});

test("verify --typecheck: every package installed into one client compiles (tsc, library node_modules)", () => {
  if (!fs.existsSync(path.join(SRC, "node_modules", ".bin", "tsc"))) { ok(true, "skipped: no node_modules"); return; }
  const c = client("typecheck", { nodeModules: true });
  const names = ["foundation", "controls", "card", "chapter", "dossier", "navbar", "process-sequence", "reservation", "selector-stage", "story-blocks"];
  const r = sync(["apply", c, ...names]);
  eq(r.code, 0, `apply all (${r.out.review?.join(" | ") ?? ""})`);
  fs.writeFileSync(path.join(c, "src/main.tsx"), names.map((n) => `import "@/components/${n}";`).join("\n") + "\n");
  const v = sync(["verify", c, "--typecheck"]);
  eq(v.out.typecheck?.ok, true, `tsc ok (${v.out.typecheck?.output?.slice(0, 600)})`);
  eq(v.code, 0, "verify exit");
});

test("--worktree marks a dirty install; the next plan from git warns and still merges", () => {
  const c = client("worktree");
  const f = path.join(LIB, "components/story-blocks/src/types.ts");
  const orig = fs.readFileSync(f, "utf8");
  fs.writeFileSync(f, `${orig}// worktree-only edit\n`);
  try {
    const r = sync(["apply", c, "story-blocks", "--worktree"]);
    eq(r.code, 0, "apply --worktree");
    eq(prov(c, "story-blocks").dirty, true, "dirty: true");
    eq(prov(c, "controls").dirty, false, "untouched dependency not dirty");
  } finally {
    fs.writeFileSync(f, orig);
  }
  commitAll(c, "worktree install");
  const plan = sync(["plan", c, "story-blocks"]);
  ok(plan.out.warnings.some((w) => /dirty library worktree/.test(w)), "dirty base warning");
  eq(fileClass(pkgPlan(plan.out, "story-blocks"), "types.ts"), "fast-forward", "worktree-only edit fast-forwards back to git");
});

test("client-added and client-deleted files, unmanaged directory blocker, unknown package", () => {
  const c = client("misc");
  eq(sync(["apply", c, "controls"]).code, 0, "install");
  fs.writeFileSync(path.join(c, "src/components/controls/ClientExtra.tsx"), "export const extra = 1;\n");
  fs.rmSync(path.join(c, "src/components/controls/copy.tsx"));
  const plan = sync(["plan", c, "controls"]);
  const p = pkgPlan(plan.out, "controls");
  eq(fileClass(p, "ClientExtra.tsx"), "client-added", "client-added");
  eq(fileClass(p, "copy.tsx"), "kept", "client deletion kept");
  eq(p.unrecorded.length, 2, "both unrecorded");
  const v = sync(["verify", c]);
  ok(v.out.packages[0].checks.some((x) => /does not resolve/.test(x.message)), "verify: a deleted module breaks an import");
  fs.mkdirSync(path.join(c, "src/components/chapter"), { recursive: true });
  fs.writeFileSync(path.join(c, "src/components/chapter/Mine.tsx"), "export {};\n");
  const b = sync(["plan", c, "chapter"]);
  ok(b.out.blockers.some((x) => /not an Evoview install/.test(x)), "unmanaged dir blocks");
  eq(sync(["plan", c, "nope"]).code, 1, "unknown package → exit 1");
});

// ── summary ─────────────────────────────────────────────────────────────

const failed = results.filter((r) => r.failed.length);
const checks = results.reduce((n, r) => n + r.checks, 0);
console.log(`\n${results.length - failed.length}/${results.length} cases passed, ${checks} checks${KEEP ? `, kept ${TMP}` : ""}`);
if (!KEEP && !failed.length) {
  for (const wt of fs.readdirSync(TMP).filter((d) => d.startsWith("legacy-"))) sh("git", ["worktree", "remove", "--force", path.join(TMP, wt)], LIB);
  fs.rmSync(TMP, { recursive: true, force: true });
} else if (failed.length) console.log(`scratch kept for inspection: ${TMP}`);
process.exitCode = failed.length ? 1 : 0;
