/* The watchword (scrypt hash only), the signed entry cookie, the list of
   live entries (so leaving revokes), and the gate's backoff. */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readJson, writeAtomic } from "./store.ts";

export interface AuthFile {
  scrypt: { N: number; r: number; p: number; keylen: number; salt: string; hash: string };
  secret: string;
  createdAt: string;
}

export const COOKIE = "sanctum";
export const ENTRY_TTL_MS = 72 * 60 * 60 * 1000;
const SCRYPT = { N: 1 << 15, r: 8, p: 1, keylen: 32 };
const MAXMEM = 128 * 1024 * 1024;

function scrypt(word: string, salt: Buffer, params: { N: number; r: number; p: number; keylen: number }): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.scrypt(word.normalize("NFC"), salt, params.keylen, { N: params.N, r: params.r, p: params.p, maxmem: MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashWatchword(word: string): Promise<AuthFile> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(word, salt, SCRYPT);
  return {
    scrypt: { ...SCRYPT, salt: salt.toString("base64"), hash: hash.toString("base64") },
    secret: crypto.randomBytes(32).toString("base64"),
    createdAt: new Date().toISOString(),
  };
}

export async function verifyWatchword(word: string, auth: AuthFile): Promise<boolean> {
  const expected = Buffer.from(auth.scrypt.hash, "base64");
  const got = await scrypt(word, Buffer.from(auth.scrypt.salt, "base64"), auth.scrypt);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function mac(secret: string, payload: string): string {
  return crypto.createHmac("sha256", Buffer.from(secret, "base64")).update(payload).digest("base64url");
}

export function signEntry(secret: string, sid: string, exp: number): string {
  const payload = b64url(JSON.stringify({ sid, exp }));
  return `${payload}.${mac(secret, payload)}`;
}

/** A signed value is exactly `payload.signature`; anything else is refused. */
function readSigned(secret: string, value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return undefined;
  const [payload, sig] = parts;
  const good = Buffer.from(mac(secret, payload));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

export function readEntry(secret: string, value: string | undefined): { sid: string; exp: number } | undefined {
  const parsed = readSigned(secret, value);
  if (!parsed || typeof parsed.sid !== "string" || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return undefined;
  return { sid: parsed.sid, exp: parsed.exp };
}

/* The known-device mark: set on entry, it lets the true watchword through
   whatever others are trying; it opens nothing by itself. */
export const DEVICE_COOKIE = "sanctum_device";
export const DEVICE_TTL_SEC = 400 * 24 * 60 * 60;

export function signDevice(secret: string): string {
  const payload = b64url(JSON.stringify({ device: crypto.randomBytes(12).toString("base64url"), iat: Date.now() }));
  return `${payload}.${mac(secret, payload)}`;
}

export function readDevice(secret: string, value: string | undefined): string | undefined {
  const parsed = readSigned(secret, value);
  return parsed && typeof parsed.device === "string" ? parsed.device : undefined;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* a malformed cookie is no cookie */
    }
  }
  return out;
}

export function entryCookie(value: string, maxAgeSec: number): string {
  return `${COOKIE}=${value}; Path=/sanctum-api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
}

export function deviceCookie(value: string): string {
  return `${DEVICE_COOKIE}=${value}; Path=/sanctum-api; HttpOnly; Secure; SameSite=Strict; Max-Age=${DEVICE_TTL_SEC}`;
}

/** Who is knocking: Cloudflare's client address when the peer is the local proxy, else the peer itself. Never a client-sent forward header. */
export function sourceOf(peer: string | undefined, cfConnectingIp: string | string[] | undefined): string {
  const p = peer ?? "";
  const loopback = p === "127.0.0.1" || p === "::1" || p === "::ffff:127.0.0.1";
  const cf = typeof cfConnectingIp === "string" ? cfConnectingIp.trim() : "";
  return loopback && cf && cf.length <= 64 ? `cf:${cf}` : `peer:${p}`;
}

/* The summons: a one-time token that lets the emperor choose the watchword
   himself, so no plaintext ever passes through an agent or the vault. Only
   its hash is kept; it expires, and it is burnt on first use. */
export interface SetupFile {
  hash: string;
  expires: number;
  createdAt: string;
}

export const SETUP_TTL_MS = 60 * 60 * 1000;
const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export function issueSetup(dir: string, ttlMs = SETUP_TTL_MS): string {
  const token = crypto.randomBytes(24).toString("base64url");
  const file: SetupFile = { hash: sha256(token), expires: Date.now() + ttlMs, createdAt: new Date().toISOString() };
  writeAtomic(path.join(dir, "setup.json"), JSON.stringify(file));
  return token;
}

export function pendingSetup(dir: string): SetupFile | undefined {
  const f = readJson<SetupFile>(path.join(dir, "setup.json"));
  return f && typeof f.hash === "string" && f.expires > Date.now() ? f : undefined;
}

/** True when `token` is the pending summons; burns it at once, so it serves once. */
export function takeSetup(dir: string, token: string): boolean {
  const f = pendingSetup(dir);
  if (!f || typeof token !== "string" || token.length < 16 || token.length > 128) return false;
  const good = Buffer.from(f.hash, "hex");
  const given = Buffer.from(sha256(token), "hex");
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return false;
  fs.rmSync(path.join(dir, "setup.json"), { force: true });
  return true;
}

/** At least twenty letters, or four words of three letters and sixteen in all; at most 256. */
export function strongEnough(word: string): boolean {
  const w = word.trim();
  const length = [...w].length;
  const words = w.split(/[\s\-_.,]+/u).filter((x) => [...x].filter((c) => /\p{L}/u.test(c)).length >= 3).length;
  return length <= 256 && (length >= 20 || (words >= 4 && length >= 16));
}

/** Live entries, shared by every server process through the data dir. */
export class Entries {
  private file: string;
  constructor(dir: string) {
    this.file = path.join(dir, "entries.json");
  }
  private read(): Record<string, number> {
    return readJson<Record<string, number>>(this.file) ?? {};
  }
  private write(all: Record<string, number>) {
    const now = Date.now();
    for (const [sid, exp] of Object.entries(all)) if (exp < now) delete all[sid];
    writeAtomic(this.file, JSON.stringify(all));
  }
  open(exp: number): string {
    const sid = crypto.randomBytes(18).toString("base64url");
    const all = this.read();
    all[sid] = exp;
    this.write(all);
    return sid;
  }
  has(sid: string): boolean {
    const exp = this.read()[sid];
    return typeof exp === "number" && exp > Date.now();
  }
  close(sid: string) {
    const all = this.read();
    delete all[sid];
    this.write(all);
  }
  closeAll() {
    this.write({});
  }
}

/* The gate, in memory:
   - each source has one attempt in flight; a refusal is charged before the
     watchword is weighed, so concurrent guesses cannot slip past the rest;
   - after a few refusals the source rests, doubling to a ceiling;
   - weighing is capped (two at a time in the common lane, one in the
     device lane) so a flood never starves the server's other work; the
     common queue favours sources with fewer refusals;
   - a known device has its own key and lane: others' refusals never
     refuse it. There is no global lock. */
export type Lane = "common" | "device";

interface SourceState {
  fails: number;
  until: number;
  busy: boolean;
  seen: number;
}

interface Waiting {
  fails: number;
  admit: (granted: boolean) => void;
}

export class Gatekeeper {
  static readonly FREE = 4;
  static readonly MAX_REST_MS = 15 * 60 * 1000;
  static readonly SLOTS: Record<Lane, number> = { common: 2, device: 1 };
  static readonly QUEUE: Record<Lane, number> = { common: 64, device: 4 };
  /** Every refused answer waits this long: a slow-down, never a lock. */
  static readonly FAIL_DELAY_MS = 800;
  private static readonly MAX_SOURCES = 20000;

  private sources = new Map<string, SourceState>();
  private running: Record<Lane, number> = { common: 0, device: 0 };
  private waiting: Record<Lane, Waiting[]> = { common: [], device: [] };

  private state(key: string, now: number): SourceState {
    let s = this.sources.get(key);
    if (!s) {
      if (this.sources.size >= Gatekeeper.MAX_SOURCES) this.prune(now);
      s = { fails: 0, until: 0, busy: false, seen: now };
      this.sources.set(key, s);
    }
    s.seen = now;
    return s;
  }

  private prune(now: number) {
    for (const [k, s] of this.sources) if (!s.busy && s.until < now && now - s.seen > 60 * 60 * 1000) this.sources.delete(k);
    if (this.sources.size >= Gatekeeper.MAX_SOURCES) {
      for (const [k, s] of this.sources) if (!s.busy && s.until < now) this.sources.delete(k);
    }
  }

  /** Synchronous: reserves the attempt (charged as a refusal until it is received), or answers the seconds to rest. */
  reserve(key: string, now = Date.now()): { rest: number } | { fails: number } {
    const s = this.state(key, now);
    if (s.until > now) return { rest: Math.ceil((s.until - now) / 1000) };
    if (s.busy) return { rest: 1 };
    s.busy = true;
    s.fails += 1;
    return { fails: s.fails };
  }

  /** Ends a reserved attempt. A refusal may set a rest; returns the seconds to rest. `counted: false` withdraws the charge. */
  settle(key: string, received: boolean, counted = true, now = Date.now()): number {
    const s = this.state(key, now);
    s.busy = false;
    if (received) {
      this.sources.delete(key);
      return 0;
    }
    if (!counted) {
      s.fails = Math.max(0, s.fails - 1);
      return 0;
    }
    if (s.fails > Gatekeeper.FREE) s.until = now + Math.min(1000 * 2 ** (s.fails - Gatekeeper.FREE), Gatekeeper.MAX_REST_MS);
    return s.until > now ? Math.ceil((s.until - now) / 1000) : 0;
  }

  /** Waits for a weighing slot; resolves with a release, or null when the lane is full. */
  slot(lane: Lane, fails: number): Promise<(() => void) | null> {
    const release = () => {
      this.running[lane] -= 1;
      const next = this.waiting[lane].shift();
      if (next) next.admit(true);
    };
    if (this.running[lane] < Gatekeeper.SLOTS[lane]) {
      this.running[lane] += 1;
      return Promise.resolve(release);
    }
    const queue = this.waiting[lane];
    if (queue.length >= Gatekeeper.QUEUE[lane]) {
      /* A newcomer with fewer refusals takes the place of the most refused one waiting. */
      let worst = -1;
      queue.forEach((w, i) => {
        if (worst < 0 || w.fails > queue[worst].fails) worst = i;
      });
      if (worst < 0 || queue[worst].fails <= fails) {
        /* A first knock may borrow the device lane only while it is idle; it never queues
           there, so known devices keep their place ahead of it. */
        if (lane === "common" && fails <= 1 && this.running.device < Gatekeeper.SLOTS.device && !this.waiting.device.length) {
          this.running.device += 1;
          return Promise.resolve(() => {
            this.running.device -= 1;
            const next = this.waiting.device.shift();
            if (next) next.admit(true);
          });
        }
        return Promise.resolve(null);
      }
      queue.splice(worst, 1)[0].admit(false);
    }
    return new Promise((resolve) => {
      const entry: Waiting = {
        fails,
        admit: (granted) => {
          if (!granted) return resolve(null);
          this.running[lane] += 1;
          resolve(release);
        },
      };
      const at = queue.findIndex((w) => w.fails > fails);
      if (at < 0) queue.push(entry);
      else queue.splice(at, 0, entry);
    });
  }
}
