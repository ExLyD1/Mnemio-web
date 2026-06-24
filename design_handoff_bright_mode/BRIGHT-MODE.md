# Mnemio — Bright Mode (light theme) implementation guide for Claude Code

> **Goal:** ship a polished **Bright mode** — the _light_ option in the existing dark/light toggle. Keep Mnemio's plum + lavender identity; make it lighter, airier, and **comfortable to read for hours**. This is the light counterpart to the dark-restyle handoff in `design_handoff_mnemio_app/`.
>
> **Visual source of truth:** `Bright Mode Reference.html` (open it in a browser). Every surface, text tier, accent and component below is rendered there with the exact token values this doc specifies. Match it.
>
> **Stack:** Nuxt 4 · Vue 3 `<script setup lang="ts">` · Pinia · Tailwind (`darkMode: 'class'`) · `@nuxtjs/color-mode`.

---

## TL;DR — what you're actually doing

1. **Replace the `.light` block** in `app/assets/css/main.css` with the palette in §2. (A `.light` block already exists but is muted and untuned — overwrite its values.)
2. **Audit & fix every hardcoded dark value** that does _not_ flip with the tokens — listed file-by-file in §4. This is the bulk of the work.
3. **Verify contrast + the adjacency rule** on every screen (§5–6).

The theme **plumbing already works** — do not rebuild it (see §1). Do **not** touch the dark theme's values.

---

## 1. What already exists (don't rebuild)

- `nuxt.config.ts` → `colorMode: { classSuffix: '', preference: 'dark', fallback: 'dark' }`. Classes `.dark` / `.light` are written to `<html>`. **Bright = the `.light` class.** Leave `preference`/`fallback` on `dark`.
- `app/components/app/Topbar.vue` already has the toggle (`useColorMode()`, `colorMode.preference = … 'light'`). Works as-is.
- `tailwind.config.ts` already maps theme-aware tokens to `rgb(var(--c-…) / <alpha-value>)`. **Anything using `bg-bg-surface`, `text-cream`, `border-line`, `text-brand-muted`, etc. flips automatically when you change the `.light` vars.** Those are _not_ the problem.
- `app/components/study/FlashCard.vue` already observes the `.dark` class in JS and swaps its inline gradient — use it as the reference pattern, just update the light gradient values (§4).

**The problem is everything that bypasses the tokens:** literal hex, `rgba(0,0,0,…)` / `rgba(255,255,255,…)`, `bg-black/*`, hardcoded `text-[#…]`, and `text-cream` used _on a colored surface_. Those were authored for dark-only and will look broken in Bright.

---

## 2. The Bright palette — paste-ready `.light` diff

Overwrite the existing `.light` block in **`app/assets/css/main.css`** with this. Values are space-separated RGB channels (so `rgb(var(--x) / <alpha>)` keeps working). Hex + purpose in comments.

```css
.light {
    color-scheme: light;

    --c-bg-base: 245 242 250; /* #F5F2FA  page — soft lavender white */
    --c-bg-deep: 235 230 244; /* #EBE6F4  sunken pockets / behind cards */
    --c-bg-surface: 255 255 255; /* #FFFFFF  cards, rail — clean white */
    --c-bg-surface-2: 248 245 252; /* #F8F5FC  nested surfaces */
    --c-bg-well: 252 250 254; /* #FCFAFE  input wells (pair with visible border) */
    --c-bg-muted: 224 217 238; /* #E0D9EE  progress tracks / muted chips */

    --c-cream: 45 28 43; /* #2D1C2B  primary text — soft deep plum, ~12.9:1 on white */
    --c-brand-muted: 106 80 110; /* #6A506E  secondary text, ~5.3:1 */
    --c-brand-pale: 90 63 88; /* #5A3F58  tertiary / labels / chips, ~6.8:1 */
    --c-brand-light: 87 46 84; /* #572E54  brand plum for mid emphasis */

    --c-on-color: 248 244 252; /* light text that STAYS light on colored fills */
    --c-line: 75 45 73; /* #4B2D49  plum hairline (alpha applied) */

    --c-fc-front: linear-gradient(160deg, #ffffff 0%, #f6f1fa 100%);
    --c-fc-back: linear-gradient(160deg, #f1e9fb 0%, #e7daf6 100%);

    /* Mimi wash — lavender on cream so the panel isn't a dark block on the light page */
    --c-mimi-ambient: radial-gradient(
        130% 120% at 50% 0%,
        rgba(169, 142, 227, 0.22),
        rgba(252, 247, 242, 0.55)
    );
}
```

