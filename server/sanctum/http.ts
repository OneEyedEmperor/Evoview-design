/* The sanctum's endpoints, as one connect-style middleware. Nothing of the
   map leaves without a live entry; every answer is kept from indexes. */

import crypto from "node:crypto";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { applyOps, diffStates, summarize } from "../../src/sanctum/model/ops.ts";
import { BUDGET, VISION_MAX_BYTES, clone } from "../../src/sanctum/model/rules.ts";
import { SCHEMA_VERSION, type ChangeResponse, type Op, type RecordEntry, type Refusal, type SanctumState } from "../../src/sanctum/model/types.ts";
import { validate } from "../../src/sanctum/model/validate.ts";
import {
  COOKIE,
  DEVICE_COOKIE,
  ENTRY_TTL_MS,
  Entries,
  Gatekeeper,
  deviceCookie,
  entryCookie,
  parseCookies,
  readDevice,
  readEntry,
  signDevice,
  signEntry,
  sourceOf,
  strongEnough,
  takeSetup,
  hashWatchword,
  verifyWatchword,
  type AuthFile,
} from "./auth.ts";
import { MovedError, Store, dataDir, ensureDir, readJson, writeAtomic } from "./store.ts";
import { VisionRefusal, deriveVision, newVisionId, sniff } from "./visions.ts";

type Next = (err?: unknown) => void;

const ROBOTS = "noindex, nofollow";
const JSON_LIMIT = 512 * 1024;

class HttpRefusal extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(String(status));
    this.status = status;
    this.body = body;
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
    "X-Robots-Tag": ROBOTS,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    ...headers,
  });
  res.end(text);
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > limit) return reject(new HttpRefusal(413, { message: "This is too heavy for the sanctum to receive." }));
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        req.destroy();
        reject(new HttpRefusal(413, { message: "This is too heavy for the sanctum to receive." }));
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!String(req.headers["content-type"] ?? "").includes("application/json")) throw new HttpRefusal(415, { message: "The sanctum does not understand this." });
  const raw = await readBody(req, JSON_LIMIT);
  try {
    const parsed = JSON.parse(raw.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new HttpRefusal(400, { message: "The sanctum does not understand this." });
  }
}

/** Writes need the custom header and must come from this same origin. */
function guardWrite(req: IncomingMessage) {
  if (req.headers["x-sanctum"] !== "1") throw new HttpRefusal(403, {});
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "none") throw new HttpRefusal(403, {});
  const origin = req.headers.origin;
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {
      throw new HttpRefusal(403, {});
    }
    if (!req.headers.host || host !== req.headers.host.trim()) throw new HttpRefusal(403, {});
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SanctumHandlerOptions {
  dir?: string;
}

