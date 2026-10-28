#!/usr/bin/env node
// Structural check of lineage.json and downstream/<site>.json (read-only):
// enums, ids, and every recorded path exists at its recorded ref.
//   node scripts/lineage-check.mjs [--root <library dir>]
// Exit 0 clean, 2 problems, 1 error.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CLASSES, DIRECTIONS, LAYERS, LEVELS, LIBRARY_ROOT, RELATIONS, SIZES, SOURCES, STATUSES, OPEN,
  asArray, changelogSections, existsAt, isChangelogSource, ledgerPath, loadJson, loadLineage,
  matchHeadings, resolveRef, splitSource,
} from "./downstream-lib.mjs";

const args = process.argv.slice(2);
const rootAt = args.indexOf("--root");
const root = rootAt >= 0 ? args[rootAt + 1] : LIBRARY_ROOT;

export function checkLineage(root) {
  const problems = [];
  const fail = (where, message) => problems.push(`${where}: ${message}`);
  const lineage = loadLineage(root);
  const caps = lineage.capabilities ?? [];
  const ids = new Set();
  const ledgers = {};
  const siteRefs = {};

  const ledgerFor = (site) => {
    if (site in ledgers) return ledgers[site];
    const path = ledgerPath(root, site);
    ledgers[site] = existsSync(path) ? loadJson(path) : null;
    return ledgers[site];
  };

  for (const cap of caps) {
    const where = `lineage ${cap.id ?? "?"}`;
    if (!/^[a-z0-9-]+$/.test(cap.id ?? "")) fail(where, "id must be kebab-case");
    if (ids.has(cap.id)) fail(where, "duplicate id");
    ids.add(cap.id);
    if (!cap.title) fail(where, "title missing");
    if (!CLASSES.includes(cap.class)) fail(where, `class ${cap.class} not in ${CLASSES}`);
    if (!SOURCES.includes(cap.source)) fail(where, `source ${cap.source} not in ${SOURCES}`);
    const pkg = cap.library?.package;
    if (!pkg || !existsAt(root, "HEAD", `components/${pkg}/VERSION`)) fail(where, `library package ${pkg} not at HEAD`);
    if (!asArray(cap.library?.files).length) fail(where, "library.files empty");
    for (const file of asArray(cap.library?.files)) {
      if (!file.startsWith(`components/${pkg}/`)) fail(where, `${file} outside components/${pkg}/`);
      else if (!existsAt(root, "HEAD", file)) fail(where, `${file} missing at library HEAD`);
    }
    for (const [site, d] of Object.entries(cap.downstream ?? {})) {
      const at = `${where} · ${site}`;
      const ledger = ledgerFor(site);
      if (!ledger) { fail(at, `no ledger downstream/${site}.json`); continue; }
      if (!existsSync(ledger.repo)) { fail(at, `site repo ${ledger.repo} missing`); continue; }
      if (!RELATIONS.includes(d.relation)) fail(at, `relation ${d.relation} not in ${RELATIONS}`);
      if (d.class && !CLASSES.includes(d.class)) fail(at, `class ${d.class} not in ${CLASSES}`);
      if (d.relation === "none" && asArray(d.files).length) fail(at, "relation none lists files");
      const reviewed = siteRefs[site] ??= resolveRef(ledger.repo, ledger.siteReviewed);
      if (!reviewed) { fail(at, `siteReviewed ${ledger.siteReviewed} does not resolve`); continue; }
      for (const file of asArray(d.files)) {
        if (!existsAt(ledger.repo, reviewed, file)) fail(at, `${file} missing at siteReviewed ${ledger.siteReviewed}`);
      }
      if (d.origin) {
        const ref = resolveRef(ledger.repo, d.origin.ref);
        if (!ref) fail(at, `origin ref ${d.origin.ref} does not resolve`);
        else for (const file of asArray(d.origin.files)) {
          if (!existsAt(ledger.repo, ref, file)) fail(at, `${file} missing at origin ${d.origin.ref}`);
        }
      }
    }
  }

  const sites = existsSync(join(root, "downstream"))
    ? readdirSync(join(root, "downstream")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
    : [];
  const headingsOf = {};
  const headings = (pkg) => (headingsOf[pkg] ??= changelogSections(root, pkg).map((s) => s.heading));

  for (const site of sites) {
    const ledger = ledgerFor(site);
    const where = `ledger ${site}`;
    if (ledger.site !== site) fail(where, `site field ${ledger.site} ≠ file name`);
    if (!existsSync(ledger.repo ?? "")) { fail(where, `repo ${ledger.repo} missing`); continue; }
    if (!ledger.branch) fail(where, "branch missing");
    if (!resolveRef(root, ledger.libraryReviewed ?? "")) fail(where, `libraryReviewed ${ledger.libraryReviewed} not a library commit`);
    if (!resolveRef(ledger.repo, ledger.siteReviewed ?? "")) fail(where, `siteReviewed ${ledger.siteReviewed} not a site commit`);
    for (const key of ["commit", "snapshot", "tag"]) {
      if (ledger.fork?.[key] && !resolveRef(ledger.repo, ledger.fork[key])) fail(where, `fork.${key} ${ledger.fork[key]} does not resolve`);
    }
    if (ledger.fork?.library && !resolveRef(root, ledger.fork.library)) fail(where, `fork.library ${ledger.fork.library} not a library commit`);
    const itemIds = new Set();
    for (const item of ledger.items ?? []) {
      const at = `${where} · ${item.id ?? "?"}`;
      if (!/^[a-z0-9-]+$/.test(item.id ?? "")) fail(at, "id must be kebab-case");
      if (itemIds.has(item.id)) fail(at, "duplicate id");
      itemIds.add(item.id);
      const cap = caps.find((c) => c.id === item.capability);
      if (!cap) fail(at, `capability ${item.capability} not in lineage`);
      else if (!cap.downstream?.[site]) fail(at, `capability ${item.capability} has no ${site} entry`);
      if (!DIRECTIONS.includes(item.direction)) fail(at, `direction ${item.direction}`);
      if (!CLASSES.includes(item.class)) fail(at, `class ${item.class}`);
      if (!STATUSES.includes(item.status)) fail(at, `status ${item.status}`);
      if (!item.reason) fail(at, "reason missing");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date ?? "")) fail(at, "date must be YYYY-MM-DD");
      if (!asArray(item.source).length) fail(at, "source missing");
      for (const source of asArray(item.source)) {
        if (isChangelogSource(source)) {
          const { package: pkg, spec } = splitSource(source);
          if (!matchHeadings(spec, headings(pkg)).length) fail(at, `source ${source}: no CHANGELOG heading`);
        } else if (!resolveRef(ledger.repo, source)) fail(at, `source ${source}: not a ${site} commit`);
      }
      for (const v of asArray(item.incorporatedIn)) {
        const { package: pkg, spec } = splitSource(v);
        if (!v.includes("@") || !matchHeadings(spec, headings(pkg)).length) fail(at, `incorporatedIn ${v}: no CHANGELOG heading`);
      }
      if (OPEN.includes(item.status) && !item.hold) {
        if (!LAYERS.includes(item.layer)) fail(at, `layer ${item.layer} not in ${LAYERS}`);
        if (!SIZES.includes(item.size)) fail(at, `size ${item.size}`);
        if (!LEVELS.includes(item.value) || !LEVELS.includes(item.risk)) fail(at, "value / risk must be low | medium | high");
        if (typeof item.signoff !== "boolean") fail(at, "signoff must be boolean");
        if (!asArray(item.targets).length) fail(at, "targets missing");
        if (!item.verify) fail(at, "verify missing");
        if (!item.recommendation) fail(at, "recommendation missing");
      }
    }
    for (const item of ledger.items ?? []) {
      for (const dep of asArray(item.dependsOn)) if (!itemIds.has(dep)) fail(`${where} · ${item.id}`, `dependsOn ${dep} unknown`);
    }
  }
  return { capabilities: caps.length, sites, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { capabilities, sites, problems } = checkLineage(root);
    for (const p of problems) console.log(`  fail  ${p}`);
    console.log(`lineage  ${capabilities} capabilities · ledgers ${sites.join(", ") || "none"} · ${problems.length ? `${problems.length} problem(s) (exit 2)` : "clean (exit 0)"}`);
    process.exit(problems.length ? 2 : 0);
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
