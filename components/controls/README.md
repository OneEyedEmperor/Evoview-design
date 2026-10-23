# controls — the Evoview control language

Actions, choices, fields and progress as neutral React pieces, driven by the
client's accent. The same anatomy as `components/reservation` (option rows,
chips with numbered orbs, white plate with arrow orb, underline fields,
segmented progress), generalised so every package and client page speaks one
control language. Depends on `foundation`.

Showcase: `https://evoview-library.said.bet/components/controls` (one
restaurant client: commands over a portal image, choices, a request form, a
timed sequence under the pause model, a booking flow on paper; live accent
palette). `StepMark` and `Badge` are not on the page; see the API table.

## What is Evoview (protected)

Read `STRATEGY.md`. These choices make the controls recognisably Evoview and
must not be restyled to a client's UI kit:

- **Two action weights only**: the primary plate (white on dark / ink on
  light, Montserrat 700 14px sentence case, round orb with an arrow, hover
  fills with the accent and the orb inverts and slides 3px, press .985) and
  the text action (Satoshi readout + icon, 44px). One primary per screen.
- **Radius by role**: commands rectangular (`--ev-radius-control`), choosable
  tokens pills, selectable rows the surface radius, tags 8, badges 4, marks
  round. Never a pill around copy.
- **Selection is multi-signal**: accent border + 14 % tint + filled mark with
  a check (index → check) + `aria-checked` / `aria-pressed` / `aria-current`.
  Never colour alone; light accents stay visible through `--controls-signal`.
- **Indexed everything**: chips and rows carry `01…` marks, steps carry
  numerals, counters read `2 sur 3`.
- **Underline fields**: no boxes, 9px readout label, 16px value, accent
  underline on focus, error underline + message.
- **Segmented progress**: equal cells, the current one charges in the
  foreground colour, completed ones take the accent, `aria-current="step"`.
- **Glass belongs to chrome**: close and pager only.

**Accent = the client's**, read from the host `--primary` (fill) and
`--primary-foreground` (ink on fills); Evoview indigo `#818cf8` is only the
fallback. Signal strokes are derived per tone (`--controls-signal`), blooms
from `--controls-accent-deep`. Override per subtree by setting `--primary`.

**Attribution**: controls carry no Evoview mark. The approved mark lives in
each host component's header strip (`EvoviewMark` from `foundation`); never
put it inside or next to a client CTA built with these controls.

**Motion**: one full-motion experience, no reduced-motion branch. Every
control has a complete stable state; a progress `clock` comes from
`useSequenceClock` and pauses with the pause model.

Client-adaptable: labels (`controls.config.tsx`), accent, tone, content.

## Files

| File | Role | Edit per site? |
| --- | --- | --- |
| `src/controls.config.tsx` | Default labels FR / EN (close, previous, next, optional, counters, step statuses). | **yes — the only one** |
| `src/Commands.tsx` | `PrimaryPlate`, `GhostAction`, `GlassClose`, `PagerOrb` | no |
| `src/Choices.tsx` | `OptionChip`, `ChipGroup`, `OptionRow`, `OptionRows`, `CheckOrb`, `StepMark`, `Tag`, `Badge` | no |
| `src/Fields.tsx` | `UnderlineField`, `FieldGrid`, `Switch`, `SegmentedControl` | no |
| `src/Progress.tsx` | `SegmentedProgress` | no |
| `src/copy.tsx` | `ControlsProvider`, `useControlsCopy` | no |
| `src/controls.css` | Token block `.ev-controls`, element classes `evc-*` | no |

`showcase.css` is the library page's sheet; not installed.

## Install

```bash
/root/.vibehub/projects/evoview-design-library/components/controls/install.sh /root/.vibehub/projects/<client>
```

Installs / upgrades `foundation` first, then copies `src/` to
`<client>/src/components/controls/`; re-runs keep `controls.config.tsx`.

```tsx
import { PrimaryPlate, ChipGroup, ControlsProvider, buildControlsConfig } from "@/components/controls";
<ControlsProvider config={buildControlsConfig(locale)}>…</ControlsProvider> // optional; default locale in the config
<section className="ev-tone-dark">…</section>                                // tone: dark (default) | light | paper
```

Other library packages import `../controls` (and add the
`components/<name>/controls -> ../controls/src` symlink, like `foundation`).

## API

Every control root carries `ev-controls`; pass `className` to extend.

