# Mnemio Backend — Build Plan (derived from the frontend)

> Companion to [`api-contract.md`](./api-contract.md). That file is the _what_ for
> the MVP core; this file is the _plan_ for building the backend the redesigned
> frontend actually needs — confirming the core, flagging FE↔contract mismatches,
> and specifying the new domains the redesign introduced.

## Context

The frontend redesign is complete and builds green. It is **hybrid** today:

- **Auth & Users are already wired to the real backend** — `app/api/auth.ts` calls
  `/auth/*` and `/users/me` through `app/utils/http.ts`, which already implements
  the contract conventions (`/api/v1` prefix, `Bearer` access token,
  `credentials:'include'` refresh cookie, `401 → /auth/refresh → retry`, error
  normalization).
- **Decks / Cards / Sessions / SRS still run on a localStorage mock** —
  `app/api/{decks,cards,sessions,srs}.ts` read/write `app/services/mockStore.ts`
  (every function takes an `ownerId`/`userId` arg the real API won't need — the
  server derives identity from the token).
- **Redesign-only features are pure client mocks**: `app/composables/useStats.ts`
  (streak, retention, reviewed, heatmaps, daily series, achievements),
  `app/composables/useDiscover.ts` (public decks/featured/categories), and
  `app/stores/preferences.ts` (favorites, interests, goal, languages, avatar hue —
  in `localStorage`).

**Goal:** define the backend — routes, payloads, data model — to (a) replace the
localStorage mocks for the core domains, and (b) power the new redesign features, so
the FE swap is mock → `http` with minimal churn.

---

## Current state — who calls what

| Domain                     | FE consumer                                | Today       | Target                     |
| -------------------------- | ------------------------------------------ | ----------- | -------------------------- |
| Auth / Users               | `app/api/auth.ts` (real `http`)            | **REAL**    | keep + small additions     |
| Decks                      | `app/api/decks.ts` (mockStore)             | MOCK        | build real                 |
| Cards                      | `app/api/cards.ts` (mockStore)             | MOCK        | build real + expand model  |
| Sessions                   | `app/api/sessions.ts` (mockStore)          | MOCK        | build real                 |
| SRS                        | `app/api/srs.ts` (mockStore)               | MOCK        | build real                 |
| Dashboard                  | not called (Home composes decks+srs+stats) | —           | build; FE adopts           |
| Statistics                 | `useStats.ts`                              | CLIENT MOCK | **NEW**                    |
| Achievements               | `useStats.achievements`                    | CLIENT MOCK | **NEW**                    |
| Preferences                | `stores/preferences.ts` (localStorage)     | CLIENT MOCK | **NEW**                    |
| Discover                   | `useDiscover.ts`                           | CLIENT MOCK | **NEW** (was "out of MVP") |
| AI (generate/suggest)      | disabled in UI                             | —           | **NEW** (optional)         |
| Media (audio/image/avatar) | disabled in UI                             | —           | **NEW** (optional)         |

**Conventions:** reuse `api-contract.md §1` verbatim (base `/api/v1`, error envelope
`{code,message,details?}`, cursor pagination `{items,nextCursor}`, rate limits).
`app/utils/http.ts` already matches them — the backend must too.

---

## Reconciliations — FE expects things the current contract doesn't say

Resolve each (recommendation in **bold**):

1. **Deck list `total`.** `app/api/decks.ts` returns `{items, nextCursor, total}`
   and `stores/decks.ts` reads `res.total`. Contract `Page<T>` has no `total`.
   → **Add `total` to `GET /decks`.**
2. **Deck detail returns the full card array.** FE `getDeck` returns `Deck` with
   `cards: Card[]`; pages assume the whole list (Deck Detail list, study queue in
   `useStudySession`, Add Card "card N" count). Contract returns
   `{deck, cards: Page<Card>}`. → **`GET /decks/:id` returns all cards inline
   (cap 1000)**; keep a paged `GET /decks/:id/cards` for later.
3. **Session field `index` vs `cardIndex`.** FE `app/types/session.ts` uses
   `index`/`correct`; contract uses `cardIndex`. → **Expose `cardIndex`** and map in
   the FE adapter (or align FE on swap).
