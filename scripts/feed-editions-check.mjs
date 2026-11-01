#!/usr/bin/env node
/* feed-editions-check — an editions feed board (dossier `feedCards: "editions"`, README "Feed") as rendered, per width:
     1. every headline and the lead's dek are complete: no line clamp, nothing cut (scroll size within the box);
     2. every caption sits inside its card, and every card is at least its ratio (the ratio is a minimum);
     3. one sheet per edition, alternating tone, the lead first; no card overlaps another;
     4. append-only: the first edition's cards do not move when the next edition lands.
   Client-agnostic: reads only dossier markup. Drives a headless Chrome against a running site on the board's URL.

   usage: node scripts/feed-editions-check.mjs <feed board URL> [--widths 1440,1024,768,390,320]
            default URL: the showcase journal (editions), http://127.0.0.1:4791/components/dossier/journal/journal/
          exit 1 on any failure
   env:   CHROME=/path/to/chrome (default google-chrome) */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  const value = args[at + 1];
  args.splice(at, 2);
  return value;
};
const widths = option("--widths", "1440,1024,768,390,320").split(",").map(Number);
const url = args[0] ?? "http://127.0.0.1:4791/components/dossier/journal/journal/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const expect = (ok, message, detail) => {
  console.log(`${ok ? "✓" : "✗"} ${message}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(message);
};

/* Measured in the page: the cards of every edition, their captions, headlines and deks. */
const MEASURE = `(() => {
  const boxes = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const sheets = [...document.querySelectorAll('.evd-feed__batch:not([data-ghosts])')];
  const cards = sheets.flatMap((sheet, s) => [...sheet.querySelectorAll(':scope > .evd-tile')].map((t, i) => {
    const caption = t.querySelector('.evd-tile__caption');
    const texts = [...t.querySelectorAll('.evd-tile__title, .evd-ed__dek')].map((el) => {
      const cs = getComputedStyle(el);
      /* Display type (line-height < 1) lets glyphs overflow their own line box: that is only a cut when the box clips. */
      const clips = cs.overflowX !== "visible" || cs.overflowY !== "visible" || cs.textOverflow === "ellipsis";
      const r = el.getBoundingClientRect(), card = t.getBoundingClientRect();
      return { clamp: cs.webkitLineClamp, cut: clips ? el.scrollHeight - el.clientHeight : 0, cutX: clips ? el.scrollWidth - el.clientWidth : 0, outside: r.bottom > card.bottom + 0.5 || r.top < card.top - 0.5, text: el.textContent.slice(0, 40) };
    });
    return { s, i, id: t.getAttribute('href'), lead: t.hasAttribute('data-lead'), box: boxes(t), caption: caption && boxes(caption), ratio: parseFloat(getComputedStyle(t, '::before').paddingTop) || 0, texts };
  }));
  return { sheets: sheets.map((s) => ({ parity: s.dataset.parity, bg: getComputedStyle(s).backgroundColor })), cards, scroll: document.querySelector(".evd-body")?.scrollTop ?? 0, fresh: !!document.querySelector(".evd-feed__fresh") };
})()`;

for (const width of widths) {
  const height = width >= 1024 ? 3000 : 5000;
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(tmpdir(), "feed-editions-"));
  const chrome = spawn(process.env.CHROME ?? "google-chrome", ["--headless=new", "--no-sandbox", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      await sleep(200);
      target = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page"), () => undefined);
    }
    if (!target) throw new Error("Chrome did not start");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
    let id = 0;
    const pending = new Map();
    const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) (pending.get(msg.id)(msg), pending.delete(msg.id));
    };
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
    /* Measure at rest: a batch landing meanwhile (a tall window keeps filling) pours its captions in from 14px below. */
    const settled = async () => {
      for (let i = 0; i < 40; i++) {
        const running = await evaluate(`document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity && a.effect?.target?.closest?.(".evd-feed")).length`);
        if (!running) return;
        await sleep(150);
      }
    };
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
    await send("Page.navigate", { url });
    await sleep(4000);
    console.log(`— ${width}px`);
    await settled();
    const before = await evaluate(MEASURE);
    const first = before.cards.filter((c) => c.s === 0);
    expect(before.sheets.length >= 1 && first.length > 0, `${width}: the board shows an edition`, `${before.sheets.length} sheets, ${first.length} cards`);
    expect(first[0]?.lead && first.filter((c) => c.lead).length === 1, `${width}: the edition opens on its lead, the only one`);
    const texts = before.cards.flatMap((c) => c.texts.map((t) => ({ ...t, card: c })));
    const clamped = texts.filter((t) => t.clamp !== "none" || t.cut > 1 || t.cutX > 1 || t.outside);
    expect(!clamped.length, `${width}: every headline and dek is complete (no clamp, nothing cut)`, clamped.map((t) => `"${t.text}" clamp ${t.clamp} cut ${t.cut}/${t.cutX}`).join("; "));
    const outside = before.cards.filter((c) => c.caption && (c.caption.y < c.box.y - 0.5 || c.caption.y + c.caption.h > c.box.y + c.box.h + 0.5));
    expect(!outside.length, `${width}: every caption sits inside its card`, outside.map((c) => c.id).join(", "));
    const short = before.cards.filter((c) => c.box.h + 0.5 < c.ratio);
    expect(!short.length, `${width}: every card is at least its ratio`, short.map((c) => `${c.id} ${c.box.h}<${c.ratio}`).join(", "));
    const overlaps = [];
    for (const a of before.cards) for (const b of before.cards) if (a !== b && a.box.x < b.box.x + b.box.w - 0.5 && b.box.x < a.box.x + a.box.w - 0.5 && a.box.y < b.box.y + b.box.h - 0.5 && b.box.y < a.box.y + a.box.h - 0.5) overlaps.push(`${a.id}×${b.id}`);
    expect(!overlaps.length, `${width}: no card overlaps another`, overlaps.slice(0, 3).join(", "));

    // Reach the end: the next edition is appended; the first edition's cards stay where they were (relative to the body).
    const toEnd = `(() => { const b = document.querySelector('.evd-body'); b.scrollTop = b.scrollHeight; })()`;
    await evaluate(toEnd);
    await sleep(1500);
    // A reader keeps scrolling: a second scroll event near the end (the sentinel reads the distance when it fires).
    await evaluate(`(() => { const b = document.querySelector('.evd-body'); b.scrollTop = Math.max(0, b.scrollTop - 200); })()`);
    await sleep(300);
    await evaluate(toEnd);
    await sleep(4000);
    if ((await evaluate(`document.querySelectorAll('.evd-feed__batch:not([data-ghosts])').length`)) < 2) {
      /* The sentinel did not append (seen at 768 on 1.15's tiles board too: reported separately); the older link's plain
         click appends in place, the same path. */
      console.log(`  ${width}: the sentinel did not append; appending through the older link`);
      await evaluate(`document.querySelector('.evd-feed__older')?.click()`);
      await sleep(4000);
    }
    await settled();
    const after = await evaluate(MEASURE);
    const shift = (after.scroll ?? 0) - (before.scroll ?? 0);
    const moved = first.filter((c) => {
      const now = after.cards.find((d) => d.s === 0 && d.id === c.id);
      return !now || Math.abs(now.box.y + shift - c.box.y) > 0.5 || Math.abs(now.box.x - c.box.x) > 0.5 || Math.abs(now.box.h - c.box.h) > 0.5;
    });
    expect(after.sheets.length >= 2, `${width}: the next edition was appended`, `${after.sheets.length} sheets`);
    expect(!moved.length, `${width}: the first edition's cards did not move (append-only)`, moved.map((c) => { const now = after.cards.find((d) => d.s === 0 && d.id === c.id); return `${c.id} dy ${now ? (now.box.y + shift - c.box.y).toFixed(1) : "gone"}`; }).slice(0, 2).join(", ") + (after.fresh ? " · live control shown" : ""));
    if (after.sheets.length >= 2) {
      expect(after.sheets[0].parity === "odd" && after.sheets[1].parity === "even" && after.sheets[0].bg !== after.sheets[1].bg, `${width}: editions alternate their sheet tone`, `${after.sheets[0].bg} / ${after.sheets[1].bg}`);
      const second = after.cards.filter((c) => c.s === 1);
      expect(second[0]?.lead, `${width}: the next edition opens on its own lead`);
      const cut2 = second.flatMap((c) => c.texts).filter((t) => t.clamp !== "none" || t.cut > 1 || t.outside);
      expect(!cut2.length, `${width}: the next edition's headlines are complete`, cut2.map((t) => t.text).join("; "));
    }
    ws.close();
  } catch (error) {
    failures.push(error.message);
    console.log(`✗ ${width}: ${error.message}`);
  } finally {
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}
console.log(failures.length ? `feed-editions-check FAILED (${failures.length})` : "feed-editions-check passed");
process.exitCode = failures.length ? 1 : 0;
