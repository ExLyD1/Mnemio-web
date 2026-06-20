# Sidebar / Rail — exact build spec

> **Source of truth:** `Sidebar states.html` in this folder (open in a browser) + the real `app/components/app/Rail.vue`.
> Reference image: `Sidebar-reference.png`.

---

## The rail is 76px icons + per-item tooltips (two states: rest & hover)

The rail stays **76px, icons only, at all times** (it does NOT expand). The "two states" are how each nav item looks:

1. **Static (rest)** — icon in `text-brand-muted`, no background.
2. **Hover** — the hovered item tints to `bg-brand/20` + `text-cream` and shows a **tooltip label to its right** (via `UiTooltip side="right"`).

This is exactly what the real `Rail.vue` already does — keep it. In `Sidebar states.html`, **frame 1 (Static)** and **frame 2 (Hover — single item, tooltip)** are the target. The third (240px expanded) frame is **reference only — do NOT build it.**

> **Do not** make the rail expand on hover, and **do not** add labels, a LIBRARY list, or Mimi's name inline. Labels live only in tooltips.

---

## Structure (top → bottom)

```
┌──────────────┐
│  Brand mark  │   /dashboard, SharedBrandMark
├──────────────┤
│  Home        │   /dashboard   LayoutGrid   ← active when on /
│  All decks   │   /decks       Library
│  Discover    │   /discover    Compass
│  Statistics  │   /statistics  BarChart3
│  AI Assistant│   /ai          Bot
│ ──────────── │   <hr>
│  Review  •12 │   /review      Sparkles + due badge
│              │
│  (spacer)    │   mt-auto
│  Mimi        │   /profile     axolotl.png
└──────────────┘
```

Icons are **lucide-vue-next** (already imported in `Rail.vue`): `LayoutGrid, Library, Compass, BarChart3, Bot, Sparkles`. Do **not** swap these.

---

## Exact styling

### The `<aside>`
- `width: 76px` (fixed, never expands) · `height: 100vh` · `bg-bg-surface` · `border-right: 1px solid line` · `py-5` · column, `items-center`, `gap: 6px`.

### Nav item (`size-11` = 44px, `rounded-[13px]`)
| State | Background | Icon/Text |
|---|---|---|
| rest | transparent | `text-brand-muted` (`--cream-faint`) |
| hover | `bg-brand/20` | `text-cream` |
| **active** (route match) | `bg-brand` (`#572F54`) | `text-on-color`; icon tinted `--pink` |

- All nav items are **icon-only** (44px cell). The label appears only in the hover **tooltip**. The active route's icon is tinted `--pink` on the solid `bg-brand` cell.
- Tooltip: black bg, `1px line-strong` border, `12px/600` text, 8px radius, appears to the **right** (`side="right"`), with a small left-pointing caret.

### Review button
- `bg-brand/30`, `text-lavender`; hover `bg-brand/50`.
- Due badge: top-right, `min-w-[18px] h-[18px]`, `bg-lavender`, `text-plum-deep`, `10px/bold`, shows `dueCount` (`99+` if >99). Hidden when 0.

### Mimi (bottom, `mt-auto`)
- `axolotl.png` at `size-11` (44px), `object-contain`, links to `/profile`.
- Hover: `scale-105` (+ tooltip "Mimi").

### LIBRARY group
Not in the rail. (It appears in the page mockups' wide sidebar for context only — ignore it for the rail build.)

---

## Tokens
bg-surface `#1A1520` · line `rgba(227,210,200,.10)` · line-strong `rgba(227,210,200,.18)` · cream `#E3D2C8` · brand-muted/cream-faint `rgba(227,210,200,.42)` · brand `#572F54` · lavender/purple `#A98EE3` · pink `#F2BCFF` · plum-deep `#2C1A2A`. Fonts: Fraunces (brand word), Nunito Sans (labels).

---

## Data / behaviour
- Active item = current route (`active-class="bg-brand text-on-color"` via `NuxtLink`).
- `dueCount` from `useSrsStore()`.
- Labels via `useT()` (`rail.home`, `rail.decks`, `rail.discover`, `rail.statistics`, `rail.ai`, `rail.practice`, `rail.profile`).
- **No "Favorites" item** (it's a filter inside Decks). **No streak** anywhere.

---

## Acceptance checklist
- [ ] Rail is **76px, icons only** — never expands.
- [ ] Nav order: Home · All decks · Discover · Statistics · AI Assistant, then `<hr>`, Review (with due badge), spacer, Mimi.
- [ ] Hover tints item to `bg-brand/20`+cream **and shows a right-side tooltip label**; active route is solid `bg-brand`.
- [ ] Mimi pinned to the bottom, links to `/profile`.
- [ ] Matches frames 1 & 2 of `Sidebar states.html` (ignore the 240px frame).
