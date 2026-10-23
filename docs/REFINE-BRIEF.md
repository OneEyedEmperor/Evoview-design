# Refinement pass — shared brief

The founder reviewed the library after the first build. Verdict: it looks like a
real library and most pages are aesthetically good, but:

> there are still inconsistencies, i noticed multiple bugs, some hallucinations
> like the 3 card method phase that serves no point, modal dossier pages only
> loading something half of the time, chapter page a bit hard to understand,
> also "bloc de récit" page looks very much ai generated too many separating
> lines — it's clearly written in the evoview architecture skill that using
> separating lines to segment content is cheap. we need a full refinement pass.

You own one package (or the shell) for this pass. Goal: make it correct,
purposeful and unmistakably designed — not just "passing checks".

## Read first
`CLAUDE.md`, `docs/RULES.md` (**updated**: §3 spacing is the separator —
hairlines only as information; §12 showcase pages must teach),
`docs/SHOWCASE-CONTRACT.md`, `/root/.vibehub/projects/evoview/skills/evoview-architecture/SKILL.md`,
your package README/CHANGELOG, and the extraction file your package came from.

## Do, in order
1. **Look before you touch.** Open your page on `https://evoview-library.said.bet`
   with agent-browser at 1440, 1024 and 390, take screenshots, and actually
   *look at them* (Read the PNG). Critique it as Evoview's art director would:
   what is the primary subject of each scene, what is noise, what looks
   generated rather than designed. Write the critique down before fixing.
2. **Hunt bugs for real.** Reload the page cold at least 10 times, navigate to
   it from another route via the navbar, switch FR/EN, click palette swatches,
   resize, scroll fast, open/close every interactive state. Anything that
   works "most of the time" is a bug: find the root cause (StrictMode double
   effects, lazy-route timing, media cache, observers attached before layout,
   stale closures, keyed remounts), fix it, prove it with repeated runs.
3. **Delete hallucinations.** Every variant, element, label, readout and line
   must trace to a client job or to the extraction evidence. Remove variants
   that repeat a configuration with less content, invented features, spec
   readouts sprinkled over demos, "fictional example" strips, decorative
   indices that index nothing.
4. **Remove line segmentation.** Replace rule-separated rows/chapters/columns/
   results/captions with spacing, scale, alignment and tone. Keep a line only
   when it is information (progress, timeline, a chapter strip underline).
5. **Make the page teach** (RULES §12): first viewport says what it is and what
   to look at; variants are real client choices; minimal annotation.
6. **Consistency with the other pages:** same `ShowcasePage` usage, same rhythm
   between demo chapters, same type roles, same caption voice, same accent
   behaviour. If you see a cross-page inconsistency outside your scope, report it.

## Rules
- `pnpm build` green. Verify at 1440 / 1024 / 390; palette (yellow, near-white,
  indigo) recolours live; FR/EN; no horizontal overflow; floors respected.
- Bump your package version (patch for fixes, minor if the API/visual
  contract changes) + CHANGELOG (list config changes explicitly); update
  README/SKILL if behaviour changed.
- Seven other agents work concurrently, each on its own package. Commit only
  your paths (`git add <paths>`; never `-A`, never reset/stash/checkout others'
  files). Don't edit `CLAUDE.md`, `docs/*`, or packages you don't own; if you
  need a change in `foundation`/`controls` (owned by the controls agent this
  pass) or `src/library/*` (shell agent), report it in your reply, work around
  locally if trivial.
- Don't use the Gaegu/eye/REC/CRT motifs. Don't claim visual verification you
  didn't do.

## Reply
Your critique (short), bugs found with root causes, what you removed and why,
what changed visually, before/after screenshot paths
(`~/.vibehub/documents/evoview-library/refine/<name>-{before,after}-{1440,390}.png`),
version, anything unverified, cross-page issues you noticed.