| Export | Props (beyond the native element's) |
| --- | --- |
| `PrimaryPlate` | `children`, `icon?` (arrow), `size?: "md" 54 \| "lg" 64`, `block?`, `busy?` (spinner, aria-busy, locale `busy` label in the accessible name, clicks ignored), `href?` → `<a>`, `ref` (button / anchor) |
| `GhostAction` | `children`, `icon?`, `iconPosition?: "start" \| "end"`, `href?` → `<a>`, `ref` |
| `GlassClose` | `label?` (locale "Fermer"), `showLabel?` (`× FERMER`), `ref: Ref<HTMLButtonElement>` (initial modal focus) |
| `PagerOrb` | `direction: "prev" \| "next"`, `label?` (name the target), `ref` |
| `OptionChip` | `selected?`, `index?` (number padded; omitted = empty ring), `size?: "md" 48 \| "lg" 58`, `ref`; toggle (`aria-pressed`) unless `role="radio"` |
| `ChipGroup` | `options: ChoiceOption[]`, `label`, `numbered?`, `size?`, single: `value: string \| null`, `onChange(value)`; multi: `multiple`, `value: string[]`, `onChange(values)`, `max?` (counter ticks, extra options locked) |
| `OptionRow` | `selected?`, `index?`, `icon?` (28px, keeps its colours), `label`, `hint?`, `ref` |
| `OptionRows` | as `ChipGroup` (no size) |
| `ChoiceOption` | `{ value, label, index?, hint?, icon?, disabled? }` |
| `CheckOrb` | `checked` |
| `StepMark` | `index`, `state?: "idle" \| "current" \| "done"`, `size?: "sm" 24 \| "md" 34`, `label?` (else decorative) |
| `Tag` | `tone?: "neutral" \| "accent"`, `dot?` |
| `Badge` | `tone?: "accent" \| "neutral"` |
| `UnderlineField` | `label`, `optional?`, `required?` (`*` + spoken), `error?`, `hint?`, `wide?`, `multiline?` (textarea), `ref`, input / textarea attributes |
| `FieldGrid` | one column, two from a 560px-wide container; `wide` fields span |
| `Switch` | `checked`, `onCheckedChange`, `label`, `description?`, `disabled?`, `id?`, `ref` — the whole row is the switch |
| `SegmentedControl` | `options: { value, label }[]`, `value`, `onChange`, `label`, `block?`. Thumb = accent pulled a quarter toward the signal, plus a signal ring: reads on paper with near-white / yellow accents. |
| `SegmentedProgress` | `count`, `current` (0-based), `label`, `labels?`, `isComplete?(i)`, `size?: "sm" 3px \| "lg" 6px shell`, `fill?` 0–1 (default 1: current cell full) or `clock?` (from `useSequenceClock`), `onSelect?(i)` + `canSelect?(i)` (buttons, 44px hit), `captions?` (hidden < 520px): `true` / `"all"` every label · `"complete"` a caption locks on when its cell completes · `(i, state) => ReactNode \| null` (`null` = empty slot, height kept) |
| `rovingKeyDown(e, select(index, item), itemSelector = "[data-evc-item]")` | Roving-tabindex radiogroup keys for a custom group's `onKeyDown`: arrows (wrap) / Home / End move focus over enabled items and select; `index` counts all matched items. |
| `ControlsProvider`, `useControlsCopy`, `buildControlsConfig(locale)` | labels |

Keyboard: single-choice groups and the segmented control are radiogroups
(one tab stop, arrows / Home / End move and select); multi chips, rows,
switches and buttons are native buttons (Tab, Space / Enter). Touch targets
≥ 44px everywhere (progress cells through an invisible hit area). Hover
styles only on `(hover: hover)`.

## Verification

1. Showcase at 1440 and 390: no horizontal overflow, nothing below 9px.
2. Palette: default off-white, indigo, yellow — selection on chips, rows,
   switch, segmented, progress, step marks readable on the dark sheet and the
   paper band.
3. Keyboard: Tab order, radiogroup arrows, Space on switch / multi chips,
   max-3 locks the rest and unlocks on deselect, progress jumps.
4. Hover (fine pointer): plate fills with the accent, orb inverts and slides;
   press scales .985; no stuck hover after a tap.
5. Timed instrument: runs on screen, pauses off-screen / hidden tab / hover,
   resumes with the remaining time.
