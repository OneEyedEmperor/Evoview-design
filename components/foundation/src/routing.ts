import { useEffect, useRef } from "react";

/* Crawlable modals (docs/CRAWLABLE-MODALS.md): every view of a modal package
   has a URL, and the modal keeps browser history in step with it. Push when
   going one level deeper, replace when moving sideways, Back when going up,
   Back past every level on close; a page loaded on a view URL seeds the page
   URL beneath it. Router-agnostic: plain `window.history`. */

/** What a routable modal package exports for its views: pure functions of the config, safe on the server. */
export type ModalRoutes<C, V> = {
  /** Every view of a config, in on-screen order (prerender, sitemap, directory links). */
  views: (config: C) => V[];
  /** The view one level up; null for a top-level view (going up from it closes the modal). */
  parent: (view: V) => V | null;
  /** Stable URL-safe id of a view, `/`-separated ids (`table/tasting`): the default slug path and the equality key. */
  key: (view: V) => string;
  /** Inverse of `key` for a config; null when the key names no view. */
  parse: (config: C, key: string) => V | null;
  /** Head data of a view. Data only: the client renders `<title>`, meta and JSON-LD from it. */
  head: (config: C, view: V) => ViewHead;
};

export type ViewHead = {
  /** The view's title; contains its h1 text. No site suffix (the client adds it). */
  title: string;
  /** From the view's own copy, ≤ 160 characters, cut on a word. */
  description: string;
  /** Names from the top-level view down to this one (length = level); the client prepends its page crumbs. */
  breadcrumb: string[];
  /** Representative image (og:image, JSON-LD `image`). */
  image?: { src: string; alt: string };
};

/** Props of every routable modal package (merged into its own props). */
export type RouteViewProps<V> = {
  /** Open view, null when closed. Controlled. */
  view: V | null;
  /** Every navigation the modal asks for, and every Back / Forward it reports. The host sets `view` to it. */
  onNavigate: (view: V | null) => void;
  /** Public URL of a view; `null` → URL of the page under the modal. Omitted: no URLs (history entries keep the current URL, controls stay buttons). */
  hrefFor?: (view: V | null) => string;
  /** Default true. False: the modal writes no history; a host router owns it and maps `onNavigate` to its own navigations. */
  history?: boolean;
};

/** The default URL scheme: `<base>/<key>/` per view, `base` itself for the page. */
export function routeHrefs<V>(base: string, key: (view: V) => string): (view: V | null) => string {
  const root = base.replace(/\/+$/, "");
  return (view) => (view === null ? base : `${root}/${key(view)}/`);
}

/** Inverse of `routeHrefs`: the view a pathname names under `base`. `null`: the page itself or no such view; `undefined`: outside `base`. */
export function viewFromPath<C, V>(pathname: string, base: string, routes: Pick<ModalRoutes<C, V>, "parse">, config: C): V | null | undefined {
  const root = normPath(base);
  const path = normPath(pathname);
  if (path === root) return null;
  const prefix = root === "/" ? "/" : `${root}/`;
  if (!path.startsWith(prefix)) return undefined;
  return routes.parse(config, path.slice(prefix.length));
}

/** Server-HTML fallback for visitors without JavaScript: route-layer entrances shown at rest (inject in a `<noscript><style>`). */
export const ROUTE_LAYER_NOSCRIPT_CSS =
  "[data-ev-route-layer],[data-ev-route-layer] *,[data-ev-route-layer] ::before,[data-ev-route-layer] ::after{animation:none!important;transition:none!important}";

type FollowEvent = { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean; preventDefault: () => void };

/** For a view link's `onClick`: a plain left click runs the in-page `action` instead of loading the URL; modified clicks (new tab / window) keep the native link. */
export function followRouteLink(event: FollowEvent, action: () => void): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  action();
}

/* ─── History ─── */

const STATE_KEY = "evRoute";
/** Back that never produced a popstate (blocked, out of range): settle in place. */
const BACK_FALLBACK_MS = 700;

type Entry<V> = { owner: string; level: number; key: string; view: V };