export function createSanctumHandler(options: SanctumHandlerOptions = {}) {
  const dir = options.dir ?? dataDir();
  const store = new Store(dir);
  const entries = new Entries(dir);
  const gate = new Gatekeeper();
  const authPath = path.join(dir, "auth.json");

  const auth = () => readJson<AuthFile>(authPath);

  const entered = (req: IncomingMessage): { sid: string; exp: number } | undefined => {
    const a = auth();
    if (!a) return undefined;
    const entry = readEntry(a.secret, parseCookies(req.headers.cookie)[COOKIE]);
    return entry && entries.has(entry.sid) ? entry : undefined;
  };

  const refused = (refusals: Refusal[], version: number, status = 422) => {
    throw new HttpRefusal(status, { accepted: false, refusals, version } satisfies ChangeResponse);
  };

  /** Runs ops (or a whole replacement state, for restores) through every invariant. */
  function change(base: SanctumState, next: SanctumState, ops: Op[], body: Record<string, unknown>, restoredFrom?: number): ChangeResponse {
    const given = typeof body.summary === "string" ? body.summary.trim() : "";
    const summary = given || (restoredFrom ? restoreSummary(restoredFrom) : summarize(base, next, ops));
    next.meta = { ...base.meta, summary };
    const refusals = validate(next, store.canon());
    if (refusals.length) refused(refusals, base.meta.version);
    const diff = diffStates(base, next);
    const baseVersion = body.baseVersion;
    if (baseVersion !== undefined && baseVersion !== base.meta.version) {
      refused([{ rule: "moved", message: "The map has moved since it was gathered: gather the sight again." }], base.meta.version, 409);
    }
    if (body.dryRun === true) return { accepted: true, sealed: false, state: next, diff, summary };
    if (baseVersion === undefined) refused([{ rule: "moved", message: "A change is sealed only upon the map as it was gathered." }], base.meta.version, 409);
    const version = base.meta.version + 1;
    next.meta = { schemaVersion: SCHEMA_VERSION, version, updatedAt: new Date().toISOString(), summary };
    try {
      store.seal(next, {
        version,
        at: next.meta.updatedAt,
        summary,
        ops: ops.length,
        ...(restoredFrom ? { restoredFrom } : { opNames: ops.map((o) => o.op) }),
      });
    } catch (err) {
      if (err instanceof MovedError) refused([{ rule: "moved", message: "The map has moved since it was gathered: gather the sight again." }], base.meta.version, 409);
      throw err;
    }
    return { accepted: true, sealed: true, state: next, diff, summary };
  }

  /* Whether a moment of the record can be restored under the canon and rules as they stand. */
  const PREDATES = "This moment predates the canon as it now stands.";
  const CURRENT = "This is the map as it stands.";
  const restorable = new Map<string, { ok: true } | { ok: false; why: string; refusals?: Refusal[] }>();
  function restorability(version: number, base: SanctumState): { ok: true } | { ok: false; why: string; refusals?: Refusal[] } {
    const key = `${version}@${base.meta.version}`;
    const known = restorable.get(key);
    if (known) return known;
    const held = store.at(version);
    let answer: { ok: true } | { ok: false; why: string; refusals?: Refusal[] };
    if (!held || held.state.meta.schemaVersion !== SCHEMA_VERSION) answer = { ok: false, why: PREDATES };
    else {
      const probe = clone(held.state);
      probe.meta = { ...base.meta };
      const refusals = validate(probe, store.canon());
      answer = !refusals.length
        ? { ok: true }
        : refusals.some((x) => x.rule === "fixed" || x.rule === "canonical" || x.rule === "shape")
          ? { ok: false, why: PREDATES }
          : { ok: false, why: refusals[0].message, refusals };
    }
    if (restorable.size > 2000) restorable.clear();
    restorable.set(key, answer);
    return answer;
  }

  function restoreSummary(version: number): string {
    const held = store.at(version)?.entry.summary ?? "";
    const text = `Restored as the record held it: ${held}`;
    return [...text].length > BUDGET.summary ? `${[...text].slice(0, BUDGET.summary - 1).join("").trimEnd()}…` : text;
  }

  async function route(req: IncomingMessage, res: ServerResponse, pathname: string) {
    const method = req.method ?? "GET";
    const sub = pathname.slice("/sanctum-api".length) || "/";

    if (sub === "/session") {
      if (method === "GET") return send(res, 200, { entered: Boolean(entered(req)) });
      guardWrite(req);
      if (method === "POST") {
        const a = auth();
        /* A known device knocks under its own key, in its own lane. */
        const device = a ? readDevice(a.secret, parseCookies(req.headers.cookie)[DEVICE_COOKIE]) : undefined;
        const key = device ? `device:${device}` : sourceOf(req.socket.remoteAddress, req.headers["cf-connecting-ip"]);
        const lane = device ? "device" : "common";
        /* Reserved before anything is awaited, so concurrent knocks cannot slip past. */
        const reserved = gate.reserve(key);
        if ("rest" in reserved) return send(res, 429, { entered: false, rest: reserved.rest }, { "Retry-After": String(reserved.rest) });
        let received = false;
        let full = false;
        let release: (() => void) | null = null;
        try {
          const body = await readJsonBody(req);
          const word = typeof body.watchword === "string" ? body.watchword : "";
          if (a && word && word.length <= 256) {
            release = await gate.slot(lane, reserved.fails);
            if (release) received = await verifyWatchword(word, a);
            else full = true;
          }
        } catch (err) {
          gate.settle(key, false);
          throw err;
        } finally {
          release?.();
        }
        if (full) {
          /* A full lane is no refusal of this knocker: it is not counted. */
          gate.settle(key, false, false);
          return send(res, 429, { entered: false, rest: 2 }, { "Retry-After": "2" });
        }
        if (!received || !a) {
          const rest = gate.settle(key, false);
          await sleep(Gatekeeper.FAIL_DELAY_MS);
          return send(res, 401, rest ? { entered: false, rest } : { entered: false });
        }
        gate.settle(key, true);
        const exp = Date.now() + ENTRY_TTL_MS;
        const sid = entries.open(exp);
        const cookies = [entryCookie(signEntry(a.secret, sid, exp), Math.floor(ENTRY_TTL_MS / 1000))];
        if (!device) cookies.push(deviceCookie(signDevice(a.secret)));
        res.setHeader("Set-Cookie", cookies);
        return send(res, 200, { entered: true });
      }
      if (method === "DELETE") {
        const entry = entered(req);
        if (entry) entries.close(entry.sid);
        return send(res, 200, { entered: false }, { "Set-Cookie": entryCookie("", 0) });
      }
      throw new HttpRefusal(405, {});
    }

    /* The summons: the emperor chooses the watchword. Unentered by nature, kept
       by the same gate; without a pending summons it answers like a refusal. */
    if (sub === "/setup") {
      if (method !== "POST") throw new HttpRefusal(405, {});
      guardWrite(req);
      const key = `setup|${sourceOf(req.socket.remoteAddress, req.headers["cf-connecting-ip"])}`;
      const reserved = gate.reserve(key);
      if ("rest" in reserved) return send(res, 429, { entered: false, rest: reserved.rest }, { "Retry-After": String(reserved.rest) });
      let body: Record<string, unknown>;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        gate.settle(key, false);
        throw err;
      }
      const word = typeof body.watchword === "string" ? body.watchword : "";
      const token = typeof body.token === "string" ? body.token : "";
      if (!strongEnough(word)) {
        gate.settle(key, false, false);
        return send(res, 422, { entered: false, weak: true });
      }
      if (!takeSetup(dir, token)) {
        const rest = gate.settle(key, false);
        await sleep(Gatekeeper.FAIL_DELAY_MS);
        return send(res, 401, rest ? { entered: false, rest } : { entered: false });
      }
      const release = await gate.slot("device", 0);
      let fresh: AuthFile;
      try {
        fresh = await hashWatchword(word.trim());
      } finally {
        release?.();
      }
      /* A new secret voids every entry and every device mark at once. */
      writeAtomic(authPath, JSON.stringify(fresh, null, 2));
      entries.closeAll();
      gate.settle(key, true);
      const exp = Date.now() + ENTRY_TTL_MS;
      const sid = entries.open(exp);
      res.setHeader("Set-Cookie", [entryCookie(signEntry(fresh.secret, sid, exp), Math.floor(ENTRY_TTL_MS / 1000)), deviceCookie(signDevice(fresh.secret))]);
      return send(res, 200, { entered: true });
    }

    if (!entered(req)) return send(res, 401, { entered: false });
    if (method !== "GET" && method !== "HEAD") guardWrite(req);

    if (sub === "/map" && method === "GET") return send(res, 200, store.current());

    if (sub === "/record" && method === "GET") {
      const base = store.current();
      const entries = store.record().map((e): RecordEntry => {
        if (e.version === base.meta.version) return { ...e, restorable: false, unrestorable: CURRENT };
        const r = restorability(e.version, base);
        return r.ok ? { ...e, restorable: true } : { ...e, restorable: false, unrestorable: r.why };
      });
      return send(res, 200, { entries });
    }

    const at = /^\/record\/(\d+)$/.exec(sub);
    if (at && method === "GET") {
      const h = store.at(Number(at[1]));
      return h ? send(res, 200, h.state) : send(res, 404, { message: "The record holds no such moment." });
    }

    if (sub === "/changes" && method === "POST") {
      const body = await readJsonBody(req);
      const base = store.current();
      const ops = body.ops as Op[];
      const { state: next, refusals } = applyOps(base, ops, { visionFiles: (id) => store.visionFiles(id) });
      if (refusals.length) refused(refusals, base.meta.version);
      const result = change(base, next, ops, body);
      return send(res, 200, result);
    }

    if (sub === "/restore" && method === "POST") {
      const body = await readJsonBody(req);
      const base = store.current();
      const version = Number(body.version);
      const held = store.at(version);
      if (!held || version === base.meta.version) refused([{ rule: "op", message: "The record holds no such moment to restore." }], base.meta.version);
      const r = restorability(version, base);
      if (!r.ok) refused(r.refusals ?? [{ rule: "op", message: r.why }], base.meta.version);
      const next = clone(held!.state);
      const result = change(base, next, [], body, version);
      return send(res, 200, result);
    }

    if (sub === "/visions" && method === "POST") {
      const type = String(req.headers["content-type"] ?? "").split(";")[0].trim();
      if (!["image/png", "image/jpeg", "image/webp"].includes(type)) throw new HttpRefusal(415, { message: "Only a picture can be brought as a vision." });
      const raw = await readBody(req, VISION_MAX_BYTES);
      const kind = sniff(raw.subarray(0, 16));
      if (!kind) throw new HttpRefusal(415, { message: "Only a picture can be brought as a vision." });
      const incoming = path.join(dir, "visions", ".incoming");
      ensureDir(incoming);
      const tmp = path.join(incoming, `${crypto.randomBytes(8).toString("hex")}.${kind}`);
      fs.writeFileSync(tmp, raw, { mode: 0o600 });
      try {
        const files = await deriveVision(dir, newVisionId(), tmp, kind);
        return send(res, 200, { files });
      } catch (err) {
        if (err instanceof VisionRefusal) throw new HttpRefusal(422, { message: err.message });
        throw new HttpRefusal(422, { message: "This picture cannot be held as a vision." });
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    }

    const img = /^\/visions\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(\d+)\.(avif|webp)$/.exec(sub);
    if (img && (method === "GET" || method === "HEAD")) {
      const files = store.visionFiles(img[1]);
      const width = Number(img[2]);
      const format = img[3] as "avif" | "webp";
      if (!files || !files.sizes.includes(width) || !files.formats.includes(format)) return send(res, 404, {});
      const file = path.join(store.visionDir(files.id), `${width}.${format}`);
      const stat = fs.statSync(file);
      res.writeHead(200, {
        "Content-Type": `image/${format}`,
        "Content-Length": stat.size,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Robots-Tag": ROBOTS,
        "X-Content-Type-Options": "nosniff",
      });
      if (method === "HEAD") return res.end();
      fs.createReadStream(file).pipe(res);
      return;
    }

    return send(res, 404, {});
  }

  return function sanctumMiddleware(req: IncomingMessage, res: ServerResponse, next: Next) {
    const pathname = (req.url ?? "/").split("?")[0];
    if (pathname === "/sanctum" || pathname.startsWith("/sanctum/")) {
      res.setHeader("X-Robots-Tag", ROBOTS);
      return next();
    }
    if (pathname !== "/sanctum-api" && !pathname.startsWith("/sanctum-api/")) return next();
    route(req, res, pathname).catch((err: unknown) => {
      if (res.headersSent) return res.end();
      if (err instanceof HttpRefusal) return send(res, err.status, err.body);
      return send(res, 500, { message: "The sanctum could not answer." });
    });
  };
}
