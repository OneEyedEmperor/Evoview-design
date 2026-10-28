#!/usr/bin/env node
// Downstream triage worklist for one site (read-only, deterministic).
//   node scripts/triage.mjs <site> [--json] [--from-fork] [--root <library dir>]
// Reads lineage.json + downstream/<site>.json and lists, grouped by capability:
// library CHANGELOG sections / commits since libraryReviewed (packages the site
// installs or has a counterpart of), site commits since siteReviewed touching
// mapped files, sync.sh verify (provenance drift), open ledger items.
// --from-fork replays from the ledger's fork points. Exit 0 report, 1 error.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DOWN_RELATIONS, LIBRARY_ROOT, OPEN, asArray, changelogSections, classFor, git, isAncestor,
  isChangelogSource, loadLedger, loadLineage, matchHeadings, resolveRef, short, showAt, splitSource,
} from "./downstream-lib.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const site = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--root");
const root = option("--root") ?? LIBRARY_ROOT;

if (!site) {
  console.error("usage: node scripts/triage.mjs <site> [--json] [--from-fork] [--root <library dir>]");
  process.exit(1);
}

const SEP = "\x1f";

export function triage(root, site, { fromFork = false } = {}) {
  const lineage = loadLineage(root);
  const ledger = loadLedger(root, site);
  const repo = ledger.repo;
  if (!existsSync(repo)) throw new Error(`site repo ${repo} missing`);
  const items = ledger.items ?? [];

  const caps = lineage.capabilities.filter((c) => c.downstream?.[site]);
  const capOrder = caps.map((c) => c.id);
  const libFrom = fromFork ? ledger.fork?.library : ledger.libraryReviewed;
  const siteFrom = fromFork ? ledger.fork?.snapshot ?? ledger.fork?.commit : ledger.siteReviewed;
  const libHead = resolveRef(root, "HEAD");
  const libFromSha = resolveRef(root, libFrom ?? "");
  const siteHead = resolveRef(repo, "HEAD");
  const siteFromSha = resolveRef(repo, siteFrom ?? "");
  if (!libFromSha) throw new Error(`library ref ${libFrom} does not resolve`);
  if (!siteFromSha) throw new Error(`site ref ${siteFrom} does not resolve`);

  const groups = new Map();
  const group = (id) => {
    if (!groups.has(id)) groups.set(id, { id, changelog: [], libraryCommits: [], siteCommits: [], items: [] });
    return groups.get(id);
  };
  const statusOf = (matched) => (matched.length ? matched.map((i) => ({ id: i.id, status: i.status })) : [{ id: null, status: "untriaged" }]);

  // ── Library: packages the site runs or has a counterpart of ──
  const downCaps = caps.filter((c) => DOWN_RELATIONS.includes(c.downstream[site].relation));
  const packages = [...new Set(downCaps.map((c) => c.library.package))].sort();
  const sourceItems = (pkg, heading, headings) =>
    items.filter((i) => asArray(i.source).some((s) => {
      if (!isChangelogSource(s)) return false;
      const { package: p, spec } = splitSource(s);
      return p === pkg && matchHeadings(spec, headings).includes(heading);
    }));
  const fileCaps = (pkg) => {
    const map = new Map();
    for (const c of downCaps.filter((c) => c.library.package === pkg)) for (const f of c.library.files) map.set(f, [...(map.get(f) ?? []), c.id]);
    return map;
  };

  for (const pkg of packages) {
    const now = changelogSections(root, pkg, "HEAD");
    const headings = now.map((s) => s.heading);
    const before = new Set(changelogSections(root, pkg, libFromSha).map((s) => s.heading));
    const pkgCaps = downCaps.filter((c) => c.library.package === pkg).map((c) => c.id);
    for (const s of now.filter((s) => !before.has(s.heading))) {
      const matched = sourceItems(pkg, s.heading, headings);
      const target = [...new Set(matched.map((i) => i.capability))].filter((id) => capOrder.includes(id));
      const entry = { package: pkg, heading: s.heading, source: `${pkg}@${s.heading}`, ledger: statusOf(matched) };
      for (const id of target.length ? target : pkgCaps.length === 1 ? pkgCaps : [`${pkg}:*`]) group(id).changelog.push(entry);
    }

    const lastRelease = git(root, ["log", "-1", "--format=%H", "HEAD", "--", `components/${pkg}/VERSION`]).trim();
    const log = git(root, ["log", "--date=short", `--format=@@${["%H", "%ad", "%s"].join(SEP)}`, "--name-only", `${libFromSha}..HEAD`, "--", `components/${pkg}/src`]);
    const byFile = fileCaps(pkg);
    const unreleased = new Set(git(root, ["log", "--format=%H", lastRelease ? `${lastRelease}..HEAD` : "HEAD", "--", `components/${pkg}/src`]).split("\n").filter(Boolean));
    for (const block of log.split("@@").filter((b) => b.trim())) {
      const [head, ...files] = block.trim().split("\n");
      const [sha, date, subject] = head.split(SEP);
      const touched = files.filter(Boolean);
      const ids = new Set(touched.flatMap((f) => byFile.get(f) ?? [`${pkg}:*`]));
      const commit = { sha: short(sha), date, subject, package: pkg, files: touched.length, unreleased: unreleased.has(sha) };
      for (const id of ids) group(id).libraryCommits.push(commit);
    }
  }

  // ── Site: commits touching mapped files ──
  const siteFileCaps = new Map();
  for (const c of caps) {
    const d = c.downstream[site];
    for (const f of new Set([...asArray(d.files), ...asArray(d.origin?.files)])) siteFileCaps.set(f, [...(siteFileCaps.get(f) ?? []), c.id]);
  }
  const siteFiles = [...siteFileCaps.keys()].sort();
  const ancestor = isAncestor(repo, siteFromSha, siteHead);
  const commitItems = (sha) => items.filter((i) => asArray(i.source).some((s) => !isChangelogSource(s) && sha.startsWith(resolveRef(repo, s) ?? "\0")));
  const numstat = (text) => text.split("\n").filter(Boolean).map((l) => {
    const [add, del, path] = l.split("\t");
    return { path, add: add === "-" ? null : Number(add), del: del === "-" ? null : Number(del) };
  });
  const addSiteEntry = (entry, files) => {
    const ids = new Set(files.flatMap((f) => siteFileCaps.get(f.path) ?? []));
    for (const id of capOrder.filter((id) => ids.has(id))) {
      group(id).siteCommits.push({ ...entry, files: files.filter((f) => (siteFileCaps.get(f.path) ?? []).includes(id)) });
    }
  };
  let working = [];
  if (siteFiles.length && ancestor) {
    const log = git(repo, ["log", "--date=short", `--format=@@${["%H", "%ad", "%s"].join(SEP)}`, "--numstat", `${siteFromSha}..HEAD`, "--", ...siteFiles]);
    for (const block of log.split("@@").filter((b) => b.trim())) {
      const [head, ...rest] = block.trim().split("\n");
      const [sha, date, subject] = head.split(SEP);
      addSiteEntry({ sha: short(sha), date, subject, ledger: statusOf(commitItems(sha)) }, numstat(rest.join("\n")));
    }
    working = git(repo, ["status", "--porcelain", "--", ...siteFiles]).split("\n").filter(Boolean).map((l) => l.slice(3)).sort();
  } else if (siteFiles.length) {
    // Snapshot tag off the branch (may track files the branch leaves untracked):
    // compare each mapped file's snapshot blob with the working-tree file.
    const files = [];
    for (const path of siteFiles) {
      const blob = git(repo, ["rev-parse", "--verify", "--quiet", `${siteFromSha}:${path}`], { allowFail: true })?.trim() || null;
      const disk = existsSync(join(repo, path)) ? git(repo, ["hash-object", "--", path]).trim() : null;
      if (blob !== disk) files.push({ path, add: null, del: null, state: !disk ? "missing" : !blob ? "added" : "modified" });
    }
    if (files.length) addSiteEntry({ sha: "worktree", date: null, subject: `working tree vs ${short(siteFromSha)} (snapshot, not an ancestor of HEAD)`, ledger: [{ id: null, status: "untriaged" }] }, files);
  }

  // ── Provenance (sync.sh verify) ──
  let provenance = null;
  if (existsSync(join(root, "sync.sh"))) {
    let out;
    try {
      out = execFileSync(join(root, "sync.sh"), ["verify", repo, "--json"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      out = error.stdout;
    }
    try {
      const result = JSON.parse(out);
      provenance = {
        status: result.status,
        packages: result.packages.map((p) => {
          const libraryVersion = showAt(root, "HEAD", `components/${p.name}/VERSION`)?.trim() ?? null;
          const ahead = p.commit && resolveRef(root, p.commit)
            ? Number(git(root, ["rev-list", "--count", `${p.commit}..HEAD`, "--", `components/${p.name}/src`]).trim())
            : null;
          return {
            name: p.name, version: p.version, commit: short(p.commit), libraryVersion, libraryCommitsAhead: ahead,
            fail: p.checks.filter((c) => c.level === "fail").map((c) => c.message),
            warn: p.checks.filter((c) => c.level === "warn").map((c) => c.message),
          };
        }),
      };
    } catch {
      provenance = { status: "error", packages: [], error: "sync.sh verify returned no JSON" };
    }
  }

  // ── Ledger items per capability, open list ──
  for (const item of items) if (capOrder.includes(item.capability)) group(item.capability).items.push({ id: item.id, status: item.status, direction: item.direction, class: item.class });
  const open = items.filter((i) => OPEN.includes(i.status)).map((i) => ({
    id: i.id, capability: i.capability, status: i.status, direction: i.direction, class: i.class, layer: i.layer,
    size: i.size, value: i.value, risk: i.risk, signoff: i.signoff, hold: i.hold ?? null, dependsOn: asArray(i.dependsOn), reason: i.reason,
  }));

  const order = (id) => (capOrder.includes(id) ? capOrder.indexOf(id) : capOrder.length) + (id.endsWith(":*") ? 0.5 : 0);
  const capabilities = [...groups.values()]
    .filter((g) => g.changelog.length || g.libraryCommits.length || g.siteCommits.length || g.items.some((i) => OPEN.includes(i.status)))
    .sort((a, b) => order(a.id) - order(b.id) || a.id.localeCompare(b.id))
    .map((g) => {
      const cap = caps.find((c) => c.id === g.id);
      return cap
        ? { ...g, title: cap.title, class: classFor(cap, site), source: cap.source, relation: cap.downstream[site].relation }
        : { ...g, title: "package changes not mapped to a single capability (assign in the ledger)", class: null, source: null, relation: null };
    });

  const unique = (list, key) => [...new Map(list.map((x) => [key(x), x])).values()];
  const sections = unique(capabilities.flatMap((g) => g.changelog), (s) => s.source);
  const libCommits = unique(capabilities.flatMap((g) => g.libraryCommits), (c) => c.sha);
  const siteCommits = unique(capabilities.flatMap((g) => g.siteCommits), (c) => c.sha);
  const untriaged = (list) => list.filter((x) => x.ledger.some((l) => l.status === "untriaged")).length;

  return {
    site,
    library: { root, head: short(libHead), from: short(libFromSha), fromField: fromFork ? "fork.library" : "libraryReviewed", packages },
    siteRepo: { repo, branch: ledger.branch, head: short(siteHead), from: short(siteFromSha), fromField: fromFork ? "fork.snapshot" : "siteReviewed", ancestor, uncommitted: working },
    capabilities,
    provenance,
    open,
    counts: {
      changelog: sections.length, changelogUntriaged: untriaged(sections),
      libraryCommits: libCommits.length, libraryUnreleased: libCommits.filter((c) => c.unreleased).length,
      siteCommits: siteCommits.length, siteUntriaged: untriaged(siteCommits),
      open: open.filter((o) => !o.hold).length, onHold: open.filter((o) => o.hold).length,
    },
  };
}

function statusText(ledger) {
  return ledger.map((l) => (l.id ? `${l.status}: ${l.id}` : "UNTRIAGED")).join(", ");
}

function render(r) {
  const out = [];
  const pad = (s, n) => (s.length >= n ? s : s + " ".repeat(n - s.length));
  out.push(`Evoview downstream triage · ${r.site}`);
  out.push(`library  ${r.library.root}  HEAD ${r.library.head}  since ${r.library.from} (${r.library.fromField})  packages ${r.library.packages.join(", ")}`);
  out.push(`site     ${r.siteRepo.repo}  ${r.siteRepo.branch}  HEAD ${r.siteRepo.head}  since ${r.siteRepo.from} (${r.siteRepo.fromField})${r.siteRepo.ancestor ? "" : "  [not an ancestor of HEAD: working tree compared]"}`);
  for (const g of r.capabilities) {
    out.push("");
    out.push(g.relation ? `${g.id} · ${g.title} · ${g.class} · source ${g.source} · ${r.site} ${g.relation}` : `${g.id} · ${g.title}`);
    if (g.items.length) out.push(`  ledger     ${g.items.map((i) => `${i.id} [${i.status}]`).join(", ")}`);
    for (const s of g.changelog) out.push(`  changelog  ${pad(s.source, 44)} ${statusText(s.ledger)}`);
    for (const c of g.libraryCommits) out.push(`  library    ${c.sha} ${c.date} ${c.subject.slice(0, 90)}${c.unreleased ? "  [unreleased]" : ""}`);
    for (const c of g.siteCommits) {
      out.push(`  site       ${c.sha}${c.date ? ` ${c.date}` : ""} ${c.subject.slice(0, 80)}  ${statusText(c.ledger)}`);
      for (const f of c.files) out.push(`               ${f.path} ${f.state ?? (f.add == null ? "(binary)" : `+${f.add} -${f.del}`)}`);
    }
  }
  if (r.siteRepo.uncommitted.length) {
    out.push("");
    out.push(`uncommitted in mapped site files (not triaged; commit first): ${r.siteRepo.uncommitted.join(", ")}`);
  }
  out.push("");
  if (!r.provenance) out.push("provenance  skipped (no sync.sh in the library root)");
  else {
    out.push(`provenance (sync.sh verify): ${r.provenance.status}`);
    for (const p of r.provenance.packages) {
      const ahead = p.libraryCommitsAhead == null ? "" : `, ${p.libraryCommitsAhead} package commit(s) since the install`;
      out.push(`  ${p.name} ${p.version}${p.commit ? ` @ ${p.commit}` : ""} · library ${p.libraryVersion}${ahead}`);
      for (const m of [...p.fail, ...p.warn]) out.push(`    ${m}`);
    }
  }
  out.push("");
  out.push(`open ledger items (${r.open.length})`);
  for (const o of r.open) {
    out.push(`  ${pad(o.id, 30)} [${o.status}] ${pad(o.capability, 22)} ${o.direction} ${o.class} ${o.layer} · ${o.size} · value ${o.value} · risk ${o.risk}${o.signoff ? " · founder sign-off" : ""}${o.dependsOn.length ? ` · after ${o.dependsOn.join(", ")}` : ""}${o.hold ? ` · ON HOLD: ${o.hold}` : ""}`);
  }
  const c = r.counts;
  out.push("");
  out.push(`summary  changelog ${c.changelog} (${c.changelogUntriaged} untriaged) · library commits ${c.libraryCommits} (${c.libraryUnreleased} unreleased) · site commits ${c.siteCommits} (${c.siteUntriaged} untriaged) · open ${c.open}${c.onHold ? ` + ${c.onHold} on hold` : ""} · provenance ${r.provenance?.status ?? "skipped"}`);
  return out.join("\n");
}

try {
  const result = triage(root, site, { fromFork: flag("--from-fork") });
  console.log(flag("--json") ? JSON.stringify(result, null, 2) : render(result));
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}
