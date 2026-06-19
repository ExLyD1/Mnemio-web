# All decks page — exact build spec

> **Source of truth:** `All decks.html` in this folder (open at 1440×900). Reference: `All-decks-reference.png`.
> Implement in `app/pages/decks/index.vue`. Restyle — reuse `shared/DeckCard.vue`, `shared/CoverArt.vue`, `shared/FilterChips.vue`.

---

## Layout

Standard shell: **Sidebar + Topbar + content** (`padding: 32px`). No 920px clamp here — the deck grid uses the full content width.

```
┌───────────────────────────────────────────────┐
│  HEADER:  "All decks · 8"      [filter chips]   │
├───────────────────────────────────────────────┤
│  GRID: 4 columns of deck cards, gap 18px        │
│  ▢ ▢ ▢ ▢                                        │
│  ▢ ▢ ▢ ▢                                        │
└───────────────────────────────────────────────┘
```

---

## Header (`margin-bottom: 22px`, flex, align-end, space-between)
- Left: eyebrow `LIBRARY` (`.mono`), then H1 (Fraunces 40px) `All decks` + a lighter count `· 8` (Nunito Sans 22px, weight 400, cream-faint).
- Right: **filter chips** row — `All` (active) · Languages · Medicine · Test prep · Law · Mine.
  - Chip: `padding 8px 14px; border-radius 999px; font 13px; border 1px line-strong; color cream-dim`.
  - Active chip: `bg --plum; border rgba(242,188,255,.3); color cream`.

---

## Deck grid
`display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;`

### Deck card (`shared/DeckCard.vue`) — `card` + `padding: 22px`
- **Cover** 50×64, `border-radius: 12px`, filled with the deck's cover color (`CoverArt.vue`), a small "layers" glyph in `rgba(242,188,255,.6)` at the bottom-left.
  - If favorited: a bookmark glyph (`--pink`) at the cover's top-right.
- **Name** (15–16px, weight 700, cream), margin-top 14px.
- **Subtitle** (12px, cream-faint): `{category} · {n} cards`.
- **Progress track** (height 5, radius 3, `bg rgba(255,255,255,.06)`) with fill `linear-gradient(90deg, cream, purple)` at `{p}%`.
- **Meta row** (margin-top 8, 11px cream-faint, space-between): `Mastered {p}%` · `{due} due`.

### Sample data (match the HTML)
| Deck | Category · cards | % | fav | cover | due |
|---|---|---|---|---|---|
| Japanese Core 1k | Languages · 1,032 | 62 | ✓ | #572F54 | 12 |
| French verbs | Languages · 412 | 84 | | #3A2654 | 6 |
| Anatomy: thorax | Medicine · 256 | 41 | ✓ | #542E40 | 4 |
| SAT vocab | Test prep · 980 | 67 | | #3F2D54 | 21 |
| Music theory | Concepts · 188 | 22 | | #2E2E54 | 0 |
| Constitutional law | Law · 340 | 55 | ✓ | #54322E | 8 |
| Italian conjugation | Languages · 220 | 71 | | #2E5454 | 3 |
| World capitals | Geography · 195 | 92 | | #54462E | 0 |

> If the **vibrant cover gradients** are adopted (see `../tokens.md`), swap the flat cover colors for the gradient set via `coverGradientFor(deck.id)`. Otherwise keep the flat plum tones above.

---

## Behaviour / data
- Decks from `stores/decks.ts` (`composables/useDecks.ts`).
- Filter chips filter by subject/category; **Favorites is a chip here** (`Mine`/`Favorites`), not a nav item.
- Sort menu (`shared/SortMenu.vue`) optional in the header right.
- Card click → `/decks/{id}`. Copy via `useT()`.
- Remove any flame/streak badge on cards.

---

## Tokens
surface `#1A1520` · line `rgba(227,210,200,.10)` · cream `#E3D2C8` · cream-faint `rgba(227,210,200,.42)` · purple `#A98EE3` · plum `#572F54` · pink `#F2BCFF`. Card radius 20px; cover radius 12px. Fonts Fraunces (H1 + deck names) / Nunito Sans.

---

## Acceptance checklist
- [ ] Header: `All decks · N` + filter chips, `All` active.
- [ ] **4-column** card grid, gap 18px, full content width (no 920px clamp).
- [ ] Each card: cover (+ bookmark if fav) · name · `category · cards` · progress bar · `Mastered % / X due`.
- [ ] No streak/flame badges.
- [ ] Matches `All decks.html` at 1440×900.
