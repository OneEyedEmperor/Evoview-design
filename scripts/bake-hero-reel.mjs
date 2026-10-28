// Bakes the hero reel's cards into alpha WebPs: grade, dim, frame, blur and
// the reel's 0.32 opacity, rendered by Chrome so the look matches the former
// live CSS. Live, those effects sat above a moving layer and were
// re-composited every frame. Re-run after replacing a source image:
//   node scripts/bake-hero-reel.mjs
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const IDS = ["identite-visuelle", "direction-artistique", "design-creation", "strategie-marketing"];
const DIR = resolve(import.meta.dirname, "../public/library/hero");
/* Reference card: the widest desktop card (19em x 0.75 at 16px). BLEED
   holds the blur and shadow spill; keep BLEED / CARD in step with the
   panel's inset in library.css (12 / 228 = 5.263%). */
const CARD = 228;
const BLEED = 12;
const BOX = CARD + 2 * BLEED;

const html = (id) => `<!doctype html><html><head><style>
html, body { margin: 0; background: transparent; }
.box { width: ${BOX}px; height: ${BOX}px; display: grid; place-items: center; opacity: 0.32; filter: blur(3px); }
.panel { width: ${CARD}px; box-sizing: border-box; padding: 1px; border-radius: 16px; background: rgb(99 75 114 / 0.4);
  box-shadow: 0 6px 18px -8px rgb(0 0 0 / 0.35), 0 2px 6px -2px rgb(0 0 0 / 0.25); }
.media { position: relative; overflow: hidden; aspect-ratio: 1; border-radius: 15px; background: #0b0b10; }
.media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.85;
  filter: grayscale(1) contrast(1.2) brightness(1.06); }
.dim { position: absolute; inset: 0; background:
  radial-gradient(circle farthest-corner at 50% 50%, transparent 38%, rgb(0 0 0 / 0.22) 62%, rgb(0 0 0 / 0.5) 100%), rgb(0 0 0 / 0.72); }
</style></head><body><div class="box"><div class="panel"><div class="media">
<img src="file://${DIR}/${id}-768.webp"><span class="dim"></span></div></div></div></body></html>`;

const work = mkdtempSync(join(tmpdir(), "hero-bake-"));
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn("google-chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-sandbox", "--no-first-run",
  "--allow-file-access-from-files", `--user-data-dir=${join(work, "profile")}`, "about:blank"], { stdio: "ignore" });

let ws;
for (let i = 0; !ws && i < 50; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    const s = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { s.onopen = r; s.onerror = j; });
    ws = s;
  } catch { await sleep(200); }
}
let seq = 0;
const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data); pending.get(msg.id)?.(msg.result); pending.delete(msg.id); };
const send = (method, params = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

try {
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const [scale, w] of [[2, BOX * 2], [1, BOX]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: BOX, height: BOX, deviceScaleFactor: scale, mobile: false });
    for (const id of IDS) {
      const file = join(work, `${id}.html`);
      writeFileSync(file, html(id));
      await send("Page.navigate", { url: `file://${file}` });
      await sleep(600);
      await send("Runtime.evaluate", { expression: "document.images[0].decode()", awaitPromise: true });
      const { data } = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: BOX, height: BOX, scale: 1 } });
      const png = join(work, `${id}-${w}.png`);
      writeFileSync(png, Buffer.from(data, "base64"));
      execFileSync("cwebp", ["-quiet", "-q", "82", "-alpha_q", "100", png, "-o", join(DIR, `${id}-reel-${w}.webp`)]);
      console.log(`${id}-reel-${w}.webp`);
    }
  }
} finally {
  ws.close();
  chrome.kill("SIGKILL");
  rmSync(work, { recursive: true, force: true });
}
