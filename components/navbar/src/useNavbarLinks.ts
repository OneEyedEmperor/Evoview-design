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
      // The dispatch path, not `closest()`: closing the menu can unmount the
      // clicked tray entry before the click bubbles up to the document.
      const path = event.composedPath();
      if (!path.some((node) => node instanceof Element && node.classList.contains("ev-navbar"))) return;
      const anchor = path.find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement && node.hasAttribute("href"));
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
