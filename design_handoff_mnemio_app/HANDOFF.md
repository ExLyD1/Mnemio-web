# Mnemio — Design Handoff for Claude Code

> **What this is:** the implementation guide for the **Mnemio Desktop** and **Mnemio Mobile** redesign.
> **Visual source of truth:** `Mnemio Desktop.html` and `Mnemio Mobile.html` (project root). Open them in a browser — every screen is laid out on a pan/zoom canvas.
> **Stack:** Nuxt 4 · Vue 3 `<script setup lang="ts">` · Pinia · Tailwind · custom i18n (`useT`).

---

## Read order
1. This file.
2. `tokens.md` — colors, deck-cover gradients, stat-tile tones, rating-row colors (paste-ready diffs).
3. `screens.md` — every screen mapped to its real `.vue` file + the components and stores/composables that feed it.
4. `Mnemio Desktop.html` / `Mnemio Mobile.html` — match these pixel-closely. The `*-screens.jsx` files beside them hold exact values (color, spacing, copy) if you need them.

---

## Important: this is a RESTYLE, not a rebuild

Every screen in the prototypes **already exists** in `Mnemio-web`. Edit the real components and pages — do **not** create parallel ones. The prototype HTML is a **design reference** (plain React/JSX for rendering); recreate its look with the real Vue components and tokens.

---

## Two canvases

**`Mnemio Desktop.html`** — the full app at 1440×900 in browser chrome:
Auth & onboarding · Home (two variants — use **Home · v2 calmer**) · All decks · Discover · Statistics · Profile (Edit + Achievements) · AI Assistant chat · Create deck · Add card (+ Mimi chat) · Practice (front · revealed · tip chat · exit).

**`Mnemio Mobile.html`** — the same app at 390×844 on a phone:
Auth · Home · All decks · Create/Add card · Practice (front · revealed · tip) · Statistics · Discover · Profile · AI chat. One shared bottom tab bar on every screen.

> The desktop canvas also includes the **landing page** (current vs proposed) and the **AI Flashcard Maker** marketing page. Those are separate marketing deliverables — implement them only if in scope.

---

## Design language

Keeps Mnemio's **dark-first, muted-plum identity** (Fraunces display + Nunito Sans, cream text, plum surfaces). The redesign adds **selective contrast**, it does **not** recolor the canvas:
- **Deck covers** → oklch gradient pairs (violet/blue/teal/pink/amber/coral) instead of flat plum swatches. Biggest visual change. (`tokens.md`)
- **Stat tiles** → lavender / blue / green / pink tones instead of all-plum.
- **Practice rating row** → higher-contrast coral/amber/lavender/green.
- **Mimi mascot** appears consistently (Home, AI, Profile, Practice corner, Add-card chat).

**No streaks anywhere** — replaced with **"days practiced"**. Remove any remaining streak UI during the restyle.

---

## Navigation / IA (matches your real `app/components/app/Rail.vue`)

- Desktop rail: **Home · Decks · Discover · Statistics · AI** (+ Review badge, Mimi → Profile). No "Favorites" nav item — favorites are a **filter inside Decks** (`shared/FilterChips.vue`).
- Mobile: one **identical** bottom tab bar on every screen — **Home · Decks · Mimi (raised center) · Stats · Profile**. Use a single shared component, no per-page variants.
- Discover: "Browse by category" sits **above** the deck grids (it's a starting point).

---

## Component map (prototype → real component)

| Prototype element | Real component | Notes |
|---|---|---|
| Deck cover | `shared/CoverArt.vue` + `utils/coverSwatches.ts` | flat swatch → gradient pair (tokens.md) |
| Stat tile | `shared/StatTile.vue` | add blue/green/pink tones |
| Progress bar | `shared/ProgressBar.vue` | color by % on weakest-decks |
| Pill / badge | `shared/Pill.vue` / `ui/Badge.vue` | |
| Buttons | `ui/Button.vue` | variants exist |
| Rail / Topbar | `app/components/app/Rail.vue` / `Topbar.vue` | IA already correct |
| Heatmap / calendar | `shared/ActivityHeatmap.vue` / `shared/MiniCalendar.vue` | Home v2 uses a compact week strip |
| Flashcard | `study/FlashCard.vue` | mask-sweep reveal already built |
| Rating row | `study/RatingRow.vue` | vibrant colors |
| Mode picker | `study/ModeCard.vue` | |
| AI chat | `pages/ai.vue` + `components/ai/ChatSidebar.vue` + `composables/useChat.ts` | **exists** — restyle |
| AI draft cards | `components/ai/DeckCard.vue` | |
| Mimi mascot | `shared/Mimi.vue` (or `/images/mimi/axolotl.png`) | |
| Add card / form | `components/deck/Form.vue`, `shared/CardPreview.vue` | |

## Data wiring (real, already present)
- **AI** → `app/api/ai.ts` (`generateDeck`, `enrichWords`, `suggest`); chat via `composables/useChat.ts`; backend `Mnemio-backend/src/services/ai.service.ts`.
- **Decks** → `stores/decks.ts` + `composables/useDecks.ts`. **Due/SRS** → `stores/srs.ts`, `composables/useSpacedRepetition.ts`.
- **Stats** → `composables/useStats.ts`. **Discover** → `composables/useDiscover.ts`. **Practice** → `stores/practice.ts` + `composables/usePractice.ts`.
- **i18n** → `useT()`; copy in locale JSON; translated option arrays must be `computed()`.

---

## Pre-existing bug to fix while restyling
`tailwind.config.ts`: `text-h1` is `fontSize 32px` with `lineHeight 64px` (2.0 — too airy). Change to ~`40px` (≈1.2) and re-check headings.

## Content flags — confirm before ship
- Stat numbers (1,284 reviewed · 94% retention · 23 days practiced) — confirm real or mark placeholder.
- Landing testimonials / "240k learners" — real or remove.
- AI Flashcard Maker landing: "Audio — soon" and Anki `.apkg` export — match backend reality.

---

## Files in this bundle
```
design_handoff_mnemio_app/
  HANDOFF.md   ← this file
  screens.md   ← per-screen restyle notes → real .vue files
  tokens.md    ← paste-ready token + coverSwatches diffs
  assets/      ← mimi.png, logo.svg (already in repo)
```
Visual references live at the project root: `Mnemio Desktop.html`, `Mnemio Mobile.html` (+ their `*-screens.jsx`).
