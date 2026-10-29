#!/usr/bin/env node
/* verify:ssr — the crawlable-modal contract (docs/CRAWLABLE-MODALS.md) checked
   on server output. Each routable package is loaded through Vite's SSR loader
   and every view of its reference config (FR + EN) is rendered with
   react-dom/static, as a client prerender would. Expected copy comes from the
   config (and, for free-composition content, from rendering that content on
   its own), never from the output under test.

   usage: pnpm verify:ssr [package…]        exit 1 on any failure */

import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "package.json"));
const React = require("react");
const { prerender } = require("react-dom/static");
const h = React.createElement;
const LOCALES = ["fr", "en"];
const DOC = "docs/CRAWLABLE-MODALS.md";

/* ─── Packages ─── */

const noop = () => {};

/* One entry per routable package: the §1 view list and the copy each view
   must carry, both from the reference config (`configs`: several reference
   configs, one per shape a client can choose); `legacy` renders a view through
   the pre-contract API until the package exports its routes. */
const PACKAGES = [
  {
    name: "dossier",
    entry: "/components/dossier/src/index.ts",
    component: "Dossier",
    routes: "dossierRoutes",
    config: (m, locale) => m.buildDossierConfig(locale),
    // Universes (panorama); the menu behind an opening screen (sheet, odd board); the same on a day without specials (panorama, empty item).
    async configs(m, locale) {
      const reference = await vite.ssrLoadModule("/components/dossier/src/dossier.config.tsx");
      return [
        { name: "", config: m.buildDossierConfig(locale) },
        { name: "menu", config: reference.buildDossierMenuConfig(locale) },
        { name: "menu-empty", config: reference.buildDossierMenuConfig(locale, { specials: 0, composition: "panorama" }) },
      ];
    },
    views: (c) => [
      ...(c.opening ? [{ opening: c.opening.id }] : []),
      ...c.items.flatMap((item) => [{ item: item.id }, ...item.entries.map((entry) => ({ item: item.id, entry: entry.id }))]),
    ],
    key: (v) => (v.item === undefined ? v.opening : v.entry ? `${v.item}/${v.entry}` : v.item),
    async copy(c, v, { blocks }) {
      if (v.item === undefined) return c.items.flatMap((i) => [i.label, i.kicker]);
      const item = c.items.find((i) => i.id === v.item);
      if (!item) return [];
      if (!v.entry && !item.entries.length) {
        const empty = item.empty ?? c.copy.empty ?? {};
        return [item.label, empty.title, empty.body];
      }
      if (!v.entry) return [item.label, ...item.entries.flatMap((e) => [e.title, e.kicker])];
      const index = item.entries.findIndex((e) => e.id === v.entry);
      const entry = item.entries[index];
      if (!entry) return [];
      // Free composition: the entry's own content, rendered alone, is what the view must carry.
      const content = entry.content({ item, entry, index, total: item.entries.length, close: noop, toOverview: noop });
      const own = await blocks(content);
      return [entry.title, ...own];
    },
    // Row thumbnails (`ChapterRow.media`) the entry's own content carries; the reference menu's sections must have some.
    async rowMedia(c, v, { html }) {
      if (!v.entry) return null;
      const item = c.items.find((i) => i.id === v.item);
      const index = item ? item.entries.findIndex((e) => e.id === v.entry) : -1;
      if (index < 0) return null;
      const entry = item.entries[index];
      const own = await html(entry.content({ item, entry, index, total: item.entries.length, close: noop, toOverview: noop }));
      return { expected: (own.match(/class="evd-rows__media"/g) ?? []).length, required: Boolean(c.opening) && item.id === "menu" };
    },
    legacy: (m, c, v) => h(m.Dossier, { config: c, open: true, onClose: noop, initialItemId: v.item, initialEntryId: v.entry, preload: false }),
  },
  {
    name: "process-sequence",
    entry: "/components/process-sequence/src/index.ts",
    component: "ProcessSequence",
    routes: "processSequenceRoutes",
    config: (m, locale) => m.buildProcessSequenceConfig(locale),
    views: (c) => c.steps.filter((s) => s.detail).map((s) => ({ step: s.id })),
    key: (v) => v.step,
    async copy(c, v) {
      const index = c.steps.findIndex((s) => s.id === v.step);
      const step = c.steps[index];
      if (!step?.detail) return [];
      const { heading, intro, items, objective } = step.detail;
      const last = index === c.steps.length - 1;
      return [...c.steps.map((s) => s.title), ...heading, intro, ...items, objective, last ? c.cta?.label : undefined];
    },
    legacy: (m, c, v) =>
      h(m.StepDossier, {
        steps: c.steps,
        index: Math.max(0, c.steps.findIndex((s) => s.id === v.step)),
        onIndexChange: noop,
        onClose: noop,
        copy: c.copy,
        cta: c.cta,
        attribution: c.attribution,
      }),
  },
];

