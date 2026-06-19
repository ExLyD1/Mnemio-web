# Home page — exact build spec (Mnemio Desktop)

> **This is the main page (`/` → dashboard) and it must look like `Home v2.html` in this folder.**
> If anything here is ambiguous, **`Home v2.html` is the source of truth** — open it in a browser and match it pixel-for-pixel. `Home-v2-reference.png` is a screenshot of the top half.
>
> Implement in `app/pages/dashboard.vue` (or whatever the `/` route renders). This is a **restyle of the existing page** — reuse real components, do not invent a new design system.

---

## 0. The single most important thing

The previous attempts failed because the page was treated as "a bunch of widgets." It is not. The Home page has **exactly three stacked blocks inside a centered 920px column**, in this order, with nothing else:

```
┌─────────────────────────────────────────────┐
│  1. GREETING   (eyebrow date + big serif h1) │
├─────────────────────────────────────────────┤
│  2. HERO       (full-width plum card)        │   ← the ONE primary action
├─────────────────────────────────────────────┤
│  3. TWO COLUMNS  [ Up next  |  This week ]   │   ← 1.5fr / 1fr grid
└─────────────────────────────────────────────┘
```

Do **not** add: a stat-tile row, a full month calendar, a separate AI banner, or big recent-deck cards. Those belonged to the old crowded Home and were deliberately removed. If you see them in the current code, delete them.

The whole thing sits inside the standard app shell: **left Sidebar (240px) + Topbar + scrolling content area**. The content area centers a `max-width: 920px` column.

---

## 1. App shell (already exists — `app/components/app/`)

- **Sidebar** `Rail.vue` — 240px, nav order **Home · All decks · Discover · Statistics · AI Assistant**, then a `LIBRARY` group (recent decks with % ), then the Mimi "AI Companion" card pinned to the bottom. Home is the active item; its row shows a `12 DUE` tag on the right.
- **Topbar** `Topbar.vue` — breadcrumb "Home", centered search (`Search decks, cards, tags…` + ⌘K), then **New deck** (ghost button), settings icon, avatar.
- **Content** — `padding: 32px`, vertical scroll, inner column `max-width: 920px; margin: 0 auto`.

---

## 2. Block 1 — Greeting

```
margin: 8px 0 28px;
```
- **Eyebrow** (`.mono`): `Tuesday · 20 March` — 12px, uppercase, letter-spacing .18em, weight 600, color cream-faint. Bind to today's date.
- **H1** (Fraunces 400, 44px, line-height 1, letter-spacing -.02em): `Good morning, ` + the name in **italic, color --purple** (`Alex.`). Greeting word depends on time of day.

---

## 3. Block 2 — Hero card (the primary action)

This is the visual anchor. A returning user's eye must land here.

```
border-radius: 24px;
padding: 32px 36px;
background: linear-gradient(160deg, #572F54 0%, #2C1A2A 100%);  /* plum → plum-deep */
border: 1px solid rgba(242,188,255,0.18);
display: flex; align-items: center; gap: 32px;
margin-bottom: 18px;
```

**Left (flex:1):**
- Eyebrow `TODAY'S REVIEW`, color `rgba(242,188,255,0.6)`.
- Big line (Fraunces, 34px, cream, margin-top 8px): `12 cards · about 7 minutes`. ← due count + estimated time.
- Sub (14px, cream-dim, margin-top 6px): `Mostly from ` **Japanese Core 1k** (bold, cream) ` — last studied 2h ago`.
- CTA row (margin-top 22px, flex, gap 16, align center):
  - **Start review** — primary button, `padding: 13px 28px; font-size: 16px`, arrow icon → routes to `/review`.
  - Hint text (13px, cream-faint): `or pick a deck below`.

**Right (flex-shrink:0, column, center, gap 10):**
- **Mimi** `<img>` 84×84, `filter: drop-shadow(0 6px 16px rgba(169,142,227,0.5))`. Asset: `assets/mimi.png` (= `public/images/mimi/axolotl.png`).
- Speech bubble below her: `background rgba(0,0,0,0.3); border 1px solid rgba(255,255,255,0.12); border-radius 12px; padding 8px 13px; font-size 12px; max-width 190px; text-align center; line-height 1.45`. Text = the AI suggestion (e.g. `"sonder" keeps slipping — I added a hint for it.`).

> Mimi lives **inside** the hero. There is no separate AI suggestion banner anywhere on this page.

---

## 4. Block 3 — Two columns

```
display: grid; grid-template-columns: 1.5fr 1fr; gap: 18px;
```

