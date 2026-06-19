# Screens — per-screen restyle notes

Each section: **real file** → what to change → components/data it uses. Match `Mnemio Desktop.html` / `Mnemio Mobile.html` visually.

---

## Home / Dashboard — `app/pages/dashboard.vue`
**Goal: calmer, one dominant action** (prototype "Home · v2 calmer").
- Lead with a **hero "Today's review"** card: due count + estimated minutes + one big **Start review** button (→ `/review`). Mimi sits inside the hero with a one-line suggestion (from `ai.ts → suggest('dashboard')`).
- Below, two columns: **"Up next"** (decks with due cards, each row = color bar · name · % · **Practice** button) and **"This week"** (7-day strip with per-day card counts + a weekly-goal bar + two stats: *days practiced*, *cards reviewed*).
- Remove the old crowded stack (separate AI banner, full month calendar, big recent-deck cards).
- Components: `dashboard/ContinueStudying.vue`, `dashboard/ReviewCount.vue`, `shared/Mimi.vue`, `shared/ProgressBar.vue`. Data: `stores/srs.ts` (`dueCount`), `stores/decks.ts`.
- **No streak.** "This week" replaces any streak counter.

## All decks — `app/pages/decks/index.vue`
- Apply **vibrant cover gradients** (`coverGradientFor`) to `shared/DeckCard.vue` via `shared/CoverArt.vue`.
- Favorites = a chip in `shared/FilterChips.vue` (not nav). Sort via `shared/SortMenu.vue`.
- Remove any flame/streak badges on cards.

## Discover — `app/pages/discover.vue`
- **Move "Browse by category" above** the featured + all-decks grids (it's a starting point, not a footer). Order: search/filters → **categories** → featured → all decks → Mimi CTA.
- Vibrant covers on featured (big) and grid cards. Data: `composables/useDiscover.ts`.

## Statistics — `app/pages/statistics.vue`
- 4 **colored** stat tiles (plum/blue/green/pink — see tokens.md).
- **Add "Weakest decks"** block right under the tiles: 4-col, sorted by mastery ascending; each card has a deck-color bar, name, **% bar colored by value** (red <40, amber <65, green ≥65), due pill, **Review** button. Data: sort `stores/decks.ts` by mastery.
- Keep heatmap (`shared/ActivityHeatmap.vue`), reviewed-cards bar chart, and Mimi insight (`ai.ts → suggest('dashboard')`). Range chips (7d/30d/90d/All) in the header.

## Profile — `app/pages/profile.vue`
- **Two tabs only: Edit profile · Achievements** (remove the Overview tab; default to Edit).
- Sidebar card: avatar, @username, language pills, **"At a glance"** (Days practiced · Reviewed · Decks · Retention — no streak).
- Achievements: `composables/useAchievements.ts` + `api/achievements.ts`; earned = trophy + plum glow, locked = faded lock.

## AI Assistant — `app/pages/ai.vue` (+ `components/ai/ChatSidebar.vue`, `composables/useChat.ts`)
- **Already exists** — restyle to the prototype: user bubbles (right, plum) · Mimi bubbles (left, surface) with inline draft-card previews (`components/ai/DeckCard.vue`), quick-action pills, textarea + send, and a sticky **deck summary panel** (name, card count, language, level, Save).
- Keep it **simple** — one clear conversation + the working-deck summary. Wire to `ai.ts`: `generateDeck()` / `enrichWords()`, save via `stores/decks.ts`.

## Practice — `app/pages/review/*` + `study/*`
**Match the live app exactly** (prototype rebuilt to your real Review screens):
- Minimal top bar: brand + progress dashes (`study/ProgressDots.vue`) + "X left" + End session.
- **Front:** centered landscape card, deck pill, large serif word, Space-to-reveal keycap (`study/Keycap.vue`). `study/FlashCard.vue` (mask-sweep reveal already built).
- **Revealed:** two-column purple card (word + Listen / Meaning) + **vibrant rating row** (`study/RatingRow.vue`).
- **Tip button** (minimal pill, top-right of meaning) → opens a docked **AI tip chat** from the right (desktop) / **bottom sheet** (mobile). Include the note: *"tips don't affect your rating."* Wire to `ai.ts → suggest('review', deckId)`.
- Mimi sits bottom-right with a short bubble (hide when the tip chat is open).
- Data: `stores/practice.ts`, `composables/usePractice.ts` / `useStudySession.ts` / `useSpacedRepetition.ts`.

## Add card — `app/pages/decks/[id]/cards/*` + `components/deck/Form.vue`
- Match prototype: "Add a card." headline, **Front** field, Add audio / Add image chips, **Meaning** (0/200 counter), **Tags** (`ui/ChipInput.vue`), **Difficulty** radio pills (`ui/RadioCards.vue`, Medium default), Add & next / Done.
- Live **card preview** on the right (`shared/CardPreview.vue`).
- **Floating Mimi button** bottom-right → expands a **docked chat panel** (right) that drafts the meaning/example in context. Wire to `ai.ts → enrichWords()`. Form shifts left when panel is open.

## Create deck — `app/pages/decks/create.vue` + `components/deck/Form.vue`
- Name, subject, card type, **vibrant cover picker** (the gradient set), language. Standard form restyle.

## Auth / onboarding — `app/pages/{login,register,...}` + `components/login/*`
- Restyle to the plum/cream system; side-panel + form layout per prototype. Components already exist (`AuthForm`, `RegisterEmail`, `RegisterAcountDetails`, `ui/InputField`, `ui/InputOtp`).

## Landing — `app/pages/index.vue` + `components/landing/*`, `components/marketing/*`
- Push personality per `Mnemio AI Flashcard Maker.html`: input-first hero (the generator), how-it-works, card anatomy, inputs, features, study modes, export/Anki, testimonials, FAQ, CTA. Wire the hero generate to `ai.ts`.

---

## Mobile specifics — `mobile-screens.jsx` reference
- **One shared bottom tab bar on every main screen**: Home · Decks · **Mimi (center, raised)** · Stats · Profile. No per-page variants.
- Mobile has the same new screens: **AI chat** (full screen) and **Practice tip** (bottom sheet).
- No streaks (removed from Home + All decks).