### Notes

- **Surfaces separate by border + soft shadow, not big value jumps.** Page is faintly lavender; cards are pure white. Don't try to make cards "pop" with a darker page — keep it airy and lean on `border-line` + a soft shadow (§3).
- **Primary text is `#2D1C2B`, not black.** Soft deep-plum is calmer for long sessions and stays on-brand. ~12.9:1 contrast — AAA.
- `cream-dim` (alpha .62) ≈ 4.7:1 ✓, `cream-faint` (alpha .42) ≈ 3.0:1. **`cream-faint` is only safe on ≥16px / semibold or decorative text in Bright.** Where it's used for real small body copy, switch that element to `cream-dim` (note where in §4).
- **`page-glow`** (`tailwind.config.ts → backgroundImage.page-glow`) is a dark-tuned radial of plum/lavender at low alpha. On a light page it's nearly invisible but harmless — optional polish is a `.light`-scoped lighter glow. Low priority.

---

## 3. Shadows in Bright

The dark theme uses heavy black shadows (`flash-card: 0 40px 80px rgba(0,0,0,.4)`, `soft-elevation`, `card-preview`). On a light page those read as dirty grey halos. Add **`.light`-scoped softer, plum-tinted** shadows in `main.css` rather than editing the dark tokens:

```css
.light .shadow-flash-card {
    box-shadow: 0 24px 50px -28px rgba(60, 30, 58, 0.35);
}
.light .shadow-soft-elevation {
    box-shadow:
        0 18px 44px -26px rgba(60, 30, 58, 0.28),
        0 2px 8px -4px rgba(60, 30, 58, 0.12);
}
.light .shadow-card-preview {
    box-shadow: 0 24px 50px -28px rgba(60, 30, 58, 0.3);
}
```

Rule of thumb for any inline `rgba(0,0,0,…)` shadow you hit: in Bright, use `rgba(60,30,58, …)` (plum) at **lower** alpha and a **larger negative spread** so it stays soft.

---

## 4. Component audit — the real work

Each row is a real file in `app/`. "Flips already" = leave it; listed only so you don't waste time. **Fix** = authored dark-only, breaks in Bright.

### 4.1 The cardinal rule: `cream` vs `on-color`

- `text-cream` = theme-flipping. In Bright it becomes **dark plum**. Correct on neutral surfaces (cards, page).
- **On a _colored / saturated_ surface** (deck cover gradient, `bg-brand` fill, `bg-success` fill) the text must stay light in BOTH themes → use **`text-on-color`** (or `text-white`), never `text-cream`.
- So: wherever `text-cream` (or `bg-black/*` chips) sits **on top of a cover or a brand/success fill**, switch it to `text-on-color`.

### 4.2 Covers & anything on them

