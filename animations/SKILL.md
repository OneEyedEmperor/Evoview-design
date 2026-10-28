---
name: evoview-reusable-animation
description: How to design and build reusable, high-quality, performance-first interaction animations for Evoview (library packages and the evoview site), using the liquid fill (OrbFill / TextFill / SurfaceFill, engine liquid.ts) as the reference implementation. Use when asked to build a reusable animation, a transition primitive, a hover / state / icon-switch effect meant to be used in many places, or to roll an animation out across a site. Triggers on "reusable animation", "animation primitive", "like the liquid fill", "eraser effect", "icon switch animation", "hover effect everywhere", "roll out the animation", "animation engine".
---

# Reusable animations, the Evoview way

The liquid fill is the reference: one engine, three shells (orb, text,
button surface), one rule in `docs/RULES.md` §1, rolled out across the
library and the site. Build every new reusable animation the same way.

Reference code (read before writing anything):
- Engine: `components/foundation/src/liquid.ts`
- Shells: `components/foundation/src/{OrbFill,TextFill,SurfaceFill}.tsx`
- Driven externally: `src/library/SeamFlow.tsx` (drives an orb's level from
  another animation through the controller)
- Uses: `components/controls/src/{Commands,Choices,Progress,Fields}.tsx`,
  `components/reservation/src/Reservation.tsx`, `components/dossier/src/*`
- Site copy: `/root/.vibehub/projects/evoview/src/components/liquid/`
  (verbatim port; keep in step with foundation)
- Tools: `animations/tools/scrollbench.js`, `animations/tools/hover-mq.js`

Read `components/foundation/README.md` (motion policy, pause model) and
`docs/RULES.md` first. Respond in English.

## 1. Anatomy of the liquid fill

**Two layers, one owner per pixel.** The element is laid twice: a *dry*
copy (rest state) and a *wet* copy (new state). One `clip-path` polygon is
the liquid surface: the wet copy shows below it, the dry copy above it.
Each point is painted by one layer only, so the rest colour can never bleed
through the anti-aliased edge of the new one. The dry clip sits 3 % lower
than the wet one: the layers overlap under the surface instead of sharing an
edge, which would anti-alias into a hairline.

**Idle costs nothing.** At rest the clips are `none` (full) or
`inset(50%)` (hidden), never a polygon. The rAF loop runs only while the
level moves and stops itself when settled. No intervals, no idle frames.

**Engine apart from React.** `createLiquid(dry, wet, initial, maxAmp)` is
plain TypeScript: a damped spring (ω 11, ζ .75) moves the level, the wave
amplitude follows the pour rate and calms to 0, a phase scrolls the surface.
It writes `style.clipPath` directly each frame. React never re-renders per
frame. It returns a controller `{ to, snap, level, destroy }`, so anything
can drive it: hover, state, or another animation (`SeamFlow` pours the orb
as the seam bar wraps it).

**Triggers in one place.** `bindLiquidHover(host, controller, opts)`:
pointerenter / leave (touch hover ignored), focus-visible, opt-in touch
press, disabled / busy / locked hosts never fill. Every shell reuses it.

**Thin shells.**
- `OrbFill`: two absolute layers inside the orb (inset 0, inherits radius).
- `TextFill`: two copies stacked in one `inline-grid` cell, so wrapping is
  identical. A colour state machine: new colour rises, returning to the
  previous one drains, a third rises over whichever shows. Takes concrete
  colour strings: a CSS variable that changes underneath cannot be animated,
  so pass the resolved value per state.
- `SurfaceFill`: the button's content again, absolutely over the button with
  display / padding / gap / alignment / radius **inherited**, so the copy
  lands exactly on the original; the button itself is the dry layer; a 0.75px
  box-shadow in the fill colour covers the button's anti-aliased rim.

**Contract with the host.** Colours are tokens (`--ev-orb-*`,
`--ev-text-*`, `--ev-surface-*`), set in the host's CSS. The host removes
its CSS `background` / `color` swap; borders, rings, glows, transforms keep
their CSS transitions.

**Server rendering.** The original stays in flow and carries layout and the
accessible name. The aria-hidden copy renders its content only once
hydrated (`useHydrated`), so prerendered HTML holds each text once (checked
on 58 site routes) and hydration matches.

