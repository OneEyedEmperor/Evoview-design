#!/usr/bin/env node
/* header-brand-check — the dossier header with text brands of several lengths, per width: the brand never overlaps the
   item readout, the pager or the Evoview mark (RULES §9), is never cut, and the phone capsule keeps its height.
   The brand's text is replaced in place (the package's own CSS lays it out); a logo brand is skipped.

   usage: node scripts/header-brand-check.mjs <dossier view URL>… [--widths 1440,1024,390,320]
            [--names "Maison Ardoise|Le Courrier de Lyon|Boulangerie des Trois Frères"] [--shots <dir>]
          exit 1 on any failure
   env:   CHROME=/path/to/chrome (default google-chrome) */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
const widths = option("--widths", "1440,1024,390,320").split(",").map(Number);
const names = option("--names", "Maison Ardoise|Le Courrier de Lyon|Boulangerie des Trois Frères").split("|");
const shots = option("--shots", null);
const urls = args.length ? args : ["http://127.0.0.1:4791/components/dossier/table/"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const expect = (ok, message, detail) => {
  console.log(`${ok ? "✓" : "✗"} ${message}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(message);
};

const MEASURE = (name) => `(() => {
  const brand = document.querySelector('.evd-header__brand');
  const text = brand?.querySelector(':scope > .ev-t-readout-lg');
  if (!text) return { logo: true };
  text.textContent = ${JSON.stringify(name)};
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } : null; };
  const visible = (sel) => [...document.querySelectorAll(sel)].find((el) => { const r = el.getBoundingClientRect(); return r.width > 1 && getComputedStyle(el).position !== 'absolute'; });
  const range = document.createRange(); range.selectNodeContents(text);
  const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
  const cs = getComputedStyle(text);
  return {
    brand: box(brand), text: box(text), ink: box(range),
    cut: text.scrollWidth - text.clientWidth > 1 || cs.textOverflow === 'ellipsis' && text.scrollWidth > text.clientWidth,
    lines,
    readout: box(visible('.evd-header__meta .evd-header__title')),
    pager: box(document.querySelector('.evd-pager')),
    mark: box(document.querySelector('.evd-header .evd-mark')),
    bar: box(document.querySelector('.evd-header__bar')),
  };
})()`;

for (const url of urls) {
  for (const width of widths) {
    const port = 9400 + Math.floor(Math.random() * 400);
    const profile = mkdtempSync(join(tmpdir(), "brand-"));
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
      const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;
      await send("Page.enable");
      await send("Emulation.setDeviceMetricsOverride", { width, height: width >= 1024 ? 900 : 844, deviceScaleFactor: 1, mobile: width < 768 });
      await send("Page.navigate", { url });
      await sleep(5000);
      const baseBar = (await evaluate(`(() => { const r = document.querySelector('.evd-header__bar')?.getBoundingClientRect(); return r ? r.height : 0; })()`)) ?? 0;
      for (const name of names) {
        const m = await evaluate(MEASURE(name));
        await sleep(150);
        const tag = `${url.replace(/^https?:\/\/[^/]+/, "")} @${width} "${name}"`;
        if (m?.logo) {
          console.log(`- ${tag}: logo brand, skipped`);
          continue;
        }
        const gap = (a, b) => (a && b ? Math.round(b.l - a.r) : null);
        const toReadout = gap(m.ink, m.readout);
        const toPager = gap(m.ink, m.pager);
        const toMark = gap(m.ink, m.mark);
        console.log(`  ${tag}: ${m.lines} line(s), brand ${Math.round(m.text.w)}px; gaps → readout ${toReadout}, pager ${toPager ?? "–"}, mark ${toMark}; bar ${Math.round(m.bar.h)}px`);
        expect(!m.cut, `${tag}: the brand is not cut`);
        expect(m.ink.r <= m.brand.r + 0.5 && m.ink.l >= m.brand.l - 0.5, `${tag}: the brand stays inside its box`);
        if (toReadout !== null) expect(toReadout >= 8, `${tag}: brand clear of the item readout`, `${toReadout}px`);
        if (toPager !== null) expect(toPager >= 8, `${tag}: brand clear of the pager`, `${toPager}px`);
        expect(toMark !== null && toMark >= 8, `${tag}: brand clear of the Evoview mark`, `${toMark}px`);
        expect(m.ink.t >= m.bar.t && m.ink.b <= m.bar.b, `${tag}: the brand stays inside the bar`);
        if (width < 1024) expect(Math.abs(m.bar.h - baseBar) < 0.5, `${tag}: the capsule keeps its height`, `${Math.round(m.bar.h)} vs ${Math.round(baseBar)}`);
        if (shots && m.bar) {
          const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: Math.max(0, m.bar.t - 12), width, height: m.bar.h + 24, scale: 1 } });
          writeFileSync(join(shots, `brand-${width}-${name.length}-${url.split("/").filter(Boolean).pop()}.png`), Buffer.from(shot.result.data, "base64"));
        }
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
}
console.log(failures.length ? `header-brand-check FAILED (${failures.length})` : "header-brand-check passed");
process.exitCode = failures.length ? 1 : 0;