| File                             | What                                                                                                                                                                | Fix                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/shared/CoverArt.vue` | label uses `text-cream/80` over the gradient                                                                                                                        | → `text-on-color/80`. The `dark:`-only white sheen overlay is fine; keep.                                                                                                                                          |
| `components/shared/DeckCard.vue` | title `text-cream` + fav button `bg-black/30 text-cream` sit **over the cover** (both card variants, ~lines 33, 65, 85); hover shadow `rgba(0,0,0,0.5)` (~line 173) | title/fav over cover → `text-on-color`; keep the dark `bg-black/30` scrim (it's meant to darken a colored cover — works in both themes); hover shadow → plum-tinted (§3) via a `.light` override or `dark:` split. |
| `pages/decks/[id]/index.vue`     | hero over cover: `text-cream`, `text-cream/70`, `text-cream/80`, `bg-black/20` back button (~lines 19–61)                                                           | text over cover → `text-on-color`; keep the black scrim.                                                                                                                                                           |

### 4.3 Hardcoded card / surface backgrounds (won't flip)

| File                                | What                                                                                                                                       | Fix                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/shared/CardPreview.vue` | `.front { background:#1a1520 }`, `.back { background:linear-gradient(#20182a,#1a1520) }`, border `rgba(124,69,118,.45)` (scoped `<style>`) | Drive from tokens: `background: var(--c-fc-front)` / `var(--c-fc-back)`; border `rgb(var(--c-line)/.45)` and `var(--brand-bright)`. Text inside is already `text-cream`/`text-brand-muted` → flips fine once the bg flips. |
| `components/study/FlashCard.vue`    | JS-swapped inline gradients (~lines 100–110) already handle light, **but values are the old muted cream**                                  | Update the light branch to the new front/back: front `linear-gradient(160deg,#FFFFFF 0%,#F6F1FA 100%)`, back `linear-gradient(160deg,#F1E9FB 0%,#E7DAF6 100%)`. Keep the mask-sweep reveal untouched.                      |
| `pages/decks/[id]/cards/add.vue`    | preview card inline `background:linear-gradient(160deg,#241420,#160e1a)` + `box-shadow:rgba(0,0,0,.35)` (~lines 163–164)                   | token gradient (`var(--c-fc-front)`) + plum shadow; check the `text-cream-faint` body copy here reads (large display text, OK).                                                                                            |
| `pages/decks/create.vue`            | inputs `bg-[rgba(255,255,255,.03)]` (~lines 25,35,45) — invisible on white                                                                 | → `bg-bg-well` + `border-line-strong`.                                                                                                                                                                                     |

### 4.4 On-tint text that vanishes in Bright (contrast-critical)

Pale accents read as text only on dark. On light tints they disappear. Split with `dark:` so dark keeps its current light text and Bright gets a **darkened ramp**.