4. **`POST /srs/rate` deckId.** FE calls `rateCard(cardId, deckId, rating)`;
   contract body is `{cardId, rating}`. → Backend **derives deckId from the card**.
   SM-2 must match `app/composables/useSpacedRepetition.ts`.
5. **Session XP** is server-computed `correct*10 + 25` — FE `computeXp` mirrors it;
   don't trust FE-sent XP.

---

## Domain specs

### 1. Auth & Users — _extend_ (mostly done)

Keep register/verify-email/resend-otp/login/refresh/logout/me + `PATCH /users/me`
(fullName, username, birthday). Ensure `User` exposes `xp`, `streak`, `createdAt`
(Profile "member since" + stat tiles read these). Avatar upload → P2.

### 2. Decks — _build real_

- `GET /decks?cursor&limit&q` → `Page<Deck> + total` (sort `updatedAt DESC`).
- `POST /decks` `{title, description, sourceLanguage, targetLanguage, coverColor?,
glyph?, subject?, isPublic?}` → Deck.
- `GET /decks/:id` → deck + full cards. `PATCH /decks/:id`, `DELETE /decks/:id`.
- **New fields:** `coverColor`, `glyph`, `subject`, `isPublic`, `copyCount`,
  `sourceDeckId`.
- **Embed per-deck stats** in deck responses: `stats {total, mastered, learning,
new, due, masteredPct}`. Today Library/Home/DeckDetail/Statistics each recompute
  this via `app/composables/useDeckStats.ts`; serving it once removes the heavy
  `srs.fetchAll()` fan-out.

### 3. Cards — _build real + expand model_