/* ─── HTML reading ─── */

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const SKIP = new Set(["script", "style", "template", "noscript", "svg"]);
const BLOCKS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "dt", "dd", "figcaption", "blockquote", "td", "th"]);

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&amp;/g, "&");
const norm = (s) => String(s).replace(/[\u00a0\u202f\u2009\u200b]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const tight = (s) => norm(s).replace(/\s/g, "");

function attributes(tag) {
  const attrs = {};
  const body = tag.replace(/^<[a-zA-Z][\w-]*/, "").replace(/\/?>$/, "");
  for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return attrs;
}

function hiddenBy(name, attrs) {
  if (SKIP.has(name)) return "skip";
  if (attrs["aria-hidden"] === "true") return "aria-hidden";
  if ("hidden" in attrs) return "hidden";
  if ("inert" in attrs) return "inert";
  const style = (attrs.style ?? "").replace(/\s+/g, "").toLowerCase();
  if (/(^|;)display:none/.test(style)) return "display:none";
  if (/(^|;)visibility:hidden/.test(style)) return "visibility:hidden";
  if (/(^|;)opacity:0(\.0*)?(;|$)/.test(style)) return "opacity:0";
  return null;
}

/** Tags with their attributes, visible / all text, and text blocks (h1–h6, p, li…). */
function read(html) {
  const tags = [];
  const blocks = [];
  const stack = [];
  let visible = "";
  let all = "";
  for (const token of html.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? []) {
    if (token.startsWith("<!--")) continue;
    if (token.startsWith("</")) {
      const name = token.slice(2, -1).trim().toLowerCase();
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at < 0) continue;
      for (const closed of stack.splice(at).reverse()) {
        if (BLOCKS.has(closed.name)) blocks.push({ type: closed.name, text: closed.text.replace(/\s+/g, " ").trim(), hidden: closed.hiddenWithin });
      }
      visible += " ";
      all += " ";
      continue;
    }
    if (token.startsWith("<")) {
      const name = token.match(/^<([a-zA-Z][\w-]*)/)[1].toLowerCase();
      const attrs = attributes(token);
      const reason = hiddenBy(name, attrs);
      const hiddenWithin = reason ?? stack.findLast((e) => e.hiddenWithin)?.hiddenWithin ?? null;
      tags.push({ name, attrs, hidden: hiddenWithin });
      visible += " ";
      all += " ";
      if (!VOID.has(name) && !token.endsWith("/>")) stack.push({ name, text: "", hiddenWithin });
      continue;
    }
    const text = decode(token);
    all += text;
    if (!stack.some((e) => e.hiddenWithin)) visible += text;
    for (const e of stack) e.text += text;
  }
  return { tags, blocks, visible, all };
}

/* ─── Rendering ─── */

let vite;
async function render(node) {
  const { prelude } = await prerender(node, { progressiveChunkSize: Number.MAX_SAFE_INTEGER });
  return new Response(prelude).text();
}

/** Renders with React's console output captured (warnings are reported, not failed). */
async function renderCaptured(node) {
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.map(String).join(" ").split("\n")[0].replace(/%s/g, "…").slice(0, 160));
  try {
    return { html: await render(node), logged, error: null };
  } catch (error) {
    if (error instanceof Error) vite.ssrFixStacktrace(error);
    return { html: "", logged, error };
  } finally {
    console.error = original;
  }
}

function where(error) {
  const frame = String(error?.stack ?? "")
    .split("\n")
    .find((line) => line.includes("/components/"));
  return frame ? ` (${frame.trim().replace(/^at\s+/, "").replace(root + "/", "")})` : "";
}

