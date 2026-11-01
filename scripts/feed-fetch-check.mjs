#!/usr/bin/env node
/* feed-fetch-check — a failed feed page is fetched once, and again only on an explicit retry (dossier README "Feed",
   regression for a render loop that re-fetched a failed next page on every render).

   Drives a headless Chrome (CDP) against a running showcase preview, on the journal with
   `?feed-network=down-from-2` (page 1 loads, later pages fail), and reads the fake API's call counts
   (`window.__journalFetches`):
     1. the board appends page 2 → it fails → it is not fetched again while the board stays open;
     2. the detail of page 1's last entry (which prefetches the next page) adds no fetch;
     3. the error panel's retry fetches page 2 exactly once more.

   usage: node scripts/feed-fetch-check.mjs http://127.0.0.1:4791      exit 1 on any failure
   env:   CHROME=/path/to/chrome (default google-chrome) */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] ?? "http://127.0.0.1:4791").replace(/\/+$/, "");
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), "feed-fetch-"));
const chrome = spawn(process.env.CHROME ?? "google-chrome", ["--headless=new", "--no-sandbox", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];

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
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg), pending.delete(msg.id);
  };
  const send = (method, params = {}) => new Promise((r) => (pending.set(++id, r), ws.send(JSON.stringify({ id, method, params }))));
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const counts = async () => (await evaluate("JSON.stringify(window.__journalFetches ?? null)")) ?? "null";
  const page2 = async () => JSON.parse(await counts())?.pages?.[2] ?? 0;
  const expect = (ok, message, detail) => {
    console.log(`${ok ? "✓" : "✗"} ${message}${detail ? ` (${detail})` : ""}`);
    if (!ok) failures.push(message);
  };

  await send("Page.enable");
  await send("Page.navigate", { url: `${base}/components/dossier/journal/journal/?feed-network=down-from-2` });
  await sleep(3000);
  // Scroll the board's end into the sentinel's reach: page 2 is asked for, and fails.
  await evaluate(`(() => { const b = document.querySelector(".evd-body"); if (b) b.scrollTop = b.scrollHeight; })()`);
  await sleep(1500);
  const afterFail = await page2();
  const alert = await evaluate(`!!document.querySelector(".evd-feed__state[role=alert]")`);
  expect(afterFail === 1 && alert, "the failed page 2 was fetched once and the board shows its error", `page 2 fetches ${afterFail}, error panel ${alert}`);
  await sleep(5000);
  expect((await page2()) === afterFail, "no further fetch of the failed page while the board stays open (5 s)", `page 2 fetches ${await page2()}`);

  // The detail of page 1's last entry prefetches the next page: in error, it must not fetch again.
  await evaluate(`(() => { const t = [...document.querySelectorAll(".evd-tile")]; t[t.length - 1]?.click(); })()`);
  await sleep(5000);
  const detail = await evaluate(`document.querySelector(".ev-dossier")?.dataset.view`);
  expect(detail === "detail" && (await page2()) === afterFail, "the last entry's detail adds no fetch of the failed page (5 s)", `view ${detail}, page 2 fetches ${await page2()}`);

  // Back on the board, the error panel's retry is the one explicit retry: exactly one more fetch.
  await evaluate(`history.back()`);
  await sleep(2000);
  await evaluate(`(() => { const b = document.querySelector(".evd-body"); if (b) b.scrollTop = b.scrollHeight; })()`);
  await sleep(1000);
  await evaluate(`document.querySelector(".evd-feed__state[role=alert] button")?.click()`);
  await sleep(3000);
  expect((await page2()) === afterFail + 1, "the error panel's retry fetches page 2 exactly once more", `page 2 fetches ${await page2()}`);
  console.log(`calls: ${await counts()}`);
  ws.close();
} catch (error) {
  failures.push(error.message);
  console.log(`✗ ${error.message}`);
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
console.log(failures.length ? `feed-fetch-check FAILED (${failures.length})` : "feed-fetch-check passed");
process.exitCode = failures.length ? 1 : 0;
