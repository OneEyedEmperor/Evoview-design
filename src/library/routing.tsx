import { Component, lazy, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ErrorInfo, type LazyExoticComponent, type ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useLibraryLocale } from "./locale";

type Loader = () => Promise<{ default: ComponentType }>;
export type LazyPage = LazyExoticComponent<ComponentType> & { preload: () => Promise<unknown> };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* React.lazy caches a rejected import forever, so one failed chunk request
   (dev server mid-edit, flaky network) would leave the route broken until a
   reload. The loader is shared with `preload` and retried once. */
export function lazyPage(load: Loader): LazyPage {
  let pending: Promise<{ default: ComponentType }> | null = null;
  const attempt = () => {
    pending ??= load()
      .catch(() => wait(700).then(load))
      .catch((error) => {
        pending = null;
        throw error;
      });
    return pending;
  };
  return Object.assign(lazy(attempt), { preload: attempt });
}

/* Warm every route chunk once the first page is idle, so client navigation
   never waits on a cold import. */
export function usePreloadPages(pages: LazyPage[]) {
  useEffect(() => {
    if (window.self !== window.top) return; // a preview frame needs only its own route
    const run = () => pages.reduce<Promise<unknown>>((chain, page) => chain.then(() => page.preload().catch(() => undefined)), Promise.resolve());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 1200);
    return () => clearTimeout(id);
  }, [pages]);
}

const COPY = {
  fr: { loading: "Chargement", failed: "Cette page n'a pas pu se charger.", retry: "Réessayer" },
  en: { loading: "Loading", failed: "This page could not load.", retry: "Try again" },
};

/* Suspense fallback: silent for a 350 ms grace (most chunks arrive first),
   then a quiet status line. Same environment as the frame header so the
   arrival of the page is a fill, not a flash. */
export function RoutePending() {
  const { locale } = useLibraryLocale();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 350);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="lib-pending lib-toned ev-library" data-tone="dark" data-nav-tone="dark" aria-busy="true">
      <div className="lib-rail">
        {shown && (
          <p className="lib-pending__status lib-voice-state" role="status">
            <span className="lib-pending__bar" aria-hidden="true" />
            {COPY[locale].loading}
          </p>
        )}
      </div>
    </div>
  );
}

function RouteFailed({ onRetry }: { onRetry: () => void }) {
  const { locale } = useLibraryLocale();
  const copy = COPY[locale];
  return (
    <div className="lib-pending lib-pending--failed lib-toned ev-library" data-tone="dark" data-nav-tone="dark" role="alert">
      <div className="lib-rail lib-pending__failed">
        <p className="lib-body">{copy.failed}</p>
        <button type="button" className="lib-command lib-command--quiet" onClick={onRetry}>
          {copy.retry}
        </button>
      </div>
    </div>
  );
}

type BoundaryProps = { resetKey: string; children: ReactNode };

/* A page that throws (or a chunk that never arrives) shows an honest retry
   instead of unmounting the whole app. Resets on route change. */
export class RouteBoundary extends Component<BoundaryProps, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: { error: Error | null; key: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[library] route failed", error, info.componentStack);
  }

  render() {
    if (this.state.error) return <RouteFailed onRetry={() => window.location.reload()} />;
    return this.props.children;
  }
}

/* Category routes land on the index, scrolled to their chapter. */
export const CHAPTER_ROUTES: Record<string, string> = { "/layouts": "layouts", "/components": "components" };

const findTarget = (pathname: string, hash: string) => {
  const chapter = CHAPTER_ROUTES[pathname.replace(/\/+$/, "")];
  const id = chapter ?? (hash ? decodeURIComponent(hash.slice(1)) : "");
  return id ? document.getElementById(id) : null;
};

/* New pages open at the top; a hash or a category route scrolls to its
   target, waiting for a lazy page to mount it and re-aligning once layout
   settles. Back/forward keep the browser's own restoration. A click on the
   current category pill (the navbar only scrolls to top on same-URL clicks)
   still lands on its chapter. */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const action = useNavigationType();
  // Per location key, so a StrictMode re-run reaches the same decision.
  const seen = useRef<{ key: string; pathname: string; samePage: boolean; first: boolean } | null>(null);

  useLayoutEffect(() => {
    if (seen.current?.key !== key) {
      seen.current = { key, pathname, samePage: seen.current?.pathname === pathname, first: seen.current === null };
    }
    const { samePage, first } = seen.current;
    // Back/forward: the browser restores. The first load is also a POP, but
    // a deep link into a lazy page needs the wait below.
    if (action === "POP" && !first) return;
    const wantsTarget = Boolean(hash) || pathname.replace(/\/+$/, "") in CHAPTER_ROUTES;
    if (!wantsTarget) {
      if (!samePage && !first) window.scrollTo(0, 0);
      return;
    }
    // An in-page hash with no target leaves the reader where they are.
    if (samePage && hash && !findTarget(pathname, hash)) return;
    let frame = 0;
    let settle = 0;
    const started = performance.now();
    const seek = () => {
      const target = findTarget(pathname, hash);
      if (target) {
        target.scrollIntoView({ block: "start" });
        settle = window.setTimeout(() => findTarget(pathname, hash)?.scrollIntoView({ block: "start" }), 600);
      } else if (performance.now() - started < 6000) {
        frame = requestAnimationFrame(seek);
      }
    };
    if (!samePage && !first) window.scrollTo(0, 0);
    seek();
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [pathname, hash, key, action]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event.composedPath().find((n): n is HTMLAnchorElement => n instanceof HTMLAnchorElement);
      const href = anchor?.getAttribute("href");
      if (!href || !(href in CHAPTER_ROUTES) || href !== window.location.pathname.replace(/\/+$/, "")) return;
      requestAnimationFrame(() => document.getElementById(CHAPTER_ROUTES[href])?.scrollIntoView({ block: "start", behavior: "smooth" }));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