### 4a. Left — "Up next" (a card, `padding: 6px 8px`)
- Header `.mono` `Up next`, `padding: 14px 14px 8px`.
- Then **deck rows** (loop over decks with due cards). Each row:
  ```
  display:flex; align-items:center; gap:14px; padding:12px 14px;
  border-bottom: 1px solid var(--line);   /* none on last row */
  ```
  - color **bar** 10×34, radius 5 (deck's cover color)
  - info (flex:1): name (15px, weight 700, cream) + `{p}% mastered` (12px, cream-faint)
  - `{due} due` (12px, weight 700, color --pink)
  - **Practice** primary button (`padding: 8px 16px; font-size: 12px`)
- Footer: `All decks →` link (color --purple, 13px, weight 600), `padding: 10px 14px 12px`.
- Sample rows: French verbs / 84% / 12 due (#3A2654) · Anatomy: thorax / 41% / 4 due (#542E40) · SAT vocab / 67% / 21 due (#3F2D54).

### 4b. Right — "This week" (a card, `padding: 20px`, flex column)
- Header `.mono` `This week` (no badge — there was a "5/7 days" badge; it was removed).
- **Day strip** (margin-top 18, flex, space-between) — 7 days Mo–Su. Each day = a 32px circle + label below:
  - practiced day: circle shows the **card count** (e.g. 32, 45, 28, 51, 33), `background: linear-gradient(150deg, #7C4576, #572F54); border 1px solid rgba(242,188,255,0.4); box-shadow 0 4px 12px -4px rgba(124,69,118,0.7); color cream; font 11px/700`.
  - rest day: empty circle, `background rgba(255,255,255,0.04); border 1px solid var(--line)`.
  - label (10px, cream-faint, letter-spacing .1em) below.
  - Sample: Mo 32, Tu 45, We 28, Th —, Fr 51, Sa —, Su 33.
- **Weekly goal** (margin-top 20):
  - row: `Weekly goal` (12px cream-dim) · `189 / 250 cards` (12px weight 700 cream)
  - track: height 7, radius full, bg `rgba(255,255,255,0.06)`; fill width 76%, `background: linear-gradient(90deg, #A98EE3, #C2E083)`.
- Spacer (`flex:1`) pushes the footer down.
- **Footer stats** (margin-top 18, border-top 1px var(--line), padding-top 14, two equal columns):
  - `23` (Fraunces 24px cream) / `days practiced` (11px cream-faint)
  - `1,284` (Fraunces 24px cream) / `cards reviewed` (11px cream-faint)
  - **No streak.** "days practiced" replaces any streak counter.

---

## 5. Tokens used (all already in the app)

| Name | Value |
|---|---|
| bg | `#0E0B10` |
| surface (cards) | `#1A1520` |
| line | `rgba(227,210,200,0.10)` |
| line-strong | `rgba(227,210,200,0.18)` |
| cream | `#E3D2C8` |
| cream-dim | `rgba(227,210,200,0.62)` |
| cream-faint | `rgba(227,210,200,0.42)` |
| purple | `#A98EE3` |
| plum / plum-deep | `#572F54` / `#2C1A2A` |
| brand-bright | `#7C4576` |
| pink | `#F2BCFF` |
| success/green | `#A6C261` / `#C2E083` |

Fonts: **Fraunces** (display/serif, headings + the big numbers), **Nunito Sans** (everything else). Card radius 20px; hero radius 24px; pills/buttons full-round.

---

## 6. Data wiring (real, present in repo)

| UI value | Source |
|---|---|
| due count + "X cards · Y minutes" | `stores/srs.ts` (`dueCount`) |
| "Mostly from {deck}" + Up-next rows | `stores/decks.ts` (decks with due, sorted) |
| Mimi suggestion text | `api/ai.ts → suggest('dashboard')` |
| Start review | route to `/review` |
| Practice (per row) | route to `/review?deck={id}` |
| week strip / goal / footer stats | `composables/useStats.ts` |
| greeting name | `stores/auth.ts` (user) |

All copy through `useT()`; date via the app's locale helper.

---

## 7. Acceptance checklist (Claude Code: verify before done)

- [ ] Page is a centered **920px** column inside the existing Sidebar + Topbar shell.
- [ ] Exactly **3 blocks**: greeting, hero, two-column grid. No stat-tile row, no month calendar, no AI banner, no big recent-deck cards.
- [ ] Hero is the largest element, plum gradient, with **Start review** + Mimi-in-hero.
- [ ] "Up next" rows each end with a **Practice** button (not an arrow).
- [ ] "This week" shows day circles **with card counts**, a weekly-goal bar, and two footer stats.
- [ ] **No "streak"** text anywhere — it's "days practiced".
- [ ] Side-by-side with `Home v2.html` at 1440×900, they match.
