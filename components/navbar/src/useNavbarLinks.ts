import { useEffect } from "react";

/* The deck renders plain `<a href>` so it works without a router and under
   server rendering. On a client-routed site, hand internal clicks to the
   router with this hook: `useNavbarLinks((href) => navigate(href))`.
   Modified clicks, external hrefs and `target="_blank"` are left alone; a
   same-URL click with a hash scrolls to it, without a hash scrolls to top. */

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

export function useNavbarLinks(navigate: (to: string) => void) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(".ev-navbar a[href]");
      if (!anchor || anchor.target === "_blank") return;
      const href = anchor.getAttribute("href") ?? "";
      if (!isInternal(href)) return;
      event.preventDefault();

      const url = new URL(href, window.location.origin);
      const target = url.pathname + url.search + url.hash;
      if (target === window.location.pathname + window.location.search + window.location.hash) {
        if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0 });
        return;
      }
      navigate(target);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}
