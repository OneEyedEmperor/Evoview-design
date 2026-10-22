import type { CSSProperties } from "react";
import inner from "./evoview-mark-inner.txt?raw";

/* Inline Evoview wordmark (black artwork; `.ev-attribution` inverts it on dark tones). */
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
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
