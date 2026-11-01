#!/usr/bin/env node
/* feed-fetch-check — a failed feed page is fetched once, and again only on an explicit retry (dossier README "Feed",
   regression for a render loop that re-fetched a failed next page on every render). Client-agnostic: it fails the
   feed's page requests by interception (CDP `Fetch`), counts them itself and reads only dossier markup.

   Drives a headless Chrome against a running site (any client, or the showcase preview) on a feed board's URL. Page 1
   loads; every request for page ≥ 2 fails at the network:
     1. the board appends page 2 → it fails → it is not requested again while the board stays open;
     2. the detail of page 1's last entry (which prefetches the next page) adds no request;
     3. the error panel's retry requests page 2 exactly once more.

   usage: node scripts/feed-fetch-check.mjs <feed board URL> [--page-request <regex>] [--tile <selector>]
            <feed board URL>  the feed's overview, e.g. http://127.0.0.1:4791/stories/latest/
                              default: the showcase journal, http://127.0.0.1:4791/components/dossier/journal/journal/
            --page-request    regex over request URLs, capture group 1 = the page number (default: the showcase's
                              fake API, `/library/dossier/journal\.json\?page=(\d+)`); e.g. `/api/latest\?page=(\d+)`
            --tile            a board tile (default `.evd-feed .evd-tile`)
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
const pageRequest = new RegExp(option("--page-request", "/library/dossier/journal\\.json\\?page=(\\d+)"));
const tile = option("--tile", ".evd-feed .evd-tile");
const url = args[0] ?? "http://127.0.0.1:4791/components/dossier/journal/journal/";

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), "feed-fetch-"));
const chrome = spawn(process.env.CHROME ?? "google-chrome", ["--headless=new", "--no-sandbox", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
/** Requests per page number, as the network saw them. */
const requests = {};

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
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
      return;
    }
    if (msg.method !== "Fetch.requestPaused") return;
    const { requestId, request } = msg.params;
    const page = Number(request.url.match(pageRequest)?.[1] ?? 0);
    if (page >= 1) requests[page] = (requests[page] ?? 0) + 1;
    if (page >= 2) send("Fetch.failRequest", { requestId, errorReason: "Failed" });
    else send("Fetch.continueRequest", { requestId });
  };
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const page2 = () => requests[2] ?? 0;
  const expect = (ok, message, detail) => {
    console.log(`${ok ? "✓" : "✗"} ${message}${detail ? ` (${detail})` : ""}`);
    if (!ok) failures.push(message);
  };

  await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(3000);
  const board = await evaluate(`document.querySelectorAll(${JSON.stringify(tile)}).length`);
  // Page 1 may come from the server's snapshot (no request): only the board is required.
  expect(board > 0, "the feed board is open", `${board} tiles, page-1 requests ${requests[1] ?? 0}`);
  // Scroll the board's end into the sentinel's reach: page 2 is asked for, and fails.
  await evaluate(`(() => { const b = document.querySelector(".evd-body"); if (b) b.scrollTop = b.scrollHeight; })()`);
  await sleep(1500);
  const afterFail = page2();
  const alert = await evaluate(`!!document.querySelector(".evd-feed__state[role=alert]")`);
  expect(afterFail === 1 && alert, "the failed page 2 was requested once and the board shows its error", `page 2 requests ${afterFail}, error panel ${alert}`);
  await sleep(5000);
  expect(page2() === afterFail, "no further request for the failed page while the board stays open (5 s)", `page 2 requests ${page2()}`);

  // The detail of page 1's last entry prefetches the next page: in error, it must not request it again.
  await evaluate(`(() => { const t = [...document.querySelectorAll(${JSON.stringify(tile)})]; t[t.length - 1]?.click(); })()`);
  await sleep(5000);
  const detail = await evaluate(`document.querySelector(".ev-dossier")?.dataset.view`);
  expect(detail === "detail" && page2() === afterFail, "the last entry's detail adds no request for the failed page (5 s)", `view ${detail}, page 2 requests ${page2()}`);

  // Back on the board, the error panel's retry is the one explicit retry: exactly one more request.
  await evaluate(`history.back()`);
  await sleep(2000);
  await evaluate(`(() => { const b = document.querySelector(".evd-body"); if (b) b.scrollTop = b.scrollHeight; })()`);
  await sleep(1000);
  await evaluate(`document.querySelector(".evd-feed__state[role=alert] button")?.click()`);
  await sleep(3000);
  expect(page2() === afterFail + 1, "the error panel's retry requests page 2 exactly once more", `page 2 requests ${page2()}`);
  console.log(`page requests: ${JSON.stringify(requests)}`);
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