- CRUD + `POST /decks/:id/cards/bulk` (contract). `GET /decks/:id/cards` paged.
- **Expand `Card`** to match the study/add-card designs (Add Card already captures
  these but doesn't send them yet): `partOfSpeech`, `example`, `exampleTranslation`,
  `reading` (or keep `phonetic`), `tags: string[]`,
  `difficulty: 'easy'|'medium'|'hard'`, `type: 'basic'|'cloze'|'image'`,
  `audioUrl`, `imageUrl`. Replaces the client enrichment in `app/utils/studyCard.ts`.

### 4. Sessions — _build real_

Per contract (start/patch/complete/exit/resume/active/incomplete). **Add summary
fields** so Session Summary is server-backed instead of client-built in
`usePractice`/`stores/practice.ts`: per-grade `counts {again,hard,good,easy}`,
`revisitCardIds`, `durationMs`.

### 5. SRS — _build real_

`POST /srs/rate`, `GET /srs/due`, `GET /srs/progress` per contract; SM-2 identical
to `useSpacedRepetition.ts`.

### 6. Dashboard — _build; FE adopts_

`GET /dashboard` → `{stats{decks,cards,xp}, dueCount, recentDecks,
continueStudying}`. Lets `pages/dashboard.vue` drop its decks+srs+stats composition.

### 7. Statistics — _NEW_ (replaces `useStats`)

Shapes mirror `useStats.ts`:

- `GET /stats/overview?range=7|30|90|all` → `{reviewed, retention, streak,
dueCount, trends}`.
- `GET /stats/activity` → year heat (`number[][]`, weeks×7) + month calendar.
- `GET /stats/series?range` → daily `[{label, value}]`.
- `GET /stats/decks` → per-deck performance (retention, masteryPct).
- Optional P2: forecast (14-day due), study-patterns (hour×day), XP/league.
- Needs a **DailyActivity rollup** table for cheap heatmaps/streaks.

### 8. Achievements — _NEW_

`GET /achievements` → `[{id, name, note, earned, earnedAt?, progress?}]` (mirror
`useStats.achievements`). Catalog + per-user unlock, evaluated on
session-complete / rate.

### 9. Preferences — _NEW_ (replaces `stores/preferences.ts`)

- `GET /users/me/preferences`, `PATCH /users/me/preferences` →
  `{favorites: deckId[], interests: string[], goal, nativeLanguage,
learningLanguages: string[], avatarHue, mimiPlacement}`.
- Written by Onboarding, Profile edit, and deck favoriting. (Name/username/birthday
  stay on `/users/me`.) Favorites alternative: `POST/DELETE /decks/:id/favorite`.

### 10. Discover — _NEW_ (public catalog; was out-of-MVP)

- `GET /discover/decks?cursor&q&lang&sort` → `Page<PublicDeck>` (+`author`,
  `copyCount`, `cardCount`, `tag`).
- `GET /discover/featured`, `GET /discover/categories`.
- `POST /decks/:id/copy` → clone a public deck (sets `sourceDeckId`, bumps
  `copyCount`). Needs `Deck.isPublic` + catalog.

### 11. AI companion — _NEW, optional_ (UI disabled today)

- `POST /ai/generate-deck {topic}` → draft deck+cards (Create Deck "Generate with AI").
- `POST /ai/suggest` → Mimi dashboard suggestion / weakest-deck insight.

### 12. Media — _NEW, optional_ (UI disabled today)

Card audio (TTS) + image upload + avatar upload via object storage; return
`audioUrl`/`imageUrl`/`avatarUrl`.

---

## Data model additions (Prisma-style summary)

- **User**: `xp`, `streak` + relations → `Preference`, `UserAchievement`.
- **Preference** (1:1 user): `interests[]`, `goal`, `nativeLanguage`,
  `learningLanguages[]`, `avatarHue`, `mimiPlacement`, `favorites` (deckId[] or a
  `DeckFavorite` join).
- **Deck**: + `coverColor`, `glyph`, `subject`, `isPublic`, `copyCount`,
  `sourceDeckId`.
- **Card**: + `partOfSpeech`, `example`, `exampleTranslation`, `reading`, `tags[]`,
  `difficulty`, `type`, `audioUrl`, `imageUrl`.
- **StudySession**: + `countsAgain/Hard/Good/Easy`, `revisitCardIds[]`, `durationMs`.
- **CardProgress**: as contract (SM-2).
- **Achievement** (catalog) + **UserAchievement** (`earnedAt`, `progress`).
- **DailyActivity** rollup (`userId, date, reviews, correct`) for heatmaps/streak.

---

## Build phasing

- **P0 — make the FE real.** Decks, Cards, Sessions, SRS, Dashboard per contract +
  the §Reconciliations (`total`, full cards, `cardIndex`, rate deckId). Highest
  value: turns the demo into a real app.
- **P1 — redesign data.** Preferences, embedded per-deck stats, Statistics
  (overview/activity/series/decks), Achievements, expanded Card model.
- **P2 — growth.** Discover (catalog + copy), AI generate/suggest, Media,
  study-patterns/XP/league.

## FE swap checklist (when each domain lands)

- Rewrite `app/api/{decks,cards,sessions,srs}.ts` to call `http(...)` (drop the
  `ownerId`/`userId` params) — mirror `app/api/auth.ts`. Update call sites in
  `app/stores/{decks,sessions,srs}.ts`.
- Replace `useStats`/`useDiscover` with `http`-backed composables; make
  `usePreferences` read/write `/users/me/preferences` (keep localStorage as cache).
- Wire the built-but-inert inputs: Add Card `tags/difficulty/media`, Create Deck
  `coverColor/type/privacy`, "Generate with AI", deck favorites, audio buttons.
- Map `index`↔`cardIndex` in the api adapter.

## Open questions

1. **Scope now:** P0-only, or P0+P1 in the first pass? P2 later?
2. **Per-deck stats:** embed in deck responses (recommended) vs `/decks/:id/stats`?
3. **Favorites:** `Preference.favorites` vs dedicated `DeckFavorite` / endpoints?
4. **Card model:** add rich fields now (one migration) vs enrich only at study time?
5. **Stack:** confirm Fastify + Prisma + Postgres (as `api-contract.md` implies).

## Verification

- Backend: `api-contract.md §5` smoke (register→verify→me) + curl per new route;
  unit tests for SM-2 (match `useSpacedRepetition.ts`) and session XP
  (`correct*10+25`).
- FE integration: point `NUXT_PUBLIC_API_BASE` at the backend, flip **one domain at
  a time** mock→`http`, run `npm run build`, then walk create deck → add cards →
  practice (rate) → summary → dashboard/stats reflect XP/streak.