async function textBlocks(node) {
  const { html, error } = await renderCaptured(node);
  if (error) return [];
  return read(html)
    .blocks.filter((b) => !b.hidden && b.type !== "h1" && b.text.length > 1)
    .map((b) => b.text);
}

/* ─── Reporting ─── */

const failures = [];
const warnings = [];
let checks = 0;
/** `message` groups failures across views; `detail` is the per-view specific (the first one is printed). */
function check(ok, pkg, rule, subject, message, detail = "") {
  checks += 1;
  if (!ok) failures.push({ pkg, rule, subject, message, detail });
  return ok;
}
const warn = (pkg, rule, subject, message, detail = "") => warnings.push({ pkg, rule, subject, message, detail });

function report(list, mark) {
  const byPkg = new Map();
  for (const f of list) {
    if (!byPkg.has(f.pkg)) byPkg.set(f.pkg, new Map());
    const groups = byPkg.get(f.pkg);
    const id = `${f.rule}\u0000${f.message}`;
    if (!groups.has(id)) groups.set(id, { rule: f.rule, message: f.message, subjects: [], example: null });
    const g = groups.get(id);
    g.subjects.push(f.subject);
    if (f.detail && !g.example) g.example = `${f.subject ? `${f.subject}: ` : ""}${f.detail}`;
  }
  for (const [pkg, groups] of byPkg) {
    console.log(`\n  ${pkg}`);
    for (const g of groups.values()) {
      const subjects = [...new Set(g.subjects.filter(Boolean))];
      const shown = subjects.slice(0, 8).join(", ") + (subjects.length > 8 ? `, … +${subjects.length - 8}` : "");
      console.log(`   ${mark} [${g.rule}] ${g.message}`);
      if (g.example) console.log(`       e.g. ${g.example}`);
      if (shown && subjects.length > 1) console.log(`       in ${subjects.length}: ${shown}`);
      else if (shown && !g.example) console.log(`       ${shown}`);
    }
  }
}

/* ─── Foundation on the server ─── */

