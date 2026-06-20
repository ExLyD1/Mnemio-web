# Deck &amp; cards — authoring flow (Mnemio **Desktop**) — build spec

> **Source of truth:** `Deck and cards.html` in this folder + `Deck-and-cards-reference.png`.
> These reproduce the **actual screens from `Mnemio Desktop.html`** (`desktop-screens.jsx` → `DCreateDeck`, `DAddCard`, `DAddCard mimiChat`). They supersede the earlier `create-deck/` and `add-card/` handoffs, which used a wrong 76px icon-rail shell and redesigned layouts.

This group is **three screens**: **Create deck**, **Add card**, **Add card · Mimi chat**.

---

## Shared app shell (ALL three screens)

A **240px labelled sidebar** (NOT an icon rail) + a top bar + a 32px-padded content area, on the bg gradient
`radial-gradient(900px 500px at 80% -10%, rgba(169,142,227,.10), transparent 60%), radial-gradient(700px 400px at -10% 30%, rgba(87,47,84,.22), transparent 65%), #0E0B10`.

### Sidebar (240px, `bg rgba(8,6,10,.6)`, border-right line, padding 24/18)
1. **Logo row:** Mnemio mark (26px rounded-8 radial pink→plum gradient) + "Mnemio" (Fraunces 22) · burger icon right.
2. **Nav** (gap 4) — items `Home · All decks · Discover · Statistics · AI Assistant`. Each: icon (faint; **pink** when active) + label (14/600). **Active** item = `bg #572F54`, border `rgba(242,188,255,.2)`, cream text. On the active **Home** item only, a `12 DUE` tag sits right (10px, `rgba(242,188,255,.6)`, tracking .12em). On these three screens **All decks is active**.
3. Divider (1px line, margin 14/0).
4. **`LIBRARY`** mono label, then 4 deck rows: `Japanese Core 1k 62 · French verbs 84 · Anatomy: thorax 41 · SAT vocab 67`. Each = small purple dot (opacity scales with %) + name (truncate) + `%` (11px faint).
5. Spacer, then **AI Companion** card (`bg rgba(169,142,227,.18)`, border `rgba(169,142,227,.25)`, radius 14, pad 14): Mimi PNG 44 + "AI Companion" / "1 suggestion ready".

### Top bar (`padding 20/32`, border-bottom line, `bg rgba(14,11,16,.6)` blur 10)
Breadcrumbs left (last crumb cream/600, others dim, `/` faint separators) · pill **search** ("Search decks, cards, tags…", max 380, centered) · right: the screen's **action button** + **avatar** "A" (38px round plum, pink letter, border `rgba(242,188,255,.3)`).

### Shared button styles
- **primary:** `bg #A98EE3`, text `#1A0F22`, border `rgba(255,255,255,.18)`, radius 12, pad 12/22, weight 700, shadow `0 10px 30px -10px rgba(169,142,227,.5), inset 0 1px 0 rgba(255,255,255,.25)`.
- **ghost:** transparent, cream, border `rgba(227,210,200,.18)`, radius 12, pad 12/18, weight 600.
- **input:** `bg rgba(255,255,255,.03)`, border line-strong, radius 12, pad 13/14, cream, 14px.

---

## Screen 1 — Create deck
Crumbs `Home / All decks / Create`; top-bar action = **✕ Cancel** (ghost). Content centered, `max-width 920`.

- Eyebrow mono `New deck`; **H1** (Fraunces 44, line 1.05) `Create a ` + *new deck.* (italic, color `#A98EE3`); sub `Set up the shell now — add cards in a minute.` (cream-dim 15).
- **Two columns `grid 1.4fr / 1fr`, gap 28:**
  - **Left (gap 18):**
    - **Deck name** field → `Japanese Core 1k`
    - **Subject / category** field → `Languages`
    - **Description** → textarea (height 84, no-resize) prefilled with the N5–N3 blurb.
    - **Card type** → 3 tiles in a row: **Basic / Front & back** (selected — `bg #572F54`, border `rgba(242,188,255,.3)`), **Cloze / Fill the blank**, **Image / Pick the answer**. (Field labels are 11px uppercase, tracking .12em, faint, weight 600.)
  - **Right (gap 18):**
    - **Cover** → 8 swatches (50×64, radius 10) `#572F54 #3A2654 #542E40 #3F2D54 #2E2E54 #54322E #2E5454 #54462E`; first selected (pink 2px border); each shows a faint layers glyph bottom-left.
    - **Generate with AI** card (`bg rgba(169,142,227,.18)`, border `rgba(169,142,227,.3)`, radius 20, pad 18): sparkle + "Generate with AI" heading, blurb "Paste a chapter, list of terms, or transcript. We'll draft cards you can edit before they enter rotation.", then a full-width **Open generator** ghost button (purple border + text).
    - **Privacy** card: mono `Privacy` + 3 radio rows — **Private · Only you can see** (selected, pink dot), **Shared · Anyone with the link**, **Public · In the community**.