## 2. Rules for a reusable animation

1. **Write the rule first.** One sentence in `docs/RULES.md` that says when
   the animation is mandatory, plus the explicit exclusions (for the fill:
   running text, replaced content, text riding a changing surface, fixed
   states, faint tonal tints). Without exclusions a rollout over-applies.
2. **Engine / binding / shell split.** Engine: pure DOM in, controller out.
   Binding: the triggers. Shells: one per host shape. Never copy an engine
   into a component.
3. **A controller on everything.** `to(target)`, `snap(value)`, `level()`,
   `destroy()`. Retargeting mid-flight must be smooth, from the current
   value, never a restart.
4. **Physics over fixed durations** for state changes (springs retarget
   naturally). Use eased tweens (`easeInOutCubic`, ~1s) only for
   choreographed sequences with a known length.
5. **Reversal is part of the design.** Decide what going back looks like
   (drain, retract, reverse sweep) and test it mid-animation.
6. **One owner per pixel** whenever two states overlap: partition by the
   moving edge, overlap the layers a hair under it, never stack two
   translucent copies.
7. **Tokens, not constants.** Every colour and size the client may adapt is
   a CSS variable with a fallback, set by the host.
8. **No `prefers-reduced-motion` branch** (foundation motion policy): give
   every animation a complete stable end state instead. Looping or ambient
   animation must obey the pause model (`useInViewPause`, hidden document,
   modal suspension); settling transitions stop on their own.
9. **Accessibility.** Copies are `aria-hidden`; the original keeps the name;
   focus-visible gets the same treatment as hover unless the control shows
   focus another way; state is never colour-only.
10. **Fidelity when rolling out.** Keep the old trigger exactly: if a hover
    applied only under `(hover: hover) and (min-width: 1024px)`, gate the new
    one with the same media query.

## 3. Performance rules (non-negotiable)

- Per frame, write only `transform`, `opacity` or a small `clip-path`.
  Never `width / height / top / left / margin`, never `filter`,
  `backdrop-filter` or large `box-shadow`.
- Write the DOM imperatively from rAF. No React state per frame. Skip writes
  when the value hasn't changed.
- Read layout once (mount, `ResizeObserver`), never inside the frame loop.
- Stop the loop when settled. Zero idle work is the bar.
- Pointer events, not `mousemove`; no scroll listeners for hover effects;
  passive listeners when you must listen to scroll / touch.
- Duplicate DOM only where needed, after hydration, and keep a budget:
  count instances per page (the site home runs 89 fills on ~2,100 nodes).
- `will-change` only while animating, removed after.
- Prefer one shared engine instance per element; never one global loop that
  walks every instance every frame.
- Measure on a **production build**, never the dev server:
  `animations/tools/scrollbench.js` (scrolls the page one step per frame,
  reports p50 / p95 / p99 frame time, frames over 25ms, long tasks) on the
  current build vs a baseline (`git worktree add --detach /tmp/x HEAD`,
  symlink `node_modules`, build there). A change ships only if it doesn't
  regress the baseline.

## 4. Pitfalls already paid for

- **Anti-aliased fringe**: a rest disc under a filled layer shows a light
  ring at the edge. Fix: partition (dry above / wet below), not stacking.
- **Hairline at the moving edge**: two layers sharing an edge. Fix: overlap
  the under layer by a few %.
- **SVG unions**: overlapping subpaths in one `<path>` with opposite winding
  punch holes. Use separate elements, or keep consistent orientation.
- **Inline-grid breaks ellipsis**: give the shell a `truncate` mode (grid +
  per-copy `overflow / text-overflow / white-space`).
- **Copy misaligned by a few px**: the host centred its content without
  flex; make the host a flex / grid box so the inherited layout matches.
- **Duplicated text in prerendered HTML**: hidden copies must render after
  hydration.
- **Headless browsers report `(hover: none)`**, so hover-gated code never
  runs in agent-browser. Use `animations/tools/hover-mq.js` as an init
  script (`agent-browser --init-script …/hover-mq.js`) to test hovers.
- **Freezing a frame to inspect it**: trigger, wait N `requestAnimationFrame`s
  inside one `eval`, then `window.requestAnimationFrame = () => 0` and
  screenshot. Reload before the next test (the stub stays).