async function verifyFoundation() {
  const pkg = "foundation";
  let f;
  try {
    f = await vite.ssrLoadModule("/components/foundation/src/index.ts");
  } catch (error) {
    check(false, pkg, "load", "", `index.ts failed to load on the server: ${error.message}`);
    return null;
  }
  function Probe() {
    const ref = React.useRef(null);
    const hydrated = f.useHydrated();
    const desktop = f.useMediaQuery("(min-width: 1024px)", true);
    const phone = f.useMediaQuery("(max-width: 767px)");
    const gate = f.useMediaReady(true, ["/probe.webp", "/probe.mp4"]);
    const element = f.useMediaReady(true, ["/probe-still.webp"], { element: { video: null, src: "/probe-loop.mp4", buffer: "full" } });
    const pause = f.useInViewPause(ref);
    const suspended = f.useBackgroundSuspended();
    const deferred = f.useBackgroundSuspendedDeferred();
    const clock = f.useSequenceClock("k", pause.active, 1000, noop);
    f.useSuspendBackground(true);
    return h(
      "div",
      {
        ref,
        "data-probe": [hydrated, desktop, phone, gate.ready, gate.slow, pause.active, suspended, clock.running].map(Number).join(""),
        "data-element": [element.ready, element.slow, element.failed, element.wasSlow, element.src !== undefined, element.total === 2, deferred].map(Number).join(""),
      },
      h("video", { "data-gated": "", src: element.src }),
      h(f.HeldCopy, { live: gate.ready }, h(HeldVideo), h("p", null, "held copy")),
      h(f.RouteLink, { href: "/x/a/", onFollow: noop }, "link"),
      h(f.RouteLink, { onFollow: noop }, "button"),
      h(f.OrbFill, { on: true }, "1"),
      h(f.TextFill, { ink: "#fff" }, "text"),
      h("button", { type: "button", style: { position: "relative" } }, "plate", h(f.SurfaceFill, { hoverWithin: "button" }, "plate")),
      h(f.StepGauge, { current: 2, total: 4, srLabel: "2 / 4" }),
      h(f.EvoviewMark, { label: "Evoview" }),
      h("i", { "data-ink": f.inkFor("#818cf8") + f.inkFor("rgb(20 20 20)") + f.inkFor("hsl(60 100% 50%)") }),
    );
  }
  function HeldVideo() {
    return h("video", { src: f.useHeldSrc("/probe.mp4"), poster: "/probe.webp" });
  }
  const first = await renderCaptured(h(Probe));
  if (!check(!first.error, pkg, "render", "probe", `hooks / primitives threw on the server: ${first.error?.message}${where(first.error)}`)) return f;
  const second = await renderCaptured(h(Probe));
  check(first.html === second.html, pkg, "determinism", "probe", "two server renders differ");
  const probe = first.html.match(/data-probe="(\d+)"/)?.[1];
  // hydrated, desktop(serverValue true), phone(false), ready, slow, active, suspended, running
  check(probe === "01000000", pkg, "server-snapshot", "probe", `server values ${probe} ≠ 01000000 (hydrated, desktop, phone, ready, slow, inView, suspended, clock)`);
  const element = first.html.match(/data-element="(\d+)"/)?.[1];
  // ready, slow, failed, wasSlow, src, total(2), deferred suspension
  check(element === "0000010", pkg, "server-snapshot", "element gate", `server values ${element} ≠ 0000010 (ready, slow, failed, wasSlow, src, total 2, deferred suspended)`);
  const { tags } = read(first.html);
  check(tags.some((t) => t.name === "video" && "data-gated" in t.attrs && !("src" in t.attrs)), pkg, "held", "element gate", "a full-buffer player must render no src on the server");
  check(tags.some((t) => t.name === "div" && "data-ev-held" in t.attrs), pkg, "held", "HeldCopy", "server HTML must carry the held copy (data-ev-held)");
  check(tags.some((t) => t.name === "video" && !("src" in t.attrs) && t.attrs.poster), pkg, "held", "useHeldSrc", "held video must render a poster and no src");
  check(tags.some((t) => t.name === "a" && t.attrs.href === "/x/a/") && tags.some((t) => t.name === "button" && t.attrs.type === "button"), pkg, "links", "RouteLink", "RouteLink must render <a href> with an href, <button> without");
  check(first.html.includes('data-ink="#101011#fafafa#101011"'), pkg, "inkFor", "inkFor", `server inks ${first.html.match(/data-ink="([^"]*)"/)?.[1]} ≠ #101011 #fafafa #101011`);
  const hrefs = f.routeHrefs("/carte/", (v) => v.k);
  check(hrefs(null) === "/carte/" && hrefs({ k: "a/b" }) === "/carte/a/b/", pkg, "hrefs", "routeHrefs", "routeHrefs scheme broken");
  const parse = { parse: (_c, k) => (k === "a/b" ? { k } : null) };
  check(f.viewFromPath("/carte/a/b/", "/carte/", parse, null)?.k === "a/b" && f.viewFromPath("/carte", "/carte/", parse, null) === null && f.viewFromPath("/menu/", "/carte/", parse, null) === undefined, pkg, "hrefs", "viewFromPath", "viewFromPath inverse broken");
  return f;
}

/* ─── A routable package ─── */