function normPath(path: string): string {
  let p = path.replace(/[?#].*$/, "");
  try {
    p = decodeURI(p);
  } catch {
    /* keep as is */
  }
  return p.replace(/\/+$/, "") || "/";
}

function hrefPath(href: string): string {
  try {
    return normPath(new URL(href, window.location.href).pathname);
  } catch {
    return normPath(href);
  }
}

function readEntry<V>(): Entry<V> | null {
  const state: unknown = window.history.state;
  const entry = state && typeof state === "object" ? (state as Record<string, unknown>)[STATE_KEY] : null;
  return entry && typeof entry === "object" && typeof (entry as Entry<V>).owner === "string" ? (entry as Entry<V>) : null;
}

function baseState(): Record<string, unknown> {
  const state: unknown = window.history.state;
  if (!state || typeof state !== "object") return {};
  const rest = { ...(state as Record<string, unknown>) };
  delete rest[STATE_KEY];
  return rest;
}

const newOwner = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

type RouteHistoryOptions<V> = {
  /** The view the modal shows (its controlled `view`). */
  view: V | null;
  routes: Pick<ModalRoutes<unknown, V>, "parent" | "key">;
  hrefFor?: (view: V | null) => string;
  /** Called with the view a Back / Forward lands on (null: out of the modal). */
  onNavigate: (view: V | null) => void;
  /** False: write no history at all. */
  history?: boolean;
};

/**
 * Keeps `window.history` in step with a modal's view, from the view alone:
 * the package passes its `view`, `hrefFor`, `onNavigate` and `history` props
 * and never calls `pushState` itself. Each level owns one entry (entry n =
 * level n). Opening pushes the view's ancestry; deeper = push, same level =
 * replace, up = Back (the landing entry is rewritten to the ancestor of the
 * view on screen), close = Back past every level. A page loaded (or routed)
 * on the view's URL first rewrites its own entry to `hrefFor(null)`, so Back
 * and Escape step out to the page. A reload or Forward onto an entry this
 * modal made adopts it. Keep the package mounted while closed: Forward after
 * a close reopens through `onNavigate`.
 */
export function useRouteHistory<V>({ view, routes, hrefFor, onNavigate, history = true }: RouteHistoryOptions<V>): void {
  const live = useRef({ view, routes, hrefFor, onNavigate });
  live.current = { view, routes, hrefFor, onNavigate };
  const owner = useRef<string | null>(null);
  /** Entries this modal owns from the page up to the current one; equals the current level while open. */
  const depth = useRef(0);
  /** The view the current history entry stands for. */
  const applied = useRef<V | null>(null);
  const pending = useRef<{ target: V | null; level: number; timer: number } | null>(null);

  const viewKey = view === null ? null : routes.key(view);

  useEffect(() => {
    if (!history) return;
    const keyOf = (v: V | null) => (v === null ? null : live.current.routes.key(v));
    const chainOf = (v: V) => {
      const chain: V[] = [];
      for (let node: V | null = v; node !== null && chain.length < 16; node = live.current.routes.parent(node)) chain.unshift(node);
      return chain;
    };
    const urlOf = (v: V | null) => {
      const href = live.current.hrefFor?.(v);
      if (href === undefined) return undefined;
      return href.includes("?") || !window.location.search ? href : href + window.location.search;
    };
    const write = (mode: "push" | "replace", v: V | null, level: number) => {
      const state = v === null ? baseState() : { ...baseState(), [STATE_KEY]: { owner: owner.current, level, key: keyOf(v), view: v } };
      if (mode === "push") window.history.pushState(state, "", urlOf(v));
      else window.history.replaceState(state, "", urlOf(v));
    };
    const report = (v: V | null) => {
      if (keyOf(v) !== keyOf(live.current.view)) live.current.onNavigate(v);
    };
    const settle = (target: V | null, level: number) => {
      pending.current = null;
      write("replace", target, level);
      depth.current = level;
      applied.current = target;
    };
    const back = (steps: number, target: V | null, level: number) => {
      if (pending.current) window.clearTimeout(pending.current.timer);
      pending.current = { target, level, timer: window.setTimeout(() => settle(target, level), BACK_FALLBACK_MS) };
      window.history.go(-steps);
    };

    const onPop = () => {
      const entry = readEntry<V>();
      const ours = entry !== null && owner.current !== null && entry.owner === owner.current;
      const wanted = pending.current;
      if (wanted) {
        window.clearTimeout(wanted.timer);
        pending.current = null;
      }
      if (!ours || (wanted && wanted.target === null)) {
        if (ours) write("replace", null, 0);
        depth.current = 0;
        applied.current = null;
        report(null);
        return;
      }
      let target = entry.view;
      if (wanted?.target) target = wanted.target;
      else if (!wanted && applied.current !== null && entry.level < depth.current) {
        // Back: one level up from the view on screen, not the view this entry was made with.
        target = chainOf(applied.current)[entry.level - 1] ?? entry.view;
      }
      if (keyOf(target) !== entry.key) write("replace", target, entry.level);
      depth.current = entry.level;
      applied.current = target;
      report(target);
    };
    window.addEventListener("popstate", onPop);

    // Apply the current view (first run, and every time `view` changes).
    const target = live.current.view;
    const from = applied.current;
    if (keyOf(target) !== keyOf(from)) {
      const entry = readEntry<V>();
      const onOwnEntry = entry !== null && owner.current !== null && entry.owner === owner.current;
      if (target === null) {
        if (onOwnEntry && depth.current > 0) back(depth.current, null, 0);
        else {
          depth.current = 0;
          applied.current = null;
        }
      } else {
        const chain = chainOf(target);
        const level = chain.length;
        const href = live.current.hrefFor?.(target);
        const atViewUrl = href !== undefined && hrefPath(href) === normPath(window.location.pathname);
        if (from === null || !onOwnEntry) {
          if (entry && entry.key === keyOf(target) && entry.level === level && (href === undefined || atViewUrl)) {
            // Reload or Forward onto an entry made by this modal: adopt it.
            owner.current = entry.owner;
          } else {
            owner.current = newOwner();
            if (atViewUrl) write("replace", null, 0);
            chain.forEach((v, i) => write("push", v, i + 1));
          }
          depth.current = level;
          applied.current = target;
        } else if (level > depth.current) {
          if (keyOf(chain[depth.current - 1]) !== keyOf(from)) write("replace", chain[depth.current - 1], depth.current);
          for (let i = depth.current; i < level; i += 1) write("push", chain[i], i + 1);
          depth.current = level;
          applied.current = target;
        } else if (level === depth.current) {
          write("replace", target, level);
          applied.current = target;
        } else {
          back(depth.current - level, target, level);
        }
      }
    }

    return () => window.removeEventListener("popstate", onPop);
  }, [viewKey, history]);

  useEffect(
    () => () => {
      if (pending.current) window.clearTimeout(pending.current.timer);
    },
    [],
  );
}
