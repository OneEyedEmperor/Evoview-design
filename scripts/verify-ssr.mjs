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
    // Universes (panorama); the menu behind an opening screen (sheet, odd board); the same on a day without specials (panorama, empty item);
    // a live feed (the journal, four pages of build-time data: page views, their entries).
    async configs(m, locale) {
      const reference = await vite.ssrLoadModule("/components/dossier/src/dossier.config.tsx");
      const journal = await vite.ssrLoadModule("/src/pages/library/dossier/journal.ts");
      const feed = m.dossierFeed(journal.journalSnapshot([1, 2, 3, 4]), (r) => journal.journalEntry(r, locale), { pageSize: journal.JOURNAL_PAGE_SIZE });
      return [
        { name: "", config: m.buildDossierConfig(locale) },
        { name: "menu", config: reference.buildDossierMenuConfig(locale) },
        { name: "menu-empty", config: reference.buildDossierMenuConfig(locale, { specials: 0, composition: "panorama" }) },
        { name: "feed", config: reference.buildDossierFeedConfig(locale, feed) },
      ];
    },
    // A feed: overview (page 1) and its entries, then per page from 2 its view and entries (README "Feed").
    views: (c) => [
      ...(c.opening ? [{ opening: c.opening.id }] : []),
      ...c.items.flatMap((item) =>
        item.feed
          ? [
              { item: item.id },
              ...item.feed.pages.flatMap((p) => [...(p.page >= 2 ? [{ item: item.id, page: p.page }] : []), ...p.ids.map((id) => ({ item: item.id, entry: id, ...(p.page >= 2 ? { page: p.page } : {}) }))]),
            ]
          : [{ item: item.id }, ...item.entries.map((entry) => ({ item: item.id, entry: entry.id }))],
      ),
    ],
    key: (v) => (v.item === undefined ? v.opening : v.entry ? `${v.item}/${v.entry}` : v.page >= 2 ? `${v.item}/page/${v.page}` : v.item),
    /* Siblings are of one kind (entries, pages, overviews); a paginated level links its first page only, each page its
       neighbours (the chain reaches every page). */
    group: (v) => (v.entry ? "entry" : v.page >= 2 ? "page" : "view"),
    chained: ["page"],
    async copy(c, v, { blocks }) {
      if (v.item === undefined) return c.items.flatMap((i) => [i.label, i.kicker]);
      const item = c.items.find((i) => i.id === v.item);
      if (!item) return [];
      if (item.feed && !v.entry) {
        const ids = item.feed.pages.find((p) => p.page === (v.page ?? 1))?.ids ?? [];
        return [item.label, ...ids.flatMap((id) => [item.entries.find((e) => e.id === id)?.title, item.entries.find((e) => e.id === id)?.kicker])];
      }
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
    /* Head preloads (`dossierViewImages`, `dossierViewMedia`) on a copy of the config whose images carry a `srcSet`:
       every srcset image carries its `sizes` (never 100vw by omission); a detail lists its `sources` when it has
       them, else its media at the tile's `sizes` (the overview's), never the unshown tile at 100vw. */
    viewImages(m, c) {
      const set = (md) => (md && !/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(md.src) ? { ...md, srcSet: `${md.src}?w=640 640w, ${md.src} 1200w` } : md);
      const cfg = {
        ...c,
        items: c.items.map((item) => ({
          ...item,
          cover: item.cover && set(item.cover),
          entries: item.entries.map((e, i) => ({
            ...e,
            media: set(e.media),
            ...(i === 0 ? { sources: [{ src: `${e.media.src}?hero`, srcSet: `${e.media.src}?hero 1200w`, sizes: "80vw" }] } : {}),
          })),
        })),
      };
      const out = [];
      for (const v of m.dossierRoutes.views(cfg)) {
        const k = m.dossierRoutes.key(v);
        const images = m.dossierViewImages(cfg, v);
        const bare = images.filter((i) => i.srcSet && !i.sizes);
        out.push([!bare.length, "every srcset image of a view preload carries its sizes", k, bare.map((i) => i.src).join(", ")]);
        if (v.entry === undefined) continue;
        const entry = cfg.items.find((i) => i.id === v.item)?.entries.find((e) => e.id === v.entry);
        if (!entry) continue;
        const media = m.dossierViewMedia(cfg, v);
        if (entry.sources?.length) {
          out.push([images.length === 1 && images[0].sizes === "80vw" && media.length === 1 && media[0] === entry.sources[0].src, "a detail with sources preloads its sources only (not the unshown tile media)", k, JSON.stringify(images)]);
        } else {
          const tile = m.dossierViewImages(cfg, { ...v, entry: undefined }).find((i) => i.src === entry.media.src);
          out.push([images.length === 1 && !!tile && images[0].sizes === tile.sizes, "a detail without sources preloads its media at the tile's sizes", k, `${images[0]?.sizes} vs tile ${tile?.sizes}`]);
        }
      }
      return out;
    },
    /* §4 on details: the h1 is the entry's `title` (never its short `label`), the dialog is labelled by it, and no
       other heading repeats it (no hidden duplicate). With `heading: "content"` the content renders that h1 and the
       header bar has none: checked on every entry of a copy of the config whose content leads with it. */
    heading: {
      expect(c, v, r) {
        if (v.entry === undefined) return [];
        const entry = c.items.find((i) => i.id === v.item)?.entries.find((e) => e.id === v.entry);
        if (!entry) return [];
        const h1 = r.blocks.find((b) => b.type === "h1");
        const same = r.blocks.filter((b) => /^h[1-6]$/.test(b.type) && norm(b.text) === norm(entry.title));
        const dialog = r.tags.find((t) => t.attrs.role === "dialog");
        const first = (dialog?.attrs["aria-labelledby"] ?? "").split(/\s+/)[0];
        const named = r.tags.find((t) => first && t.attrs.id === first);
        const headerH1 = r.tags.some((t) => t.name === "h1" && /(^|\s)evd-header__title(\s|$)/.test(t.attrs.class ?? ""));
        return [
          [h1 && norm(h1.text) === norm(entry.title), "a detail's h1 is the entry's title, not its short label — §4", `h1 "${h1?.text}", title "${entry.title}"`],
          [same.length === 1, "exactly one heading carries the entry's title (no hidden duplicate) — §4", `${same.length}× ${same.map((b) => b.type).join(", ")}`],
          [named?.name === "h1", "the dialog is labelled by the view's h1 — §4", `aria-labelledby → ${named?.name ?? "nothing"}`],
          [headerH1 === (entry.heading !== "content"), entry.heading === "content" ? "heading: content — the header bar carries no h1" : "the header bar carries the h1"],
        ];
      },
      content: (m, c) => ({
        ...c,
        items: c.items.map((item) => ({
          ...item,
          // Entries that already render their h1 (a feed's `feedEntry` default) are checked as they are.
          entries: item.entries.map((e) => e.heading === "content" ? e : ({
            ...e,
            heading: "content",
            content: (ctx) => h(React.Fragment, null, h(m.ChapterHead, { level: "title", as: "h1", id: ctx.headingId, title: e.title }), e.content(ctx)),
          })),
        })),
      }),
    },
    /* Header kicker (RULES §1): optional on the opening / overviews, a node only when it has text (an empty one
       off-centres the title); never on a detail, whose item stays in the dialog's accessible name. */
    headerKicker: {
      selector: /(^|\s)evd-header__kicker(\s|$)/,
      set: (c, kicker) => ({ ...c, kicker }),
      itemOf: (c, v) => c.items.find((i) => i.id === v.item)?.label,
    },
    /* `directLoad: "at-rest"`: a direct load's server HTML is the settled view (README, Variations). Every view again
       with the option, then what makes it at rest; a pending item (live content still loading) keeps the held path. */
    atRest: {
      config: (c) => ({ ...c, directLoad: "at-rest" }),
      expect(r) {
        const root = r.tags.find((t) => "data-ev-route-layer" in t.attrs);
        const viewEl = r.tags.find((t) => /(^|\s)evd-(overview|detail)(\s|$)/.test(t.attrs.class ?? ""));
        const flagged = (name) => r.tags.filter((t) => name in t.attrs).length;
        const tiles = r.tags.filter((t) => /(^|\s)evd-tile(\s|$)/.test(t.attrs.class ?? ""));
        return [
          [root && "data-rest" in root.attrs, "the modal root carries data-rest (chrome lands settled)"],
          [root && "data-rest-lock" in root.attrs, "the server HTML carries data-rest-lock (page locked from first paint, until hydration)"],
          [viewEl && "data-rest" in viewEl.attrs, "the view's element carries data-rest (its entrances run in zero time)"],
          [!flagged("data-ev-held"), "no held copy (data-ev-held): the view is live in server HTML, hydration keeps it", `${flagged("data-ev-held")}×`],
          [!flagged("data-waiting") && !flagged("data-locked") && !flagged("data-pending"), "no waiting / locked / pending markup"],
          [!tiles.some((t) => "disabled" in t.attrs || t.attrs["aria-disabled"] === "true"), "board tiles are enabled (the view is interactive once hydrated)"],
        ];
      },
      // A feed waits on its page instead: one not brought yet (no build-time data for it).
      pending: (c, m) => {
        const at = c.items.findIndex(Boolean);
        const wait = (item) => (item.feed ? { ...item, feed: m.dossierFeed({ pages: [] }, () => null), entries: [] } : { ...item, pending: true, entries: [] });
        return at < 0 ? null : { config: { ...c, items: c.items.map((item, i) => (i === at ? wait(item) : item)) }, view: { item: c.items[at].id, ...(c.opening ? { opening: c.opening.id } : {}) } };
      },
    },
    /* Feed board server HTML (README "Feed"): the view's page only, real links to the newer / older page, the first
       batch eager, no client-only state (placeholders, held tiles, error); an entry not brought yet keeps the held path. */
    async feed({ config, locale, views, make, hrefFor, routes, check, read, renderCaptured }) {
      const item = config.items.find((i) => i.feed);
      if (!item) return;
      for (const p of item.feed.pages) {
        const view = p.page >= 2 ? { item: item.id, page: p.page } : { item: item.id };
        const subject = `${locale} ${routes.key(view)}`;
        const out = await renderCaptured(make(view));
        if (!check(!out.error, "feed", subject, `render threw: ${out.error?.message}`)) continue;
        const r = read(out.html);
        const hrefs = new Set(r.tags.filter((t) => t.name === "a").map((t) => t.attrs.href));
        const board = r.tags.find((t) => t.attrs["data-layout"] === "feed");
        const tiles = r.tags.filter((t) => t.name === "a" && /(^|\s)evd-tile(\s|$)/.test(t.attrs.class ?? ""));
        check(!!board, "feed", subject, "the overview carries the feed board (data-layout=feed)");
        check(tiles.length === p.ids.length && p.ids.every((id) => hrefs.has(hrefFor({ item: item.id, entry: id, ...(p.page >= 2 ? { page: p.page } : {}) }))), "feed", subject, "the page view renders its own page's tiles, each a link to its entry", `${tiles.length} tiles, page holds ${p.ids.length}`);
        const imgs = r.tags.filter((t) => t.name === "img" && /(^|\s)evd-tile__media(\s|$)/.test(t.attrs.class ?? ""));
        check(imgs.length === p.ids.length && imgs.every((t) => t.attrs.loading !== "lazy"), "feed", subject, "the view's first batch is eager (no loading=lazy)");
        if (p.next !== null) check(hrefs.has(hrefFor({ item: item.id, page: p.page + 1 })), "feed", subject, "a page with more links the next page's URL (crawlers, no script)", hrefFor({ item: item.id, page: p.page + 1 }));
        else check(r.blocks.some((b) => b.type === "p" && norm(b.text) === norm(config.copy.feed?.end ?? (config.locale === "fr" ? "C'est tout pour le moment." : "That's everything for now."))), "feed", subject, "the last page ends on the end panel");
        if (p.page >= 2) check(hrefs.has(hrefFor(p.page === 2 ? { item: item.id } : { item: item.id, page: p.page - 1 })), "feed", subject, "a page view links the newer page");
        const clientOnly = r.tags.filter((t) => /evd-feed__ghost|evd-feed__fresh/.test(t.attrs.class ?? "") || "data-held" in t.attrs || t.attrs.role === "alert");
        check(!clientOnly.length, "feed", subject, "no client-only feed state in server HTML (placeholders, held tiles, live control, error)", `${clientOnly.length}×`);
        const h1 = r.blocks.find((b) => b.type === "h1")?.text ?? "";
        if (p.page >= 2) check(norm(h1).includes(norm(`page ${p.page}`)), "feed", subject, "a page view's h1 names its page", h1);
      }
      const view = { item: item.id, entry: "not-loaded-yet" };
      const parsed = routes.parse(config, `${item.id}/not-loaded-yet`);
      check(parsed && parsed.entry === "not-loaded-yet", "feed", `${locale} deep link`, "parse accepts an entry key the feed has not brought (fetchEntry)");
      const out = await renderCaptured(make(view, { ...config, directLoad: "at-rest" }));
      if (check(!out.error, "feed", `${locale} deep link`, `render threw: ${out.error?.message}`)) {
        const r = read(out.html);
        const root = r.tags.find((t) => "data-ev-route-layer" in t.attrs);
        check(root && !("data-rest" in root.attrs) && r.tags.some((t) => "data-ev-held" in t.attrs), "feed", `${locale} deep link`, "an entry not brought yet keeps the held, gated path (never at rest)");
      }
      check(routes.parse(config, `${item.id}/page/1`) === null, "feed", `${locale} page/1`, "page 1 has the overview's URL only (`<item>/page/1` names nothing)");

      /* `head` answers every view `parse` accepts (contract §2, "Live content"): an entry not brought, a page not
         loaded, a loaded page whose entries all came earlier. */
      const last = item.feed.pages[item.feed.pages.length - 1];
      const dupPage = last.page + 1;
      const dupConfig = {
        ...config,
        items: config.items.map((i) => {
          if (i !== item) return i;
          const feed = { ...i.feed, pages: [...i.feed.pages.map((p) => (p === last ? { ...p, next: String(dupPage) } : p)), { page: dupPage, ids: [], next: null }], pageStatus: (n) => (n === dupPage ? "ready" : i.feed.pageStatus(n)) };
          return { ...i, feed };
        }),
      };
      for (const [label, c, key] of [
        ["unknown entry slug", config, `${item.id}/not-loaded-yet`],
        ["page past the known ones", config, `${item.id}/page/99`],
        ["page of duplicates only", dupConfig, `${item.id}/page/${dupPage}`],
      ]) {
        const view = routes.parse(c, key);
        if (!check(!!view, "feed", `${locale} ${label}`, "parse accepts it", key)) continue;
        let head = null;
        try {
          head = routes.head(c, view);
        } catch (error) {
          check(false, "feed", `${locale} ${label}`, `head throws on a view parse accepts: ${error.message}`);
          continue;
        }
        const level = (() => {
          let n = 0;
          for (let v = view; v && n < 8; v = routes.parent(v)) n += 1;
          return n;
        })();
        check(head.title && head.description && head.breadcrumb.length === level, "feed", `${locale} ${label}`, "head answers with a title, a description and one crumb per level", JSON.stringify(head));
        const out = await renderCaptured(make(view, c));
        if (check(!out.error, "feed", `${locale} ${label}`, `render threw: ${out.error?.message}`)) {
          const h1 = read(out.html).blocks.find((b) => b.type === "h1")?.text ?? "";
          check(norm(head.title).includes(norm(h1)), "feed", `${locale} ${label}`, "the h1 rendered meanwhile is contained in head.title", `h1 "${h1}", title "${head.title}"`);
        }
      }

      /* No numerals on a feed's strip tabs (a deep-linked page-4 entry would read "01"); tile positions continue
         across pages (page n's first tile is (n − 1) × pageSize + 1). */
      const entryView = views.find((v) => v.entry !== undefined && v.item === item.id);
      if (entryView) {
        const out = await renderCaptured(make(entryView));
        if (!out.error) check(!/evd-strip__num/.test(out.html), "feed", `${locale} ${routes.key(entryView)}`, "a feed detail's strip tabs carry no numerals");
      }
      const later = item.feed.pages.find((p) => p.page >= 2 && p.ids.length);
      if (later) {
        const out = await renderCaptured(make({ item: item.id, page: later.page }));
        const first = read(out.html).tags.find((t) => t.name === "a" && /(^|\s)evd-tile(\s|$)/.test(t.attrs.class ?? ""));
        const expected = String((later.page - 1) * item.feed.pageSize + 1);
        check(new RegExp(`\\b${expected}\\b`).test(first?.attrs["aria-label"] ?? ""), "feed", `${locale} page/${later.page}`, "a page view's tiles continue the feed's positions", `"${first?.attrs["aria-label"]}" lacks ${expected}`);
      }
    },
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
      h("section", { "data-rest-probe": "" }, h(f.HeldCopy, { live: false, rest: true }, h(HeldVideo), h("p", null, "rest copy"))),
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
  const restPart = first.html.slice(first.html.indexOf("data-rest-probe"));
  const restTags = read(`<section ${restPart.slice(0, restPart.indexOf("</section>"))}</section>`).tags;
  check(!restTags.some((t) => "data-ev-held" in t.attrs), pkg, "held", "HeldCopy rest", "a copy at rest is never held (no data-ev-held), so hydration keeps it");
  check(restTags.some((t) => t.name === "video" && !("src" in t.attrs) && t.attrs.poster), pkg, "held", "HeldCopy rest", "a copy at rest still withholds video sources until hydration (poster only)");
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
    const make = (view, c = config) => h(m[spec.component], { config: c, view, onNavigate: noop, hrefFor });
    const linked = new Set();

    if (spec.headerKicker) {
      const hk = spec.headerKicker;
      const kickers = (html) => read(html).tags.filter((t) => hk.selector.test(t.attrs.class ?? "")).length;
      const top = views.find((v) => !routes.parent(v));
      for (const [label, value] of [["omitted", undefined], ["empty", ""], ["blank", "  "], ["set", "Kicker probe"]]) {
        const out = await renderCaptured(make(top, hk.set(config, value)));
        if (!check(!out.error, pkg, "kicker", `${locale} ${key(top)} (${label})`, `render threw: ${out.error?.message}`)) continue;
        const n = kickers(out.html);
        check(value?.trim() ? n === 1 : n === 0, pkg, "kicker", `${locale} ${key(top)} (${label})`, value?.trim() ? "a set kicker renders one header kicker" : "no kicker text: no header kicker node (an empty one off-centres the title)", `${n} node(s)`);
      }
      for (const view of views.filter((v) => v.entry !== undefined)) {
        const out = await renderCaptured(make(view, hk.set(config, "Kicker probe")));
        if (out.error) continue;
        const r = read(out.html);
        check(kickers(out.html) === 0, pkg, "kicker", `${locale} ${key(view)}`, "a detail shows no header kicker (RULES §1), not even with config.kicker set");
        const dialog = r.tags.find((t) => t.attrs.role === "dialog");
        const ids = (dialog?.attrs["aria-labelledby"] ?? "").split(/\s+/).filter(Boolean);
        const named = decode(ids.map((id) => out.html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`))?.[1] ?? "").join(" "));
        const label = hk.itemOf(config, view);
        check(!label || norm(named).includes(norm(label)), pkg, "kicker", `${locale} ${key(view)}`, "the detail's item stays in the dialog's accessible name (aria-labelledby)", `name "${named}", item "${label}"`);
      }
    }

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

    const group = spec.group ?? (() => "");
    const chained = new Set(spec.chained ?? []);
    for (const view of views) {
      const k = key(view);
      const p = routes.parent(view);
      const siblings = views.filter((o) => parentKey(o) === parentKey(view) && group(o) === group(view));
      const at = siblings.findIndex((o) => key(o) === k);
      // Children: all of them, except a chained kind (pages), of which only the first.
      const children = views.filter((o) => parentKey(o) === k).filter((o, i, all) => !chained.has(group(o)) || all.findIndex((x) => group(x) === group(o)) === i);
      const neighbours = [p, ...children, siblings[at - 1], siblings[at + 1]].filter(Boolean);
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

    if (spec.viewImages) for (const [ok, message, subject, detail = ""] of spec.viewImages(m, config)) check(ok, pkg, "view-images", `${locale} ${subject}`, message, detail);

    /* Entries whose content renders the view's h1 (`heading: "content"`): the same contract on every detail. */
    if (spec.heading?.content) {
      const contentConfig = spec.heading.content(m, config);
      for (const view of views.filter((v) => v.entry !== undefined)) {
        let head = null;
        try {
          head = routes.head(contentConfig, view);
        } catch {
          /* reported above */
        }
        const element = h(m[spec.component], { config: contentConfig, view, onNavigate: noop, hrefFor });
        await verifyView({ pkg, spec, m, config: contentConfig, view, locale: `${locale}:content-heading`, key: key(view), element, ctx, head });
      }
    }

    if (spec.feed) {
      await spec.feed({ config, locale, views, make, hrefFor, routes, read, renderCaptured, check: (ok, rule, subject, message, detail) => check(ok, pkg, rule, subject, message, detail) });
    }

    /* Direct load at rest: the same contract per view, plus the at-rest markup. */
    if (spec.atRest) {
      const restConfig = spec.atRest.config(config);
      const makeRest = (view, c = restConfig) => h(m[spec.component], { config: c, view, onNavigate: noop, hrefFor });
      for (const view of views) {
        const k = key(view);
        let head = null;
        try {
          head = routes.head(config, view);
        } catch {
          /* reported above */
        }
        await verifyView({ pkg, spec, m, config: restConfig, view, locale: `${locale}:at-rest`, key: k, element: makeRest(view), ctx, head });
        const out = await renderCaptured(makeRest(view));
        if (out.error) continue;
        const r = read(out.html);
        for (const [ok, message, detail = ""] of spec.atRest.expect(r)) check(ok, pkg, "at-rest", `${locale}:at-rest ${k}`, message, detail);
      }
      const pending = spec.atRest.pending(restConfig, m);
      if (pending) {
        const out = await renderCaptured(makeRest(pending.view, pending.config));
        if (check(!out.error, pkg, "at-rest", `${locale}:at-rest pending`, `render threw: ${out.error?.message}`)) {
          const r = read(out.html);
          const root = r.tags.find((t) => "data-ev-route-layer" in t.attrs);
          check(root && !("data-rest" in root.attrs) && r.tags.some((t) => "data-ev-held" in t.attrs), pkg, "at-rest", `${locale}:at-rest pending ${key(pending.view)}`, "a view waiting on live content (pending item) must keep the held, gated path");
        }
      }
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
  if (spec.heading) for (const [ok, message, detail = ""] of spec.heading.expect(config, view, r)) check(ok, pkg, "h1", subject, message, detail);
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
