/* The watchword (scrypt hash only), the signed entry cookie, the list of
   live entries (so leaving revokes), and the gate's backoff. */

import crypto from "node:crypto";
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

export function readEntry(secret: string, value: string | undefined): { sid: string; exp: number } | undefined {
  if (!value) return undefined;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return undefined;
  const good = Buffer.from(mac(secret, payload));
  const given = Buffer.from(sig);
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sid?: unknown; exp?: unknown };
    if (typeof parsed.sid !== "string" || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return undefined;
    return { sid: parsed.sid, exp: parsed.exp };
  } catch {
    return undefined;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function entryCookie(value: string, maxAgeSec: number): string {
  return `${COOKIE}=${value}; Path=/sanctum-api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
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
}

/* Backoff: after a few refusals from one source the gate rests, doubling
   each time; a global ceiling stops a spread of sources. In memory. */
export class Gatekeeper {
  private bySource = new Map<string, { fails: number; until: number }>();
  private recent: number[] = [];
  private static FREE = 4;
  private static MAX_REST_MS = 15 * 60 * 1000;
  private static GLOBAL_WINDOW_MS = 10 * 60 * 1000;
  private static GLOBAL_MAX = 60;

  /** Seconds to rest, or 0 when the gate listens. */
  rest(source: string, now = Date.now()): number {
    this.recent = this.recent.filter((t) => now - t < Gatekeeper.GLOBAL_WINDOW_MS);
    if (this.recent.length >= Gatekeeper.GLOBAL_MAX) return Math.ceil((Gatekeeper.GLOBAL_WINDOW_MS - (now - this.recent[0])) / 1000);
    const s = this.bySource.get(source);
    return s && s.until > now ? Math.ceil((s.until - now) / 1000) : 0;
  }

  refused(source: string, now = Date.now()): number {
    this.recent.push(now);
    const s = this.bySource.get(source) ?? { fails: 0, until: 0 };
    s.fails += 1;
    if (s.fails > Gatekeeper.FREE) s.until = now + Math.min(1000 * 2 ** (s.fails - Gatekeeper.FREE), Gatekeeper.MAX_REST_MS);
    this.bySource.set(source, s);
    return this.rest(source, now);
  }

  received(source: string) {
    this.bySource.delete(source);
  }
}
