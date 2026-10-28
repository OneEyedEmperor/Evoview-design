#!/usr/bin/env node
// Fixture run of triage.mjs and lineage-check.mjs: a scratch library and site
// repo in /tmp. node scripts/triage-test.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { LIBRARY_ROOT } from "./downstream-lib.mjs";

const base = mkdtempSync(join(tmpdir(), "evoview-triage-test-"));
const lib = join(base, "lib");
const site = join(base, "site");
let failures = 0;
const ok = (cond, label) => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${label}`);
  if (!cond) failures++;
};
const sh = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const write = (root, path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
const commit = (cwd, message) => {
  sh(cwd, "add", "-A");
  sh(cwd, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", message);
  return sh(cwd, "rev-parse", "HEAD");
};
const node = (script, args) => {
  try {
    return { code: 0, out: execFileSync("node", [join(LIBRARY_ROOT, "scripts", script), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (error) {
    return { code: error.status, out: String(error.stdout) + String(error.stderr) };
  }
};
const triage = (...extra) => JSON.parse(node("triage.mjs", ["site", "--json", "--root", lib, ...extra]).out);

try {
  for (const dir of [lib, site]) {
    mkdirSync(dir, { recursive: true });
    sh(dir, "init", "-q", "-b", "main");
  }

  write(site, "src/x.ts", "x0\n");
  write(site, "src/y.ts", "y0\n");
  write(site, "src/z.ts", "z0\n");
  const S0 = commit(site, "site base");
  write(site, "src/x.ts", "x1\n");
  const S1 = commit(site, "site: x changes");
  write(site, "src/z.ts", "z1\n");
  commit(site, "site: unmapped change");

  write(lib, "components/foo/VERSION", "1.0.0\n");
  write(lib, "components/foo/CHANGELOG.md", "# foo\n\n## 1.0.0\n\n- first\n");
  write(lib, "components/foo/src/a.ts", "a0\n");
  write(lib, "components/foo/src/b.ts", "b0\n");
  const L0 = commit(lib, "foo 1.0.0");
  write(lib, "components/foo/VERSION", "1.1.0\n");
  write(lib, "components/foo/CHANGELOG.md", "# foo\n\n## 1.1.0\n\n- a changes\n\n## 1.0.0\n\n- first\n");
  write(lib, "components/foo/src/a.ts", "a1\n");
  const L1 = commit(lib, "foo 1.1.0: a");
  write(lib, "components/foo/src/b.ts", "b1\n");
  const L2 = commit(lib, "foo: b, not released");

  const lineage = {
    schema: 1,
    capabilities: [
      { id: "cap-a", title: "A", class: "P", source: "split-by-design",
        library: { package: "foo", files: ["components/foo/src/a.ts"] },
        downstream: { site: { relation: "counterpart", origin: { ref: S0.slice(0, 7), files: ["src/x.ts"] }, files: ["src/x.ts"] } } },
      { id: "cap-b", title: "B", class: "V", source: "library",
        library: { package: "foo", files: ["components/foo/src/b.ts"] },
        downstream: { site: { relation: "installed", files: ["src/y.ts"] } } },
    ],
  };
  const plan = { layer: "Constraints", targets: ["src/x.ts"], adaptation: "-", risk: "low", verify: "-", size: "xs", value: "low", signoff: false, recommendation: "-" };
  const ledger = {
    site: "site", repo: site, branch: "main",
    fork: { commit: S0, snapshot: S0, library: L0 },
    libraryReviewed: L0, siteReviewed: S0,
    items: [
      { id: "item-down", capability: "cap-a", direction: "down", class: "P", source: "foo@1.1.0", incorporatedIn: null, status: "candidate", reason: "r", evidence: [], date: "2026-10-28", ...plan },
      { id: "item-up", capability: "cap-a", direction: "up", class: "X", source: [S1.slice(0, 7)], incorporatedIn: null, status: "n/a", reason: "r", evidence: [], date: "2026-10-28" },
    ],
  };
  const save = () => {
    write(lib, "lineage.json", JSON.stringify(lineage, null, 2));
    write(lib, "downstream/site.json", JSON.stringify(ledger, null, 2));
  };
  save();

  console.log("lineage-check");
  ok(node("lineage-check.mjs", ["--root", lib]).code === 0, "fixture lineage + ledger clean");
  lineage.capabilities[0].downstream.site.files = ["src/missing.ts"];
  save();
  const broken = node("lineage-check.mjs", ["--root", lib]);
  ok(broken.code === 2 && broken.out.includes("src/missing.ts missing at siteReviewed"), "missing site path reported (exit 2)");
  lineage.capabilities[0].downstream.site.files = ["src/x.ts"];
  ledger.items[0].source = "foo@9.9.9";
  save();
  ok(node("lineage-check.mjs", ["--root", lib]).out.includes("foo@9.9.9: no CHANGELOG heading"), "unknown CHANGELOG source reported");
  ledger.items[0].source = "foo@1.1.0";
  save();

  console.log("triage");
  const r = triage();
  const a = r.capabilities.find((g) => g.id === "cap-a");
  const b = r.capabilities.find((g) => g.id === "cap-b");
  ok(JSON.stringify(r.library.packages) === '["foo"]', "packages = down-relevant packages");
  ok(a?.changelog.length === 1 && a.changelog[0].source === "foo@1.1.0" && a.changelog[0].ledger[0].id === "item-down", "new CHANGELOG section grouped under the ledger item's capability");
  ok(a?.libraryCommits.map((c) => c.sha).join() === L1.slice(0, 7), "library commit mapped to cap-a by file");
  ok(b?.libraryCommits[0]?.sha === L2.slice(0, 7) && b.libraryCommits[0].unreleased === true, "commit after the last VERSION bump flagged unreleased");
  ok(a?.siteCommits.length === 1 && a.siteCommits[0].sha === S1.slice(0, 7) && a.siteCommits[0].ledger[0].status === "n/a", "site commit on a mapped file carries its ledger status; unmapped commit ignored");
  ok(r.provenance === null, "provenance skipped without sync.sh");
  ok(r.open.length === 1 && r.open[0].id === "item-down", "open items listed");
  ok(r.counts.changelogUntriaged === 0 && r.counts.siteUntriaged === 0, "nothing untriaged");
  ok(JSON.stringify(triage()) === JSON.stringify(r), "deterministic");

  write(site, "src/y.ts", "y1\n");
  const S3 = commit(site, "site: y changes");
  const r2 = triage();
  ok(r2.counts.siteUntriaged === 1 && r2.capabilities.find((g) => g.id === "cap-b")?.siteCommits[0].sha === S3.slice(0, 7), "new site commit is untriaged");

  ledger.libraryReviewed = L2;
  ledger.siteReviewed = S3;
  save();
  const r3 = triage();
  ok(r3.counts.changelog === 0 && r3.counts.siteCommits === 0, "advanced reviewed commits: nothing new");
  ok(triage("--from-fork").counts.changelog === 1, "--from-fork replays from the fork points");

  // Snapshot tag off the branch, tracking a file the branch leaves untracked.
  write(site, "src/w.ts", "w-snapshot\n");
  sh(site, "add", "src/w.ts");
  const tree = sh(site, "write-tree");
  const snapshot = sh(site, "-c", "user.name=t", "-c", "user.email=t@t", "commit-tree", tree, "-p", S3, "-m", "snapshot");
  sh(site, "rm", "-q", "--cached", "src/w.ts");
  write(site, "src/w.ts", "w-edited\n");
  lineage.capabilities[1].downstream.site.files = ["src/y.ts", "src/w.ts"];
  ledger.siteReviewed = snapshot;
  save();
  const r4 = triage();
  const entry = r4.capabilities.find((g) => g.id === "cap-b")?.siteCommits[0];
  ok(r4.siteRepo.ancestor === false && entry?.sha === "worktree" && entry.files.map((f) => `${f.path}:${f.state}`).join() === "src/w.ts:modified", "snapshot mode compares untracked working files with the snapshot blobs");
} finally {
  rmSync(base, { recursive: true, force: true });
}

console.log(failures ? `${failures} failure(s)` : "all passed");
process.exit(failures ? 1 : 0);