async function verifyPackage(spec, foundation) {
  const pkg = spec.name;
  let m;
  try {
    m = await vite.ssrLoadModule(spec.entry);
  } catch (error) {
    check(false, pkg, "load", "", `${spec.entry} failed to load on the server: ${error.message}${where(error)}`);
    return;
  }
  const routes = m[spec.routes];
  const hasRoutes = routes && ["views", "parent", "key", "parse", "head"].every((fn) => typeof routes[fn] === "function");
  check(hasRoutes, pkg, "api", "", `index.ts must export \`${spec.routes}: ModalRoutes\` (views, parent, key, parse, head) — ${DOC} §2. Probing the current API instead (no URLs, links or head checked).`);
  check(typeof m[spec.component] === "function", pkg, "api", "", `index.ts must export the \`${spec.component}\` component`);

  // One run per locale and reference config; `locale` labels the run's subjects ("fr", "fr:menu").
  const runs = [];
  for (const lang of LOCALES) {
    try {
      const list = spec.configs ? await spec.configs(m, lang) : [{ name: "", config: spec.config(m, lang) }];
      for (const { name, config } of list) runs.push({ locale: name ? `${lang}:${name}` : lang, config });
    } catch (error) {
      check(false, pkg, "config", lang, `reference config failed to build: ${error.message}`);
    }
  }
  for (const { locale, config } of runs) {
    const expected = spec.views(config);
    const ctx = { blocks: textBlocks, html: async (node) => (await renderCaptured(node)).html ?? "" };
    if (!hasRoutes) {
      for (const view of expected) await verifyView({ pkg, spec, m, config, view, locale, key: spec.key(view), element: spec.legacy(m, config, view), ctx });
      continue;
    }

    /* Routes: coverage, keys, parents, head. */
    let views = [];
    try {
      views = routes.views(config);
    } catch (error) {
      check(false, pkg, "views", locale, `views(config) threw: ${error.message}`);
      continue;
    }
    const key = (v) => routes.key(v);
    const keys = views.map(key);
    const wanted = expected.map(spec.key);
    const missing = wanted.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !wanted.includes(k));
    check(!missing.length && !extra.length, pkg, "views", locale, "views(config) must list every view of §1, no other", `${missing.length ? `missing ${missing.join(", ")}` : ""}${missing.length && extra.length ? "; " : ""}${extra.length ? `unexpected ${extra.join(", ")}` : ""}`);
    check(new Set(keys).size === keys.length, pkg, "views", locale, "keys are not unique");
    const byKey = new Map(views.map((v) => [key(v), v]));
    const parentKey = (v) => {
      const p = routes.parent(v);
      return p ? key(p) : null;
    };
    const level = (v) => {
      let n = 0;
      for (let node = v; node && n < 16; node = routes.parent(node)) n += 1;
      return n;
    };
    for (const v of views) {
      const k = key(v);
      const subject = `${locale} ${k}`;
      check(/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/i.test(k), pkg, "key", subject, "key must be URL-safe ids joined by /");
      let parsed = null;
      try {
        parsed = routes.parse(config, k);
      } catch (error) {
        check(false, pkg, "key", subject, `parse threw: ${error.message}`);
      }
      check(parsed && key(parsed) === k, pkg, "key", subject, "parse(config, key(view)) must return the view");
      check(routes.parse(config, `${k}/__nope`) === null, pkg, "key", subject, "parse must return null for an unknown key");
      check(JSON.stringify(v) !== undefined && JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v), pkg, "views", subject, "a view must be JSON-serialisable (history state)");
      const pk = parentKey(v);
      check(pk === null || byKey.has(pk), pkg, "views", subject, "parent(view) is not one of views(config)", pk);
      let head = null;
      try {
        head = routes.head(config, v);
      } catch (error) {
        check(false, pkg, "head", subject, `head threw: ${error.message}`);
      }
      if (head) {
        check(typeof head.title === "string" && head.title.trim().length > 0, pkg, "head", subject, "head.title is empty");
        check(typeof head.description === "string" && head.description.trim().length > 0 && head.description.length <= 160, pkg, "head", subject, "head.description must be 1–160 characters — §6", `${head.description?.length ?? 0} characters`);
        check(Array.isArray(head.breadcrumb) && head.breadcrumb.length === level(v) && head.breadcrumb.every((s) => typeof s === "string" && s.trim()), pkg, "head", subject, "head.breadcrumb must name each level, top-level view first — §6", `expected ${level(v)}, got ${JSON.stringify(head.breadcrumb)}`);
        if (head.image !== undefined) check(typeof head.image?.src === "string" && head.image.src && typeof head.image.alt === "string", pkg, "head", subject, "head.image needs src and alt");
      }
    }

    /* Renders. */
    const base = `/${locale.replace(":", "/")}/${pkg}/`;
    const hrefFor = foundation ? foundation.routeHrefs(base, key) : (v) => (v ? `${base}${key(v)}/` : base);
    const make = (view) => h(m[spec.component], { config, view, onNavigate: noop, hrefFor });
    const linked = new Set();

    const closed = await renderCaptured(make(null));
    if (check(!closed.error, pkg, "closed", locale, `render with view=null threw: ${closed.error?.message}${where(closed.error)}`)) {
      const r = read(closed.html);
      check(!r.tags.some((t) => "data-ev-route-layer" in t.attrs), pkg, "closed", locale, "view=null must render no modal (data-ev-route-layer found)");
      check(!r.tags.some((t) => t.name === "h1"), pkg, "closed", locale, "view=null must render no h1");
      if (closed.html.trim()) {
        const hrefs = new Set(r.tags.filter((t) => t.name === "a").map((t) => t.attrs.href));
        for (const v of views.filter((v) => !routes.parent(v))) {
          if (check(hrefs.has(hrefFor(v)), pkg, "links", `${locale} (closed)`, "the closed render (a page section) must link every top-level view — §4", `no <a href="${hrefFor(v)}">`)) linked.add(key(v));
        }
      }
    }

    for (const view of views) {
      const k = key(view);
      const p = routes.parent(view);
      const siblings = views.filter((o) => parentKey(o) === parentKey(view));
      const at = siblings.findIndex((o) => key(o) === k);
      const neighbours = [p, ...views.filter((o) => parentKey(o) === k), siblings[at - 1], siblings[at + 1]].filter(Boolean);
      let head = null;
      try {
        head = routes.head(config, view);
      } catch {
        /* reported above */
      }
      const found = await verifyView({ pkg, spec, m, config, view, locale, key: k, element: make(view), ctx, head, neighbours: neighbours.map((n) => ({ key: key(n), href: hrefFor(n) })) });
      for (const href of found) {
        const target = views.find((v) => hrefFor(v) === href);
        if (target && key(target) !== k) linked.add(key(target));
      }
    }
    for (const v of views) {
      if (routes.parent(v) && !linked.has(key(v))) check(false, pkg, "links", `${locale} ${key(v)}`, "no rendered view links to this view: unreachable for crawlers");
    }
  }
}