- **Shared browser**: other agents drive the default agent-browser session;
  use `AGENT_BROWSER_SESSION=<yours>`.
- **Parallel builds in one repo** clobber `dist/`: build to
  `--outDir /tmp/<name>-dist`.

## 5. Recipe

1. Rule + exclusions in `docs/RULES.md`; survey the call sites first.
2. Engine in `components/foundation/src/<name>.ts`: DOM in, controller out.
3. Triggers: reuse `bindLiquidHover` or write a sibling binding.
4. Shells per host shape; tokens for colours; SSR-safe copies.
5. Showcase it where the effect is unmistakable (strong colour, large size)
   before rolling out; subtle states hide whether it works.
6. Roll out package by package: replace CSS swaps, bump versions, changelog
   each behaviour and CSS change, update README + SKILL rules.
7. Verify: production preview at 1440 and 390, freeze mid-animation,
   reversal, disabled / busy states, SSR output, scrollbench vs baseline.
8. Port to the site as a verbatim copy (`src/components/<name>/`), then
   delegate the rollout by file area with a written brief (see the liquid
   rollout brief in `~/.vibehub/documents/briefs/`).

## 6. Built after the liquid fill

**Press jelly** (foundation 1.9.0, RULES §6; `components/foundation/src/jelly.ts`
+ `usePressJelly.ts`). Every clickable pill / button squashes (−7px tall,
+10px wide, capped 11 % / 7 %) while pressed and springs back ringing
like jelly (release ζ .14: ~7 %, 4 %, 3 %, 2 %, 1 % over ~1.5s). Félix
tuned it up twice: half the depth with one 1.4 % overshoot was too subtle,
then three bounces still too damped. Press feedback has to read at a
glance; err on the elastic side. Lessons:
- **Delegated binding for a "everywhere" rollout**: hosts opt in with a
  `data-ev-jelly` attribute, one ref-counted listener set on `document`
  (`usePressJelly()` in each component), an engine created lazily per
  pressed element. No refs threaded through every package.
- **Write the individual `scale` property, not `transform`**: it composes
  with the host's own transforms (hover translate) and their transitions.
  Remove any `:active` scale and any `scale` in the host's `transition`
  (a CSS transition on `scale` smears the per-frame writes).
- **Pick spring constants by target, not by direction**: choosing by
  `target > value` flips back to the stiff press spring during the release
  overshoot and kills the bounce.
- **Hold a tap ≥ 100 ms** so a quick click still reads; keyboard Enter /
  Space press too; `focusout` releases only key presses (a pointer press
  moves focus itself).
- **Sample, don't eyeball**: a probe that dispatches `pointerdown`, logs
  `style.scale` every rAF, then `pointerup` shows overshoot, settle and
  cleanup in numbers.

## 7. Next animations to build with this method

**Eraser icon swap** (`IconErase`, icon state changes: play/pause, +/−,
menu/close, copy/check). The old icon is rubbed out by an eraser stroke and
the new one appears behind it.
- Layers: old icon = dry, new icon = wet, stacked in one grid cell.
- Edge: a vertical-ish band with a rounded, slightly ragged leading edge
  (polygon from a few low-frequency sines + a tiny per-swap random offset),
  swept left → right by a spring; reversal sweeps back.
- Optional crumbs: 3–5 tiny absolutely positioned dots along the edge,
  `transform` + `opacity` only, removed at settle.
- API: `<IconErase k={stateKey}>{icon}</IconErase>`: when `k` changes, the
  current icon becomes dry, the new one wet, sweep 0 → 1, then collapse to a
  single layer. Budget: 2 layers, ≤ 5 crumbs, zero idle cost.

**Ink underline draw** (links): the underline is drawn by a moving pen tip,
`transform: scaleX` on a pseudo element plus a small tip dot, retracted the
way it came; reuse the binding.

**Odometer count** (numbers that change: progress %, counters): each digit
is a column translated with a spring (`transform` only), overshoot ≤ 4 %;
width reserved with tabular numerals so nothing reflows.

**Shutter reveal** (image or panel swap): 5–7 strips with staggered
`clip-path: inset()` closing on the old content and opening on the new;
one controller drives every strip's delay.

For each: write its rule and exclusions, build engine → binding → shells,
showcase it loudly, benchmark it, then roll out.