- **Footer** (right-aligned, gap 10): **Create empty deck** (ghost) · **Create &amp; add cards →** (primary).

## Screen 2 — Add card
Crumbs `Decks / 123123 / Add card`; action = **+ New deck** (primary). **Two columns `grid 1fr / 400px`, gap 56, max-width 1100.**

- **Left form:** **H1** (Fraunces 52) `Add a card.`; sub `Card 9 in 123123.` Then stacked fields (each: border line-strong, radius 14, pad 12/16/14, `bg rgba(255,255,255,.015)`):
  - **Front** — serif italic 28, faint placeholder `Type a word, phrase or prompt…`
  - chips row: **Add audio** · **Add image** (ghost, 8/16, 13px, with icons)
  - **Meaning** — 16px faint placeholder (min-height 92) `The meaning, definition or answer learners should produce.` + `0/200` counter bottom-right
  - **Tags** — label + field `Add a tag…`
  - **Difficulty** — 3 pills `Easy · Medium (selected) · Hard`; selected = `bg rgba(87,47,84,.5)`, border `rgba(169,142,227,.55)`, with a filled radio dot.
  - **Actions:** **Add & next** (ghost) · **Done** (primary).
- **Right preview:** a tall card (height 480, radius 22, `linear-gradient(160deg,#241420,#160E1A)`, border line-strong, big soft shadow) — `FRONT` mono top, `Your word…` (Fraunces 36, cream-dim) center, `Tap to flip` bottom.
- **Floating Mimi button:** bottom-right (58px round, `linear-gradient(150deg,#572F54,#2C1A2A)`, border `rgba(242,188,255,.35)`, lavender glow) with the Mimi PNG (40) + a green `#C2E083` online dot. Opens screen 3.

## Screen 3 — Add card · Mimi chat
Identical to screen 2, but: grid becomes `1fr / 340px`, gap 40, the content gets `padding-right: 360px`, the floating button is gone, and a **docked chat panel** is pinned `top 64 / right 0 / bottom 0`, width 340, `bg rgba(13,10,18,.97)`, border-left line-strong:
- **Header:** Mimi (30) + "Mimi" + green `● online` + ✕ close.
- **Messages:** Mimi bubble (left, `bg #1A1520`, radius `4 14 14 14`) "I see you're on card 9 of **123123**. Want me to draft the meaning for "Pt term 5"?"; user bubble (right, `bg #572F54`, radius `14 4 14 14`) "Yes, and add an example too."; Mimi bubble "Done — I filled in the meaning and a practice sentence. Review them on the left, or tap a quick action below."; then quick-action chips `Suggest tags · Harder example · Translate`.
- **Input:** `Ask Mimi…` + send button (primary, small).

---

## Implementation in the codebase
- **Create deck** → `app/pages/decks/create.vue`. **Add card** (+ Mimi chat) → `app/pages/decks/[id]/cards/add.vue` (the chat is a slide-in panel toggled by the floating Mimi button — same Mimi-panel component reused on the Practice "study tip" screen).
- Reuse the real `Sidebar`, `Topbar`, `UiButton` (primary/ghost), `UiInputField`, `UiTextarea`, `UiRadioGroup`, `SharedMimi`. Wire: deck create → `useDecks().create`; AI → `aiApi`; card save → `useCards().add` (`Add & next` keeps the form, `Done` returns to the deck). Copy via `useT()`.
- Honor the `showMimi` tweak: when off, the Mimi PNG in the AI Companion card / hero / floating button falls back to a plum sparkle tile.

## Acceptance checklist
- [ ] **240px labelled sidebar** (Home/All decks/Discover/Statistics/AI Assistant + Library + AI Companion) — NOT an icon rail. All decks active.
- [ ] Create deck: 1.4fr/1fr, card-type tiles, 8 cover swatches, Generate-with-AI card with **Open generator**, Privacy radios, Create empty / Create & add cards.
- [ ] Add card: 1fr/400px, Front/Meaning/Tags/Difficulty form + tall live preview + floating Mimi button.
- [ ] Mimi chat: 1fr/340px + padding-right 360 + docked chat panel (header/messages/quick actions/input).
- [ ] Matches `Deck and cards.html` at 1440×900.