async function verifyView({ pkg, spec, config, view, locale, key, element, ctx, head = null, neighbours = null }) {
  const subject = `${locale} ${key}`;
  const first = await renderCaptured(element);
  for (const line of new Set(first.logged)) warn(pkg, "react", subject, line);
  if (!check(!first.error, pkg, "render", subject, `render threw: ${first.error?.message} — ${DOC} §3.1`, where(first.error).slice(2, -1))) return [];
  const second = await renderCaptured(element);
  if (!second.error && first.html !== second.html) {
    let at = 0;
    while (first.html[at] === second.html[at]) at += 1;
    check(false, pkg, "determinism", subject, "two renders differ (random / time / environment read in render) — §3.1", `…${first.html.slice(Math.max(0, at - 40), at + 40)}…`);
  } else checks += 1;

  const r = read(first.html);
  const layers = r.tags.filter((t) => "data-ev-route-layer" in t.attrs).length;
  check(layers === 1, pkg, "layer", subject, `the modal root must carry data-ev-route-layer once (found ${layers}) — §3.6`);
  const h1s = r.blocks.filter((b) => b.type === "h1");
  check(h1s.length === 1, pkg, "h1", subject, `exactly one h1 per view (found ${h1s.length}) — §4`, h1s.map((b) => `"${b.text}"`).join(", "));
  if (h1s.length === 1 && head?.title) check(norm(head.title).includes(norm(h1s[0].text)), pkg, "h1", subject, "the h1 text must be contained in head.title — §4", `h1 "${h1s[0].text}", title "${head.title}"`);
  if (h1s.length === 1) check(!h1s[0].hidden, pkg, "h1", subject, `the h1 is hidden by markup — §3.3`, h1s[0].hidden);
  const inert = r.tags.filter((t) => "inert" in t.attrs);
  check(!inert.length, pkg, "inert", subject, "server HTML carries inert — §3.3", `${inert.length}× on ${[...new Set(inert.map((t) => t.attrs.class?.split(" ")[0] || t.name))].join(", ")}`);

  // Copy: present and not hidden.
  let wanted = [];
  try {
    wanted = (await spec.copy(config, view, ctx)).filter((s) => typeof s === "string" && s.trim());
  } catch (error) {
    warn(pkg, "copy", subject, `could not compute the expected copy: ${error.message}`);
  }
  const visible = norm(r.visible);
  const visibleTight = tight(r.visible);
  const all = norm(r.all);
  const missing = [];
  const hidden = [];
  for (const s of new Set(wanted)) {
    if (visible.includes(norm(s)) || visibleTight.includes(tight(s))) continue;
    (all.includes(norm(s)) || tight(r.all).includes(tight(s)) ? hidden : missing).push(s);
  }
  const quote = (list) => list.slice(0, 3).map((s) => `"${s.length > 60 ? `${s.slice(0, 57)}…` : s}"`).join(", ") + (list.length > 3 ? ` (+${list.length - 3} more)` : "");
  check(
    !missing.length,
    pkg,
    "copy",
    subject,
    missing.length === wanted.length ? "none of the view's copy is in server HTML (copy must not wait for the media gate) — §3.4" : "part of the view's copy is missing from server HTML — §3.4",
    `${missing.length}/${wanted.length} missing: ${quote(missing)}`,
  );
  if (hidden.length) {
    const reasons = [...new Set(r.tags.filter((t) => t.hidden && t.hidden !== "skip").map((t) => t.hidden))].join(" / ");
    check(false, pkg, "copy", subject, `copy present but hidden by markup (${reasons || "aria-hidden / hidden / inline style"}) — §3.3, §3.6`, `${hidden.length}/${wanted.length}: ${quote(hidden)}`);
  } else checks += 1;

  // Links.
  const hrefs = r.tags.filter((t) => t.name === "a" && t.attrs.href).map((t) => t.attrs.href);
  if (neighbours) {
    const absent = neighbours.filter((n) => !hrefs.includes(n.href));
    check(!absent.length, pkg, "links", subject, "navigation must be real links: parent, children and prev / next sibling each need an <a href> — §4", `no link to ${absent.map((n) => `${n.key} (${n.href})`).join(", ")}`);
  }

  // Media.
  const imgs = r.tags.filter((t) => t.name === "img");
  const badImg = imgs.filter((t) => !t.attrs.src || !("alt" in t.attrs));
  check(!badImg.length, pkg, "img", subject, "<img> needs a static src and an alt — §4", `${badImg.length}/${imgs.length}: ${badImg.slice(0, 2).map((t) => t.attrs.src || "no src").join(", ")}`);
  const videos = r.tags.filter((t) => t.name === "video");
  const sourced = videos.filter((t) => t.attrs.src).length + r.tags.filter((t) => t.name === "source" && t.attrs.src).length;
  check(!sourced, pkg, "video", subject, "server HTML sets a video source: withhold it until live (useHeldSrc) — §3.5", `${sourced} source(s)`);
  const noPoster = videos.filter((t) => !t.attrs.poster).length;
  if (noPoster) warn(pkg, "video", subject, "<video> without poster", `${noPoster}×`);

  // Row thumbnails: an <img> right inside each `.evd-rows__media`, lazy and async, never holding the media gate.
  const thumbs = [];
  r.tags.forEach((t, i) => {
    if (t.name === "span" && /(^|\s)evd-rows__media(\s|$)/.test(t.attrs.class ?? "")) thumbs.push(r.tags[i + 1]);
  });
  if (thumbs.length) {
    const bad = thumbs.filter((t) => t?.name !== "img" || !t.attrs.src || !("alt" in t.attrs) || t.attrs.loading !== "lazy" || t.attrs.decoding !== "async");
    check(!bad.length, pkg, "rows", subject, "a row thumbnail must be an <img> with src, alt, loading=lazy, decoding=async", `${bad.length}/${thumbs.length}`);
  }
  if (spec.rowMedia) {
    const rows = await spec.rowMedia(config, view, ctx);
    if (rows) {
      check(thumbs.length === rows.expected, pkg, "rows", subject, "the view's server HTML must carry every row thumbnail of its content", `expected ${rows.expected}, found ${thumbs.length}`);
      if (rows.required) check(rows.expected > 0, pkg, "rows", subject, "the reference menu's sections must show rows with media (coverage)");
    }
  }
  return hrefs;
}

/* ─── Run ─── */

const only = process.argv.slice(2);
vite = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  esbuild: { jsx: "automatic" },
});

console.log(`verify:ssr — crawlable modal contract (${DOC})`);
try {
  const foundation = await verifyFoundation();
  for (const spec of PACKAGES) {
    if (only.length && !only.includes(spec.name)) continue;
    await verifyPackage(spec, foundation);
  }
} finally {
  await vite.close();
}

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  report(warnings, "·");
}
if (failures.length) {
  console.log(`\nFailures:`);
  report(failures, "✗");
  console.log(`\nverify:ssr FAILED — ${failures.length} failing checks of ${checks}.`);
  process.exitCode = 1;
} else {
  console.log(`\nverify:ssr passed — ${checks} checks.`);
}
