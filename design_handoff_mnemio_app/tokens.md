# Tokens — paste-ready diffs

All existing tokens stay. This adds the **vibrant** layer and swaps flat deck swatches for gradient pairs.

---

## 1. Vibrant accent tokens

### `tailwind.config.ts` — extend `theme.colors`
```ts
// inside theme.extend.colors
vib: {
  violet: 'oklch(0.62 0.19 300)',
  blue:   'oklch(0.62 0.15 252)',
  teal:   'oklch(0.68 0.13 175)',
  pink:   'oklch(0.66 0.21 350)',
  amber:  'oklch(0.74 0.14 70)',
  coral:  'oklch(0.65 0.19 25)',
},
```
Use sparingly — covers, weakest-deck bars, accents. Do **not** restyle the page background or primary surfaces with these.

---

## 2. Deck cover gradients — replace `app/utils/coverSwatches.ts`

The current file exports 6 flat plum swatches + a radial sheen. Replace with named gradient pairs (keeps the deterministic `swatchFor` hashing):

```ts
/** Vibrant deck cover gradients (oklch pairs — harmonised L/C, hue varies). */
export const COVER_GRADIENTS = {
  violet: 'linear-gradient(150deg, oklch(0.64 0.20 300), oklch(0.48 0.17 285))',
  blue:   'linear-gradient(150deg, oklch(0.64 0.15 252), oklch(0.46 0.15 262))',
  teal:   'linear-gradient(150deg, oklch(0.70 0.14 175), oklch(0.54 0.13 192))',
  pink:   'linear-gradient(150deg, oklch(0.68 0.21 350), oklch(0.50 0.20 330))',
  amber:  'linear-gradient(150deg, oklch(0.76 0.15 75),  oklch(0.62 0.15 48))',
  coral:  'linear-gradient(150deg, oklch(0.67 0.19 25),  oklch(0.50 0.18 12))',
} as const;

export type CoverKey = keyof typeof COVER_GRADIENTS;
const KEYS = Object.keys(COVER_GRADIENTS) as CoverKey[];

/** Deterministically pick a gradient from a stable key (e.g. deck id). */
export const coverGradientFor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[KEYS[Math.abs(hash) % KEYS.length]];
};
```
Keep a light radial sheen on top for depth:
```css
/* overlay inside CoverArt */
background-image: radial-gradient(120% 90% at 22% 8%, rgba(255,255,255,.18), transparent 60%);
```
> If other code imports `COVER_SWATCHES` / `swatchFor` / `coverGradient`, keep thin shims or update call sites. `CoverArt.vue` is the main consumer.

---

## 3. StatTile tones — extend the `tones` map

`shared/StatTile.vue` currently has `plain | plum | accent`. Add three vibrant tones:

```ts
const tones = {
  plain:  'border-line bg-bg-surface',
  plum:   'border-lavender/60 bg-lavender/20 dark:border-brand-bright/40 dark:bg-brand/25',
  accent: 'border-accent/30 bg-accent/10',
  // NEW:
  blue:  'border-accent-light/45 bg-gradient-to-br from-accent-light/25 to-accent/15',
  green: 'border-success/45 bg-gradient-to-br from-success-bright/25 to-success/15',
  pink:  'border-pink-soft/45 bg-gradient-to-br from-pink-soft/25 to-error-soft/15',
} as const;
```
Value text can take the matching accent (`text-accent-light`, `text-success-bright`, `text-pink-soft`).

Dashboard / Statistics tile assignment: **Due today → plum**, **Reviewed → blue**, **Retention → green**, **Days practiced → pink**.

---

## 4. Rating row colors — `study/RatingRow.vue`

| Button | Border | Background | Text |
|---|---|---|---|
| Forgot/Again | `error` | `error/16` | `#F26D6D` |
| Hard | `vib-amber` | `vib-amber/18` | `oklch(.82 .14 75)` |
| Good | `lavender` | `lavender/24` | `#D9C7F5` |
| Easy | `success` | `success` (filled) | `#2E3613` (dark on green) |

"Easy" is the only **filled** button — it's the happy path and should pop.

---

## 5. Existing tokens (reference — already in the app)

Brand: brand `#572E54` · brand-bright `#7C4576` · lavender `#A98EE3` · accent `#1C73BB` · accent-light `#75B8E2` · success `#A6C261` · success-bright `#C2E083` · pink-soft `#F2BCFF` · error `#EB3D3D` · plum-deep `#2C1A2A`.

RGB-channel surface vars (per `.dark`/`.light`) in `app/assets/css/main.css`: `--c-bg-base/deep/surface/surface-2/well/muted`, `--c-cream`, `--c-brand-muted/pale/light`, `--c-line`, `--c-fc-front/back`. Surfaced as `rgb(var(--x) / <alpha>)` so opacity modifiers work across themes.

Radii: cards 20px · inner 14–18px · flashcard 24px · pills/buttons full. Fonts: Fraunces (display, italic = emphasis), Nunito Sans (body).
