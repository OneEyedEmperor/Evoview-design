/* Thin calls to the sanctum endpoints. A 401 anywhere means "not entered". */

import type { ChangeRequest, ChangeResponse, RecordEntry, SanctumState, SessionResponse, VisionFiles, VisionFormat } from "../model/types";

const BASE = "/sanctum-api";

export class NotEntered extends Error {}

/** A refusal from the endpoints that is not a change refusal. */
export class Refused extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init: RequestInit = {}, allow: number[] = []): Promise<{ status: number; body: T }> {
  const write = init.method && init.method !== "GET";
  const res = await fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: { ...(write ? { "X-Sanctum": "1" } : {}), ...(init.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (res.ok || allow.includes(res.status)) return { status: res.status, body };
  if (res.status === 401) throw new NotEntered();
  throw new Refused(res.status, body?.message ?? "The sanctum could not answer.");
}

const json = (method: string, value: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

export const api = {
  async session(): Promise<SessionResponse> {
    return (await call<SessionResponse>("/session")).body;
  },
  async enter(watchword: string): Promise<SessionResponse> {
    return (await call<SessionResponse>("/session", json("POST", { watchword }), [401, 429])).body;
  },
  async leave(): Promise<void> {
    await call("/session", { method: "DELETE" });
  },
  async map(): Promise<SanctumState> {
    return (await call<SanctumState>("/map")).body;
  },
  async change(request: ChangeRequest): Promise<ChangeResponse> {
    return (await call<ChangeResponse>("/changes", json("POST", request), [409, 422])).body;
  },
  async record(): Promise<RecordEntry[]> {
    return (await call<{ entries: RecordEntry[] }>("/record")).body.entries;
  },
  async recordAt(version: number): Promise<SanctumState> {
    return (await call<SanctumState>(`/record/${version}`)).body;
  },
  async restore(version: number, baseVersion: number, dryRun = false): Promise<ChangeResponse> {
    return (await call<ChangeResponse>("/restore", json("POST", { version, baseVersion, dryRun }), [409, 422])).body;
  },
  async bringVision(picture: Blob): Promise<VisionFiles> {
    const type = picture.type || "image/png";
    return (await call<{ files: VisionFiles }>("/visions", { method: "POST", headers: { "Content-Type": type }, body: picture })).body.files;
  },
};

export const visionUrl = (id: string, width: number, format: VisionFormat) => `${BASE}/visions/${id}/${width}.${format}`;

export const visionSrcSet = (files: Pick<VisionFiles, "id" | "sizes">, format: VisionFormat) =>
  files.sizes.map((w) => `${visionUrl(files.id, w, format)} ${w}w`).join(", ");
