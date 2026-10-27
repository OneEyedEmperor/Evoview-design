#!/usr/bin/env node
/* verify:chapter — the chapter package's non-modal contracts, which
   verify:ssr (modal packages only) does not cover: the contact's venue clock
   against fixed instants (opening/closing edges, venue midnight, both DST
   switches, past-midnight slots, visitor time zone), and server HTML of
   ChapterFaq / ChapterContact / ChapterFooter (copy present and unhidden,
   JSON-LD = visible copy, heading levels, aria wiring, no live state on the
   server, one linked Evoview mark). Cases assume the reference config.

   usage: pnpm verify:chapter        exit 1 on any failure */

import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "package.json"));
const React = require("react");
const { prerender } = require("react-dom/static");
const h = React.createElement;

const vite = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  esbuild: { jsx: "automatic" },
  plugins: [
    {
      name: "expose-business-clock",
      transform(code, id) {
        if (id.endsWith("/chapter/src/ChapterContact.tsx")) return `${code}\nexport { businessNow, businessStatus };\n`;
      },
    },
  ],
});

let fails = 0;
let passes = 0;
const ok = (cond, msg, extra = "") => {
  if (cond) passes++;
  else {
    fails++;
    console.log(`✗ ${msg} ${extra}`);
  }
};

async function html(el) {
  const { prelude } = await prerender(el, { progressiveChunkSize: Number.MAX_SAFE_INTEGER });
  const reader = prelude.getReader();
  let out = "";
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value);
  }
  return out;
}
const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const text = (s) => decode(s.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

try {
  const contact = await vite.ssrLoadModule("/components/chapter/src/ChapterContact.tsx");
  const chapter = await vite.ssrLoadModule("/components/chapter/src/index.ts");
  const { businessNow, businessStatus } = contact;

  /* ── Venue clock ── */
  const fr = chapter.buildChapterContactConfig("fr").hours;
  const at = (iso, hours = fr, zone = hours.timeZone) => {
    const now = businessNow(zone, new Date(iso));
    return now && { ...now, ...businessStatus(now, hours) };
  };
  const cases = [
    // 2026-10-27 is a Tuesday; Brussels is UTC+1 (CET) after 2026-10-25.
    ["2026-10-27T08:29:59Z", 1, false, "Fermé · ouvre à 09:30"],
    ["2026-10-27T08:30:00Z", 1, true, "Ouvert jusqu'à 12:30"],
    ["2026-10-27T11:29:00Z", 1, true, "Ouvert jusqu'à 12:30"],
    ["2026-10-27T11:30:00Z", 1, false, "Fermé · ouvre à 13:30"],
    ["2026-10-27T12:30:00Z", 1, true, "Ouvert jusqu'à 18:00"],
    ["2026-10-27T16:59:59Z", 1, true, "Ouvert jusqu'à 18:00"],
    ["2026-10-27T17:00:00Z", 1, false, "Fermé · ouvre mercredi à 09:30"],
    // Friday closes at 17:00, then Sat/Sun/Mon closed.
    ["2026-10-30T15:59:00Z", 4, true, "Ouvert jusqu'à 17:00"],
    ["2026-10-30T16:00:00Z", 4, false, "Fermé · ouvre mardi à 09:30"],
    ["2026-11-01T12:00:00Z", 6, false, "Fermé · ouvre mardi à 09:30"],
    // Day change at Brussels midnight (not UTC, not the visitor's).
    ["2026-11-02T22:59:00Z", 0, false, "Fermé · ouvre mardi à 09:30"],
    ["2026-11-02T23:00:00Z", 1, false, "Fermé · ouvre à 09:30"],
    // DST end 2026-10-25 03:00 CEST → 02:00 CET (Sunday).
    ["2026-10-24T21:59:00Z", 5, false, "Fermé · ouvre mardi à 09:30"],
    ["2026-10-24T22:00:00Z", 6, false, "Fermé · ouvre mardi à 09:30"],
    // Thursday before DST end (CEST, UTC+2): 09:30 local = 07:30Z.
    ["2026-10-22T07:29:00Z", 3, false, "Fermé · ouvre à 09:30"],
    ["2026-10-22T07:30:00Z", 3, true, "Ouvert jusqu'à 12:30"],
    // DST start 2026-03-29 (Sun) 02:00 CET → 03:00 CEST; Tuesday after: 09:30 = 07:30Z.
    ["2026-03-31T07:29:00Z", 1, false, "Fermé · ouvre à 09:30"],
    ["2026-03-31T07:30:00Z", 1, true, "Ouvert jusqu'à 12:30"],
  ];
  for (const [iso, day, open, txt] of cases) {
    const r = at(iso);
    ok(r && r.day === day && r.open === open && r.text === txt, `clock ${iso}`, JSON.stringify(r));
  }
  const minutes = (iso) => businessNow("Europe/Brussels", new Date(iso)).minutes;
  ok(minutes("2026-10-25T00:59:00Z") === 2 * 60 + 59 && minutes("2026-10-25T01:00:00Z") === 2 * 60, "DST end wall clock 02:59 CEST → 02:00 CET");
  ok(minutes("2026-03-29T00:59:00Z") === 60 + 59 && minutes("2026-03-29T01:00:00Z") === 3 * 60, "DST start wall clock 01:59 CET → 03:00 CEST");
  ok(businessNow("Europe/Brussels", new Date("2026-10-27T23:00:00Z")).minutes === 0, "midnight is 0, not 24:00");

  // Past-midnight slots (a bar): Friday 18:00–01:00, Saturday 19:00–02:00.
  const bar = { ...fr, week: [[null], [null], [null], [null], ["18:00–01:00"], ["19:00-02:00"], [null]], services: ["Soir"] };
  const barCases = [
    ["2026-10-30T23:30:00Z", 5, true, "Ouvert jusqu'à 01:00"], // Saturday 00:30 local, Friday's slot
    ["2026-10-30T16:59:00Z", 4, false, "Fermé · ouvre à 18:00"],
    ["2026-10-30T17:00:00Z", 4, true, "Ouvert jusqu'à 01:00"],
    ["2026-10-31T00:00:00Z", 5, false, "Fermé · ouvre à 19:00"], // Sat 01:00 local: closed
    ["2026-11-01T00:30:00Z", 6, true, "Ouvert jusqu'à 02:00"], // Sun 01:30 local, Saturday's slot
    ["2026-11-01T01:00:00Z", 6, false, "Fermé · ouvre vendredi à 18:00"],
  ];
  for (const [iso, day, open, txt] of barCases) {
    const r = at(iso, bar);
    ok(r && r.day === day && r.open === open && r.text === txt, `bar ${iso}`, JSON.stringify(r));
  }
  ok(businessNow("Mars/Olympus", new Date()) === null, "unknown zone → null (no throw)");
  const closedWeek = { ...fr, week: Array.from({ length: 7 }, () => [null, null]) };
  ok(at("2026-10-27T10:00:00Z", closedWeek).text === "Fermé pour le moment", "never open → closedForNow");
  // Same instant, different visitor zones (process TZ): result only depends on the venue zone.
  const tzs = ["America/Los_Angeles", "Asia/Tokyo", "Pacific/Kiritimati", "UTC"];
  const seen = new Set();
  for (const tz of tzs) {
    process.env.TZ = tz;
    seen.add(JSON.stringify(at("2026-10-27T23:30:00Z")));
  }
  ok(seen.size === 1, "visitor time zone has no effect", [...seen].join(" | "));
  delete process.env.TZ;

  /* ── SSR: FAQ ── */
  for (const locale of ["fr", "en"]) {
    const config = chapter.buildChapterFaqConfig(locale);
    for (const layout of ["media", "split", "stacked"]) {
      for (const level of [2, 3]) {
        const el = h(chapter.ChapterFaq, { config, layout, tone: "light", defaultOpen: 1, level });
        const out = await html(el);
        const again = await html(el);
        const tag = `faq ${locale} ${layout} L${level}`;
        ok(out === again, `${tag} deterministic`);
        const t = text(out);
        for (const item of config.items) {
          ok(t.includes(item.question), `${tag} question in HTML`, item.question);
          ok(t.includes(item.answer), `${tag} answer in HTML`, item.answer.slice(0, 40));
        }
        ok(!/\shidden(=|\s|>)/.test(out), `${tag} no hidden attribute in server HTML`);
        ok(!/\sinert/.test(out), `${tag} no inert`);
        const Hs = level === 2 ? ["h2", "h3"] : ["h3", "h4"];
        ok((out.match(new RegExp(`<${Hs[0]}[\\s>]`, "g")) || []).length === 1, `${tag} one ${Hs[0]} title`);
        ok((out.match(new RegExp(`<${Hs[1]}[\\s>]`, "g")) || []).length === config.items.length, `${tag} ${Hs[1]} per question`);
        ok(!out.includes(`<h${level === 2 ? 4 : 2}`), `${tag} no stray level`);
        const ld = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        ok(ld.length === 1, `${tag} one JSON-LD`);
        const data = JSON.parse(ld[0][1]);
        ok(data["@type"] === "FAQPage" && data["@context"] === "https://schema.org", `${tag} FAQPage`);
        ok(data.mainEntity.length === config.items.length, `${tag} all questions in JSON-LD`);
        data.mainEntity.forEach((q, i) => {
          ok(q["@type"] === "Question" && q.name === config.items[i].question && q.acceptedAnswer?.["@type"] === "Answer" && q.acceptedAnswer.text === config.items[i].answer, `${tag} JSON-LD item ${i} = visible copy`);
          ok(t.includes(q.name) && t.includes(q.acceptedAnswer.text), `${tag} JSON-LD item ${i} visible`);
        });
        // aria wiring
        const triggers = [...out.matchAll(/<button[^>]*class="ev-chapter-faq__trigger"[^>]*>/g)].map((m) => m[0]);
        ok(triggers.length === config.items.length, `${tag} trigger per question`);
        triggers.forEach((b, i) => {
          const controls = b.match(/aria-controls="([^"]+)"/)?.[1];
          const expanded = b.match(/aria-expanded="([^"]+)"/)?.[1];
          ok(controls && out.includes(`id="${controls}"`), `${tag} trigger ${i} aria-controls target exists`);
          ok(expanded === String(i === 1), `${tag} trigger ${i} aria-expanded=${expanded}`);
        });
        if (layout === "media") ok(/<img[^>]*loading="lazy"[^>]*>/.test(out) && /<img[^>]*alt="[^"]+"/.test(out), `${tag} media img lazy + alt`);
      }
    }
  }

  /* ── SSR: contact ── */
  for (const locale of ["fr", "en"]) {
    const config = chapter.buildChapterContactConfig(locale);
    for (const layout of ["columns", "split", "band"]) {
      for (const hours of ["today", "week"]) {
        for (const level of [2, 3]) {
          const el = h(chapter.ChapterContact, { config, layout, hours, tone: "dark", level });
          const out = await html(el);
          const tag = `contact ${locale} ${layout} ${hours} L${level}`;
          ok(out === (await html(el)), `${tag} deterministic`);
          const t = text(out);
          for (const day of config.hours.labels.days) ok(t.includes(day), `${tag} day ${day} in HTML`);
          for (const slot of config.hours.week.flat().filter(Boolean)) ok(t.includes(slot), `${tag} slot ${slot} in HTML`);
          ok(!t.includes(config.hours.labels.today + " " + config.hours.labels.days[1]), `${tag} no 'today' resolved on server`);
          ok(!/Ouvert jusqu|Open until|Fermé ·|Closed ·/.test(t), `${tag} no live state on server`);
          ok(!out.includes("data-today"), `${tag} no today mark on server`);
          for (const c of [...config.place, ...config.channels]) ok(t.includes(c.value), `${tag} channel ${c.label}`);
          const [H, Hh] = level === 2 ? ["h2", "h3"] : ["h3", "h4"];
          ok((out.match(new RegExp(`<${H}[\\s>]`, "g")) || []).length === 1, `${tag} one ${H}`);
          ok((out.match(new RegExp(`<${Hh}[\\s>]`, "g")) || []).length === 1, `${tag} hours ${Hh}`);
          ok(!/\sinert|\shidden(=|\s|>)/.test(out), `${tag} no hidden/inert`);
          const img = out.match(/<img[^>]*>/)?.[0];
          if (layout === "band" || (layout === "columns" && hours === "week")) ok(!img, `${tag} no picture`);
          else ok(img && /sizes="[^"]+"/.test(img) && /srcSet="|srcset="/.test(img) && /alt="[^"]+"/.test(img) && /loading="lazy"/.test(img) && /width="1200"/.test(img), `${tag} picture srcset/sizes/alt/lazy/size`, img);
          if (hours === "today") ok(/<details[^>]*class="ev-chapter-contact__fold"/.test(out) && !/<details[^>]*\sopen/.test(out), `${tag} week folded in <details>`);
        }
      }
    }
  }

  /* ── SSR: footer ── */
  for (const locale of ["fr", "en"]) {
    const config = chapter.buildChapterConfig(locale);
    for (const layout of ["bar", "panel"]) {
      const el = h(chapter.ChapterFooter, { config, layout });
      const out = await html(el);
      const tag = `footer ${locale} ${layout}`;
      ok(out === (await html(el)), `${tag} deterministic`);
      const marks = [...out.matchAll(/<a[^>]*href="https:\/\/evoview\.be\/?"[^>]*>/g)];
      ok(marks.length === 1, `${tag} one linked Evoview mark`, String(marks.length));
      ok(marks[0] && marks[0][0].includes(`aria-label="${config.attribution.label}"`) && /target="_blank"/.test(marks[0][0]), `${tag} mark name + new tab`, marks[0]?.[0]);
      const t = text(out);
      ok(t.includes(config.footer.legal), `${tag} legal`);
      if (layout === "panel") {
        for (const n of config.footer.nav) ok(t.includes(n.label), `${tag} nav ${n.label}`);
        ok(/<address/.test(out) && t.includes(config.footer.contact.address), `${tag} address`);
        ok(/aria-current="page"/.test(out), `${tag} current page`);
      }
    }
  }
} finally {
  await vite.close();
}
console.log(`\n${fails ? "FAILED" : "passed"}: ${passes} passed, ${fails} failed`);
process.exitCode = fails ? 1 : 0;
