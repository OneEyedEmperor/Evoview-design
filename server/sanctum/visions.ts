/* Visions: the original is kept, widths are derived in avif and webp, a
   tone and a tiny veil are measured. Files never change once written, and
   are never deleted (the record may restore any state that names them). */

import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { VisionFiles, VisionFormat } from "../../src/sanctum/model/types.ts";
import { ensureDir, writeAtomic } from "./store.ts";

const run = promisify(execFile);
/* ImageMagick's avif path spins in system time when it may use every core. */
const ENV = { ...process.env, MAGICK_THREAD_LIMIT: "1", OMP_NUM_THREADS: "1" };
const WIDTHS = [480, 960, 1440, 1920, 2560];
const MAX_SIDE = 12000;
export const FORMATS: VisionFormat[] = ["avif", "webp"];

export type Picture = "png" | "jpg" | "webp";

export function sniff(head: Buffer): Picture | undefined {
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpg";
  if (head.length >= 12 && head.toString("latin1", 0, 4) === "RIFF" && head.toString("latin1", 8, 12) === "WEBP") return "webp";
  return undefined;
}

export const newVisionId = () => `v-${crypto.randomBytes(5).toString("hex")}`;

async function measure(src: string): Promise<{ width: number; height: number }> {
  const { stdout } = await run("identify", ["-format", "%w %h\n", `${src}[0]`], { env: ENV });
  const [w, h] = stdout.trim().split("\n")[0].split(" ").map(Number);
  return { width: w, height: h };
}

/** Derives a vision from a picture file into `<dir>/visions/<id>/`; a refused picture leaves nothing behind. */
export async function deriveVision(dataDirPath: string, id: string, src: string, kind: Picture): Promise<VisionFiles> {
  const out = path.join(dataDirPath, "visions", id);
  const fresh = !fs.existsSync(out);
  ensureDir(out);
  try {
    return await derive(out, id, src, kind);
  } catch (err) {
    if (fresh) fs.rmSync(out, { recursive: true, force: true });
    throw err;
  }
}

async function derive(out: string, id: string, src: string, kind: Picture): Promise<VisionFiles> {
  const { width, height } = await measure(src);
  if (!(width > 0 && height > 0) || width > MAX_SIDE || height > MAX_SIDE) throw new VisionRefusal("This picture cannot be held as a vision.");
  const original = path.join(out, `original.${kind}`);
  fs.copyFileSync(src, original);
  const top = Math.min(width, WIDTHS.at(-1)!);
  const sizes = [...new Set([...WIDTHS.filter((w) => w < top), top])].sort((a, b) => a - b);
  for (const w of sizes) {
    await run("cwebp", ["-quiet", "-q", "80", "-resize", String(w), "0", "-metadata", "none", original, "-o", path.join(out, `${w}.webp`)], { env: ENV });
    await run("convert", [`${original}[0]`, "-resize", `${w}x`, "-strip", "-quality", "50", path.join(out, `${w}.avif`)], { env: ENV });
  }
  const tone = (await run("convert", [`${original}[0]`, "-resize", "1x1!", "-format", "%[hex:u.p{0,0}]", "info:"], { env: ENV })).stdout.trim().slice(0, 6);
  const veil = await run("convert", [`${original}[0]`, "-resize", "16x", "-strip", "-quality", "40", "webp:-"], { env: ENV, encoding: "buffer" });
  const files: VisionFiles = {
    id,
    width,
    height,
    sizes,
    formats: FORMATS,
    tone: `#${tone.toLowerCase().padEnd(6, "0")}`,
    placeholder: `data:image/webp;base64,${(veil.stdout as Buffer).toString("base64")}`,
    broughtAt: new Date().toISOString(),
  };
  writeAtomic(path.join(out, "meta.json"), JSON.stringify(files, null, 2));
  return files;
}

export class VisionRefusal extends Error {}
