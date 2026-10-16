import type { CSSProperties } from "react";
import inner from "./evoview-mark-inner.txt?raw";

/* Inline Evoview wordmark, rendered directly in the DOM so it can't be
   blocked or cached empty. Black artwork: the navbar inverts it on dark. */
export default function EvoviewLogo({ className, style, alt = "Evoview" }: { className?: string; style?: CSSProperties; alt?: string }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="52.2 54.5 655.3 150.7"
      xmlns="http://www.w3.org/2000/svg"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
