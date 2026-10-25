import type { CSSProperties } from "react";

/* A static method eye whose iris takes `--lib-iris`: the artwork is split
   into its white strokes (`-rest`) and an iris alpha mask (`-iris`). */
export default function EyeMark({ artwork, className }: { artwork: 2 | 3 | 4; className?: string }) {
  return (
    <span
      className={className ? `lib-eyemark ${className}` : "lib-eyemark"}
      style={{ "--lib-iris-mask": `url(/library/hero/eye-${artwork}-iris.png)` } as CSSProperties}
      aria-hidden="true"
    >
      <img src={`/library/hero/eye-${artwork}-rest.png`} alt="" width={440} height={320} decoding="async" draggable={false} />
      <span className="lib-eyemark__iris" />
    </span>
  );
}