| File                                      | Current (dark-only)                                                                                                                                                            | Bright value (`dark:` keeps the old)                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/study/RatingRow.vue`          | `ghost` `text-[#F26D6D]` · `dark` (Hard) `text-[oklch(.82_.14_75)]` on `vib-amber/18` · `good` `text-[#D9C7F5]` on `lavender/24` · `easy` `text-[#2E3613]` on filled `success` | Again → `text-[#B3261E] dark:text-[#F26D6D]`, bg `error/10 dark:error/16`. Hard → `text-[#8A5A12] dark:text-[oklch(.82_.14_75)]`, bg `vib-amber/14 dark:vib-amber/18`, border `#C9962E`. Good → `text-[#5B3FA0] dark:text-[#D9C7F5]`, bg `lavender/16 dark:lavender/24`. Easy → **unchanged** (dark text on green fill works in both). |
| `components/study/MultipleChoiceCard.vue` | correct/incorrect states use `text-cream` on `success/10` & `pink-soft/10` (~lines 100–103)                                                                                    | `text-cream` flips to plum — fine on those pale tints; just confirm the `success/10` and `pink-soft/10` tints are visible enough on white (bump to `/14` if washed out).                                                                                                                                                               |

### 4.5 Theme-aware tokens — **leave alone** (flip automatically)

`layouts/*.vue` (`bg-bg-base text-cream`), `ui/Button.vue` (`bg-brand text-cream` → primary is a fill, `text-cream` should be **`text-on-color`** so it stays light — _one fix here_; ghost/light/text variants flip fine), `shared/StatTile.vue` tones (already mode-aware, good — but verify `pink`/`blue`/`green` gradient tints are visible on white; deepen alpha if needed), `app/Rail.vue`, `app/Topbar.vue`, `shared/Mimi.vue`, `ui/Tooltip.vue`, `ui/Keycap.vue` (`dark:bg-white/[0.06]` → add a `light:`/default `bg-bg-muted` so the keycap has a fill in Bright), all the `text-cream*` body copy across `pages/**`.

> **`ui/Button.vue` primary:** change `text-cream` → `text-on-color` (it's text on the `bg-brand` fill). Same for any `bg-brand text-cream` chat bubbles in `pages/decks/create.vue` and `pages/decks/[id]/cards/add.vue`.

### 4.6 Misc inline darks to sweep

Grep the whole `app/` for these and fix per the rules above:

- `rgba(0, 0, 0,` → shadows/scrims. Scrims over covers: keep. Shadows: plum-tint via §3.
- `rgba(255,255,255,` → input bg / hover (`hover:bg-white/10` in `ui/ChipInput.vue`, sheens). On Bright these are near-invisible; replace input bg with `bg-bg-well`, hover with `hover:bg-brand/10`.
- `drop-shadow-[…rgba(0,0,0,…)]` on `shared/Mimi.vue`, `shared/PageLoader.vue` → soften / plum-tint for Bright (low priority, decorative).
- literal `#0…`/`#1…` hex backgrounds → tokens.

---

## 5. Contrast & comfort rules (the bar to clear)

The user's explicit ask: **readable and comfortable for long-term use; never put similar colors on top of one another.**

1. **Body & UI text ≥ 4.5:1** against its actual surface; large/display ≥ 3:1. Primary plum on white is ~12.9:1 — generous headroom; don't erode it with low-alpha greys for real content.
2. **Adjacency / same-value ban:** a control or chip must differ in value from the surface behind it. Don't place a pale-lavender chip on the lavender page without a border; don't stack `surface-2` on `bg-base` with nothing between (use a `border-line` hairline). The reference page demonstrates the minimum separation.
3. **Pale accents are fill-only in Bright** — lavender, pink-soft, accent-light, success-bright must never be _text_ on a light surface. As text, use the darkened ramp (§4.4).
4. **Colored fills keep `on-color` text** in both themes (covers, primary button, success "Easy").
5. **No pure black, no pure-saturated full-bleed.** Soft deep-plum ink + tinted whites = comfortable. Saturation lives in covers, stat tiles, and small accents — not in large backgrounds.

---

## 6. Order of operations + verification

1. Paste the `.light` palette (§2) and `.light` shadow overrides (§3).
2. Toggle to light (the Topbar moon/sun) and walk **every** screen: Auth · Home (v2) · All decks · Deck detail · Discover · Statistics · Profile · AI chat · Create deck · Add card · Practice (front → revealed → rating → tip → exit).
3. Fix the §4 audit rows as you hit them. Work `components/` first (shared by many screens), then `pages/`.
4. **Per-screen check:** (a) no element invisible/washed out; (b) all text passes §5.1; (c) covers/fills keep light text; (d) shadows are soft plum, not grey halos; (e) inputs have a visible border on white.
5. **Practice flow specifically:** flashcard front (white) and revealed back (lavender) must be clearly different surfaces; the mask-sweep reveal still animates; rating row text passes AA (§4.4).
6. **Toggle back to dark** on a couple of screens to confirm you didn't regress dark mode (every `dark:` split should leave dark identical).
7. Confirm system honors `prefers-reduced-motion` (FlashCard already does) and that a hard refresh in light mode stays light (color-mode cookie handles this).

---

## 7. Files you'll touch (summary)

```
app/assets/css/main.css                     ← §2 palette + §3 shadows  (primary change)
app/components/shared/CoverArt.vue          ← on-color label
app/components/shared/DeckCard.vue          ← on-color over cover, plum shadow
app/components/shared/CardPreview.vue       ← token gradients
app/components/shared/StatTile.vue          ← verify tint visibility
app/components/study/FlashCard.vue          ← new light gradient values
app/components/study/RatingRow.vue          ← darkened on-tint text (dark: split)
app/components/study/MultipleChoiceCard.vue ← verify tint visibility
app/components/ui/Button.vue                ← primary text-cream → on-color
app/components/ui/Keycap.vue                ← Bright keycap fill
app/components/ui/ChipInput.vue             ← hover/input fills
app/pages/decks/create.vue                  ← input bg, chat bubble on-color
app/pages/decks/[id]/index.vue              ← on-color over cover hero
app/pages/decks/[id]/cards/add.vue          ← token gradient, on-color bubble
```

Plus a grep sweep of `app/` for `rgba(0, 0, 0`, `rgba(255,255,255`, `bg-black/`, and literal dark hex.

**Do not** add a new theme name, new toggle, or new Tailwind color families — Bright _is_ `.light`, and the token system already exists. Keep the dark theme byte-for-byte unchanged except where a shared value needs a `dark:` split.
