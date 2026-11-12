/* Private storage: outside every repo and served dir. Atomic writes
   (temp + rename); the record is append-only, one file per sealed state,
   created exclusively so two processes can never seal the same entry. */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Canon } from "../../src/sanctum/model/validate.ts";
import type { RecordEntry, SanctumState, VisionFiles } from "../../src/sanctum/model/types.ts";

export const DEFAULT_DIR = "/root/.evoview-sanctum";

export function dataDir(): string {
  return process.env.EVOVIEW_SANCTUM_DIR || DEFAULT_DIR;
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

export function writeAtomic(file: string, content: string | Buffer, mode = 0o600) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  fs.writeFileSync(tmp, content, { mode });
  fs.renameSync(tmp, file);
}

export function readJson<T>(file: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export class MovedError extends Error {}

interface HistoryFile {
  entry: RecordEntry;
  state: SanctumState;
}

export class Store {
  readonly dir: string;
  private cache?: { mtime: number; state: SanctumState };
  private canonCache?: Canon;

  constructor(dir = dataDir()) {
    this.dir = dir;
  }

  get statePath() {
    return path.join(this.dir, "state", "current.json");
  }
  get historyDir() {
    return path.join(this.dir, "state", "history");
  }
  get canonPath() {
    return path.join(this.dir, "seed", "canon.json");
  }
  visionDir(id: string) {
    return path.join(this.dir, "visions", id);
  }

  exists(): boolean {
    return fs.existsSync(this.statePath);
  }

  private historyVersions(): number[] {
    try {
      return fs
        .readdirSync(this.historyDir)
        .map((f) => /^(\d+)\.json$/.exec(f)?.[1])
        .filter((v): v is string => Boolean(v))
        .map(Number)
        .sort((a, b) => a - b);
    } catch {
      return [];
    }
  }

  current(): SanctumState {
    const stat = fs.statSync(this.statePath);
    let state = this.cache && this.cache.mtime === stat.mtimeMs ? this.cache.state : readJson<SanctumState>(this.statePath);
    if (!state) throw new Error("state unreadable");
    /* A seal that wrote its record entry but not current.json heals here. */
    const latest = this.historyVersions().at(-1);
    if (latest && latest > state.meta.version) {
      const h = readJson<HistoryFile>(path.join(this.historyDir, `${latest}.json`));
      if (h) {
        state = h.state;
        writeAtomic(this.statePath, JSON.stringify(state, null, 2));
      }
    }
    this.cache = { mtime: fs.statSync(this.statePath).mtimeMs, state };
    return JSON.parse(JSON.stringify(state)) as SanctumState;
  }

  canon(): Canon {
    if (!this.canonCache) {
      const canon = readJson<Canon>(this.canonPath);
      if (!canon) throw new Error("canon unreadable");
      this.canonCache = canon;
    }
    return this.canonCache;
  }

  record(): RecordEntry[] {
    return this.historyVersions()
      .reverse()
      .map((v) => readJson<HistoryFile>(path.join(this.historyDir, `${v}.json`))?.entry)
      .filter((e): e is RecordEntry => Boolean(e));
  }

  at(version: number): HistoryFile | undefined {
    if (!Number.isInteger(version) || version < 1) return undefined;
    return readJson<HistoryFile>(path.join(this.historyDir, `${version}.json`));
  }

  /** Appends `state` to the record and makes it current. */
  seal(state: SanctumState, entry: RecordEntry) {
    ensureDir(this.historyDir);
    const file = path.join(this.historyDir, `${entry.version}.json`);
    const tmp = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ entry, state } satisfies HistoryFile, null, 2), { mode: 0o600 });
    try {
      fs.linkSync(tmp, file);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") throw new MovedError();
      throw err;
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    writeAtomic(this.statePath, JSON.stringify(state, null, 2));
    this.cache = undefined;
  }

  /** Trusted tools only (seed, merges): replaces the canon. */
  writeCanon(canon: Canon) {
    writeAtomic(this.canonPath, JSON.stringify(canon, null, 2));
    this.canonCache = undefined;
  }

  visionFiles(id: string): VisionFiles | undefined {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return undefined;
    return readJson<VisionFiles>(path.join(this.visionDir(id), "meta.json"));
  }
}
