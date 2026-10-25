import { useEffect } from "react";

/* The library navbar renders outside the page, so the page's picked accent
   reaches its menu eye through a root variable (see library.css). */
export function useNavEyeAccent(accent: string | undefined) {
  useEffect(() => {
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty("--lib-nav-eye", accent);
    return () => {
      root.style.removeProperty("--lib-nav-eye");
    };
  }, [accent]);
}
