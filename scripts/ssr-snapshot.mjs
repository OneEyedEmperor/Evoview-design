#!/usr/bin/env node
/* ssr-snapshot — server HTML of a package's reference configs, every view, for an
   additive-change identity check: run it on the baseline tree and on the change,
   then compare the two files (`--diff a.json b.json`).

   usage: node scripts/ssr-snapshot.mjs <tree> <out.json>     render <tree>'s dossier
          node scripts/ssr-snapshot.mjs --diff <a.json> <b.json>   exit 1 on any difference */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const args = process.argv.slice(2);
if (args[0] === "--diff") {
  const [a, b] = [JSON.parse(readFileSync(args[1], "utf8")), JSON.parse(readFileSync(args[2], "utf8"))];
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const differ = keys.filter((k) => a[k] !== b[k]);
  for (const k of differ.slice(0, 10)) {
    const [x, y] = [a[k] ?? "", b[k] ?? ""];
    let at = 0;
    while (x[at] === y[at]) at += 1;
    console.log(`✗ ${k}\n  a: …${x.slice(Math.max(0, at - 60), at + 80)}…\n  b: …${y.slice(Math.max(0, at - 60), at + 80)}…`);
  }
  console.log(`${keys.length} renders compared, ${differ.length} differ${differ.length ? "" : " (byte-identical)"}.`);
  process.exit(differ.length ? 1 : 0);
}

const root = resolve(args[0] ?? ".");
const out = resolve(args[1] ?? "ssr-snapshot.json");
const require = createRequire(resolve(root, "package.json"));
const React = require("react");
const { prerender } = require("react-dom/static");
const { createServer } = await import(require.resolve("vite"));
const h = React.createElement;
const noop = () => {};

const vite = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  esbuild: { jsx: "automatic" },
});

async function html(node) {
  const { prelude } = await prerender(node, { progressiveChunkSize: Number.MAX_SAFE_INTEGER });
  return new Response(prelude).text();
}

const renders = {};
try {
  const m = await vite.ssrLoadModule("/components/dossier/src/index.ts");
  const ref = await vite.ssrLoadModule("/components/dossier/src/dossier.config.tsx");
  for (const locale of ["fr", "en"]) {
    const base = ref.buildDossierConfig(locale);
    const configs = {
      universes: base,
      "universes-sheet-true": { ...base, composition: "sheet", tileMedia: "true-colour" },
      "universes-kicker": { ...base, kicker: "Kicker probe" },
      single: { ...base, items: base.items.filter((i) => i.id === "salons") },
      menu: ref.buildDossierMenuConfig(locale),
      "menu-0-panorama": ref.buildDossierMenuConfig(locale, { specials: 0, composition: "panorama" }),
      "menu-5": ref.buildDossierMenuConfig(locale, { specials: 5 }),
      "menu-pending": (() => {
        const c = ref.buildDossierMenuConfig(locale);
        return { ...c, items: c.items.map((i) => (i.id === "specials" ? { ...i, pending: true, entries: [] } : i)) };
      })(),
    };
    for (const [name, config] of Object.entries(configs)) {
      const hrefFor = (v) => (v ? `/x/${m.dossierRoutes.key(v)}/` : "/x/");
      const views = [null, ...m.dossierRoutes.views(config)];
      if (name === "menu-pending") views.push({ item: "specials", entry: "not-yet", opening: config.opening.id });
      for (const view of views) {
        const k = view ? m.dossierRoutes.key(view) : "(closed)";
        renders[`${locale}:${name}:${k}`] = await html(h(m.Dossier, { config, view, onNavigate: noop, hrefFor }));
        renders[`${locale}:${name}:${k}:at-rest`] = await html(h(m.Dossier, { config: { ...config, directLoad: "at-rest" }, view, onNavigate: noop, hrefFor }));
        renders[`${locale}:${name}:${k}:no-href`] = await html(h(m.Dossier, { config, view, onNavigate: noop }));
        if (view) {
          try {
            renders[`${locale}:${name}:${k}:head`] = JSON.stringify(m.dossierRoutes.head(config, view));
          } catch (error) {
            renders[`${locale}:${name}:${k}:head`] = `throws: ${error.message}`;
          }
          renders[`${locale}:${name}:${k}:media`] = JSON.stringify(m.dossierViewMedia(config, view));
          if (m.dossierViewImages) renders[`${locale}:${name}:${k}:images`] = JSON.stringify(m.dossierViewImages(config, view));
          renders[`${locale}:${name}:${k}:parse`] = JSON.stringify([m.dossierRoutes.parse(config, k), m.dossierRoutes.parent(view)]);
        }
      }
      renders[`${locale}:${name}:views`] = JSON.stringify(m.dossierRoutes.views(config));
      if (config.items[0]) {
        const item = config.items[0];
        renders[`${locale}:${name}:legacy`] = await html(h(m.Dossier, { config, open: true, onClose: noop, initialItemId: item.id, initialEntryId: item.entries[0]?.id, preload: false }));
      }
    }
  }
} finally {
  await vite.close();
}
writeFileSync(out, JSON.stringify(renders));
console.log(`${Object.keys(renders).length} renders → ${out}`);
