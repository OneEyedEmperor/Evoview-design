// Shared by lineage-check.mjs and triage.mjs: lineage + ledger loading,
// read-only git helpers, CHANGELOG sections, ledger source matching.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LIBRARY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const CLASSES = ["V", "C", "P", "X"];
export const SOURCES = ["library", "evoview", "tchin", "split-by-design"];
export const RELATIONS = ["installed", "counterpart", "origin", "none"];
export const DIRECTIONS = ["up", "down"];
export const STATUSES = ["candidate", "approved", "applied", "declined", "n/a"];
export const OPEN = ["candidate", "approved"];
export const LAYERS = ["Signature", "Variations", "Expression", "Constraints"];
export const SIZES = ["xs", "s", "m", "l", "xl"];
export const LEVELS = ["low", "medium", "high"];
/** Relations whose site code receives library changes (down triage). */
export const DOWN_RELATIONS = ["installed", "counterpart"];

export function git(cwd, args, { allowFail = false } = {}) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });
  } catch (error) {
    if (allowFail) return null;
    throw new Error(`git ${args.join(" ")} (in ${cwd}): ${String(error.stderr || error.message).trim()}`);
  }
}

export const resolveRef = (cwd, ref) => git(cwd, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { allowFail: true })?.trim() || null;
export const existsAt = (cwd, ref, path) => git(cwd, ["cat-file", "-e", `${ref}:${path}`], { allowFail: true }) !== null;
export const showAt = (cwd, ref, path) => git(cwd, ["show", `${ref}:${path}`], { allowFail: true });
export const isAncestor = (cwd, a, b) => git(cwd, ["merge-base", "--is-ancestor", a, b], { allowFail: true }) !== null;
export const short = (sha) => (sha ? sha.slice(0, 7) : sha);

export function loadJson(path) {
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadLineage(root) {
  return loadJson(join(root, "lineage.json"));
}

export function ledgerPath(root, site) {
  return join(root, "downstream", `${site}.json`);
}

export function loadLedger(root, site) {
  return loadJson(ledgerPath(root, site));
}

/** `## ` sections of a package CHANGELOG at a ref (null ref = working tree). */
export function changelogSections(root, pkg, ref = "HEAD") {
  const path = `components/${pkg}/CHANGELOG.md`;
  const text = ref ? showAt(root, ref, path) : existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null;
  if (!text) return [];
  const sections = [];
  for (const line of text.split("\n")) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (m) sections.push({ package: pkg, heading: m[1], body: [] });
    else if (sections.length) sections[sections.length - 1].body.push(line);
  }
  return sections.map((s) => ({ ...s, body: s.body.join("\n").trim() }));
}

export const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
export const isChangelogSource = (s) => s.includes("@");

/** Headings of `pkg` matched by a `pkg@spec` source: exact heading, else every heading starting with `spec `. */
export function matchHeadings(spec, headings) {
  if (headings.includes(spec)) return [spec];
  return headings.filter((h) => h.startsWith(`${spec} `));
}

export function splitSource(source) {
  const at = source.indexOf("@");
  return { package: source.slice(0, at), spec: source.slice(at + 1) };
}

/** Effective class of a capability for one site. */
export const classFor = (cap, site) => cap.downstream?.[site]?.class ?? cap.class;
