# Mnemio Backend — API Contract for Frontend Integration

> Authoritative spec of what the backend must implement to satisfy the current
> `mnemio-frontend` codebase. Everything below is exercised by Phase 1–4 of
> the frontend's MVP. If the backend implements *exactly* this, the frontend
> cuts over by swapping `app/api/*.ts` and nothing else.
>
> Read [`backend-plan.md`](./backend-plan.md) for the *why*; this file is the *what*.

---

## 1. Conventions

### Base URL
- All endpoints prefixed `/api/v1`.
- Dev: backend on `http://127.0.0.1:3001`, frontend on `http://localhost:3000`.
- Configured via `NUXT_PUBLIC_API_BASE` on the frontend (default `http://127.0.0.1:3001`).
- CORS: backend must allow origin `http://localhost:3000` **with credentials**
  (no wildcards — `Access-Control-Allow-Credentials: true` requires an explicit origin).

### Authentication

**Two-token scheme:**
- **Access token** — JWT (HS256), 15-min TTL. Claims: `sub` (userId), `emailVerified`, `role`.
  Stored in `localStorage` on the frontend. Sent as `Authorization: Bearer <token>`
  on every authenticated request.
- **Refresh token** — opaque random string (≥ 32 bytes of entropy), 30-day TTL,
  **stored in an HttpOnly + Secure + SameSite=Lax cookie** named `mnemio_refresh`
  (path `/api/v1/auth`). The frontend never reads or writes this cookie directly —
  it just sends every request with `credentials: 'include'` (already wired in
  `app/utils/http.ts`).
- Refresh rotates on every `/auth/refresh`. Old token is revoked.
  **Reuse detection**: presenting a revoked refresh cookie revokes *all* of that
  user's refresh tokens — the next `/auth/refresh` returns 401 `AUTH_INVALID_REFRESH`
  and the frontend hard-logs-out.

**Public endpoints (no access token required):**
- `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-otp`
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- OAuth endpoints (when added)
- `GET /health`

All other endpoints require a valid access token.

### Request / response format
- Bodies and responses are JSON (`Content-Type: application/json`).
- All timestamps are ISO 8601 UTC strings (`2026-05-25T17:42:00.000Z`).
- `birthday` is `MM/DD/YYYY` (matches what the frontend form captures) **or**
  `YYYY-MM-DD` if the backend prefers — pick one and we'll normalize on the FE.
  *Recommend `MM/DD/YYYY` to avoid a frontend change.*
- IDs are UUID strings (v7 recommended for index locality).

### Error envelope
Every error response — for every status code — follows this shape:

```ts
type ApiError = {
  code: string;                       // SCREAMING_SNAKE
  message: string;                    // human-readable English; i18n is FE's job
  details?: Record<string, unknown>;  // optional, e.g. per-field validation
};
```

This matches `ApiError` in [`app/composables/useAsync.ts`](../app/composables/useAsync.ts).
The frontend's [`http`](../app/utils/http.ts) wrapper already normalizes anything
that doesn't match into this shape — but the backend should produce it directly.

Status code → meaning:

| Status | Meaning |
|---|---|
| 400 | Validation error (`VALIDATION_ERROR`, or domain-specific code) |
| 401 | Unauthenticated (bad / expired access token, bad credentials) |
| 403 | Authenticated but not allowed (e.g. ownership check failed) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email / username) |
| 422 | Business-rule violation |
| 429 | Rate-limited |
| 500 | Internal — backend bug |

**Error codes the frontend already handles by name (don't rename them):**

| Code | Endpoint(s) | Frontend UX |
|---|---|---|
| `VALIDATION_ERROR` | any | Show inline field errors from `details` |
| `AUTH_EMAIL_TAKEN` | `POST /auth/register` | Toast: "An account with this email already exists." |
| `AUTH_INVALID_CREDENTIALS` | `POST /auth/login` | Toast: "Email or password is incorrect." (same code for "no user" and "wrong pw" — don't leak enumeration) |
| `AUTH_INVALID_CODE` | `POST /auth/verify-email` | Inline error on the OTP input |
| `AUTH_OTP_EXHAUSTED` | `POST /auth/verify-email` | "Too many attempts. Request a new code." |
| `AUTH_OTP_COOLDOWN` | `POST /auth/resend-otp` | "Wait {N}s before requesting another code." (FE reads `details.cooldownSeconds`) |
| `EMAIL_NOT_VERIFIED` | `POST /auth/login` | Route the user to the OTP step; `details.userId` must be included |
| `AUTH_INVALID_TOKEN` | any auth-required endpoint | http wrapper calls `/auth/refresh` once, retries; if refresh fails → log out |
| `AUTH_INVALID_REFRESH` | `POST /auth/refresh` | Hard log-out; cookie cleared |
| `AUTH_USER_NOT_FOUND` | `PATCH /users/me` | Toast |
| `AUTH_USERNAME_TAKEN` | `PATCH /users/me` | Inline error on the `username` field |
| `DECK_NOT_FOUND` / `CARD_NOT_FOUND` / `SESSION_NOT_FOUND` | resource routes | Toast + redirect to listing |
| `DECK_LIMIT_REACHED` | `POST /decks` | "Maximum 200 decks per user." (frontend already limits at 200) |
| `CARD_LIMIT_REACHED` | `POST /decks/:id/cards` | "Maximum 1000 cards per deck." |
| `SESSION_EMPTY_DECK` | `POST /sessions` | Disable the "Study" CTA when `cardCount === 0` |
| `RATE_LIMITED` | any | Toast: "Too many requests." |

### Rate limiting
- Global default: 120 req/min/IP.
- `/auth/register`, `/auth/login`: 10 req/min/IP.
- `/auth/verify-email`: 5 attempts per OTP code (then `AUTH_OTP_EXHAUSTED`).
- `/auth/resend-otp`: 1 req/min per user (60-second cooldown).
- `/auth/refresh`: 30 req/min/IP.
- On 429, return the standard envelope with `code: 'RATE_LIMITED'`.

### Pagination
Cursor-based, opaque. Send `?cursor=<opaque>&limit=<n>`; receive
`{ items, nextCursor, total }`. `nextCursor` is `null` when no more pages.
Hard cap on `limit`: 100.

The frontend currently encodes cursors as `btoa("offset:N")` in its mock; the
backend is free to use any opaque format (e.g. base64 of `last_id|last_updated_at`
for keyset pagination). Treat as black-box on both sides.

```ts
type Page<T> = {
  items: T[];
  nextCursor: string | null;
  total: number;
};
```

---

## 2. Domain types (response shapes)

These match the frontend's TypeScript interfaces verbatim. Field order is not
significant; presence and types are.

```ts
// app/types/user.ts
type User = {
  id: string;                  // uuid
  email: string;
  displayName: string | null;  // null until profile completion
  username: string | null;     // null until profile completion
  birthday: string | null;     // 'MM/DD/YYYY' or null
  createdAt: string;           // ISO
};

// app/types/deck.ts
type Deck = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  sourceLanguage: string;      // ISO 639-1, e.g. 'en'
  targetLanguage: string;
  isPublic: boolean;           // always false at MVP
  cards: Card[];               // nested in GET /decks/:id; absent in list responses
  createdAt: string;
  updatedAt: string;
};

type DeckSummary = Omit<Deck, 'cards'> & { cardCount: number };

type Card = {
  id: string;
  deckId: string;
  word: string;
  definition: string;
  phonetic: string | null;
  position: number;            // 0-indexed, server-assigned on create
  createdAt: string;
  updatedAt: string;
};

// app/types/srs.ts
type CardProgress = {
  cardId: string;
  deckId: string;
  easeFactor: number;          // SM-2, min 1.3
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;        // ISO
  lastReviewedAt: string | null;
};

type SrsRating = 'again' | 'hard' | 'good' | 'easy';
// Server-side mapping to SM-2 quality: again=0, hard=3, good=4, easy=5

// app/types/session.ts
type StudyMode = 'flashcard' | 'multiple-choice' | 'srs';
type SessionStatus = 'active' | 'incomplete' | 'complete';

type StudySession = {
  id: string;
  userId: string;
  deckId: string;
  mode: StudyMode;
  cardIds: string[];           // snapshot of the queue at session start
  index: number;               // 0-indexed cursor into cardIds
  correct: number;
  xpAwarded: number;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
};
```

### `needsProfile` flag
Login / verify-email / refresh / `GET /auth/me` responses all include
`needsProfile: boolean` alongside `user`. It's `true` when `user.username` is `null`.
The frontend uses this flag — not local heuristics — to route the user to the
account-details step.

---

## 3. Endpoint reference

### 3.1 Auth

#### `POST /auth/register`  *(public)*
Create an unverified user; trigger OTP email. **No tokens issued.**
```ts
// Request
{ email: string; password: string }   // password ≥ 8 chars

// 201 Response
{ userId: string; email: string }

// Errors
// 409 AUTH_EMAIL_TAKEN
// 400 VALIDATION_ERROR
```

#### `POST /auth/verify-email`  *(public)*
Consume an OTP code; on success, mark verified, issue tokens, set refresh cookie.
```ts
// Request
{ userId: string; code: string }      // code: 6 digits

// 200 Response
// Set-Cookie: mnemio_refresh=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth
{
  accessToken: string;
  user: User;
  needsProfile: boolean;
}

// Errors
// 400 AUTH_INVALID_CODE
// 400 AUTH_OTP_EXHAUSTED
```

#### `POST /auth/resend-otp`  *(public)*
60-second cooldown per user.
```ts
// Request
{ userId: string }

// 200 Response
{ ok: true; cooldownSeconds: number }

// Errors
// 429 AUTH_OTP_COOLDOWN  (details.cooldownSeconds = remaining seconds)
```

#### `POST /auth/login`  *(public)*
```ts
// Request
{ email: string; password: string }

// 200 Response
// Set-Cookie: mnemio_refresh=<opaque>; HttpOnly; Secure; SameSite=Lax
{
  accessToken: string;
  user: User;
  needsProfile: boolean;
}

// Errors
// 401 AUTH_INVALID_CREDENTIALS
// 401 EMAIL_NOT_VERIFIED  (details.userId — route to OTP step)
```

#### `POST /auth/refresh`  *(public)*
Reads `mnemio_refresh` cookie, rotates it, returns a new access token.
```ts
// Request: empty body (refresh is in cookie)
// Set-Cookie: mnemio_refresh=<NEW>; HttpOnly; Secure; SameSite=Lax
// 200 Response — same shape as login
{ accessToken, user, needsProfile }

// Errors
// 401 AUTH_INVALID_REFRESH  (cookie missing, expired, or rotated)
//   → frontend clears accessToken from localStorage and redirects to /login
```

#### `POST /auth/logout`  *(public)*
Reads refresh cookie, revokes that single session, clears the cookie.
```ts
// Request: empty body
// 204 No Content
// Set-Cookie: mnemio_refresh=; Max-Age=0  (cleared)
```
Frontend also clears the access token from localStorage after this call.

#### `GET /auth/me`  *(auth)*
```ts
// 200 Response
{ user: User; needsProfile: boolean }

// Errors
// 401 AUTH_INVALID_TOKEN  → http wrapper auto-retries via /auth/refresh
```

### 3.2 Users

#### `PATCH /users/me`  *(auth)*
Profile-completion step (after OTP) and any later edits.
```ts
// Request — frontend currently sends all three at once
{
  fullName: string;   // 1+ chars; trimmed; stored as User.displayName
  username: string;   // /^[a-zA-Z0-9_]{3,20}$/, case-insensitive uniqueness
  birthday: string;   // 'MM/DD/YYYY'; must be ≥ 13 years ago
}

// 200 Response: User

// Errors
// 400 VALIDATION_ERROR        (bad username format, age < 13)
// 409 AUTH_USERNAME_TAKEN
// 404 AUTH_USER_NOT_FOUND
```

Field naming: the frontend sends `fullName` (form field); the backend stores it
as `displayName` on the `User`. Keep that mapping server-side.

### 3.3 Decks

#### `GET /decks`  *(auth)*
```ts
// Query
?cursor?=string&limit?=number(default 20, max 100)&q?=string

// 200 Response: Page<DeckSummary>
//   items: DeckSummary[]   (no nested cards; cardCount only)
//   nextCursor: string | null
//   total: number
```
- `q` is case-insensitive `contains` over `title` and `description`.
- Sort: `updatedAt DESC, id DESC` (stable for keyset pagination).

#### `POST /decks`  *(auth)*
```ts
// Request
{
  title: string;                   // 2–120 chars
  description: string | null;      // null or ≤ 500 chars
  sourceLanguage: string;          // ISO 639-1
  targetLanguage: string;          // must differ from sourceLanguage
}

// 201 Response: Deck  (with cards: [])

// Errors
// 422 DECK_LIMIT_REACHED  (user already has 200 decks)
// 400 VALIDATION_ERROR
```

#### `GET /decks/:id`  *(auth)*
Returns the deck **with all cards nested**. The frontend reads `deck.cards` directly
and paginates client-side at 50 per page (cards are capped at 1000 per deck).
```ts
// 200 Response: Deck
//   (cards sorted by position ASC, id ASC)

// Errors
// 404 DECK_NOT_FOUND
// 403 if user doesn't own the deck
```

> Backend may switch to paginated cards later; if it does, change the FE store
> at the same time. For now, nested is simplest and within the 1000-card cap.

#### `PATCH /decks/:id`  *(auth)*
```ts
// Request: any subset of { title, description, sourceLanguage, targetLanguage }
// 200 Response: Deck

// Errors
// 404 DECK_NOT_FOUND
```

#### `DELETE /decks/:id`  *(auth)*
```ts
// 204 No Content
// Cascade: deletes the deck's cards, card progress, and any sessions on it.

// Errors
// 404 DECK_NOT_FOUND
```

### 3.4 Cards

#### `POST /decks/:id/cards`  *(auth)*
```ts
// Request
{
  word: string;             // 1–120 chars
  definition: string;       // 1–500 chars
  phonetic: string | null;  // null or ≤ 120 chars
}

// 201 Response: Card
//   position = max(existing positions) + 1, or 0 if empty

// Errors
// 422 CARD_LIMIT_REACHED  (deck has 1000 cards)
// 404 DECK_NOT_FOUND
```

#### `PATCH /cards/:id`  *(auth)*
```ts
// Request: any subset of { word, definition, phonetic }
// 200 Response: Card

// Errors
// 404 CARD_NOT_FOUND
// 403 if user doesn't own the parent deck
```

#### `DELETE /cards/:id`  *(auth)*
```ts
// 204 No Content
// Side effect: remaining cards in the deck get position renumbered to 0..N-1
//              (this matches frontend behavior).

// Errors
// 404 CARD_NOT_FOUND
```

### 3.5 Sessions

The frontend's `sessions` store calls these on study-engine and review flows.

#### `POST /sessions`  *(auth)*
Start a new study session. **Side effect:** if the user has an `active` session
already, it is atomically marked `incomplete` (and pushed onto the user's
incomplete list, capped at 10) before the new one is created. This is what
satisfies the FE's "only one active session at a time" invariant.

```ts
// Request
{
  deckId: string;
  mode: 'flashcard' | 'multiple-choice' | 'srs';
  cardIds: string[];     // FE-supplied snapshot; backend stores verbatim
}

// 201 Response: StudySession
//   status: 'active', index: 0, correct: 0, xpAwarded: 0

// Errors
// 400 SESSION_EMPTY_DECK   (cardIds is empty)
// 404 DECK_NOT_FOUND
```

> Note: the FE supplies `cardIds` so the deck-fetch logic stays client-side
> for now. Backend can change this contract later (e.g. server-side card
> shuffling) without affecting the rest.

#### `PATCH /sessions/:id`  *(auth)*
Append progress mid-session.
```ts
// Request: subset of { index: number, correct: number }
// 200 Response: StudySession

// Errors
// 404 SESSION_NOT_FOUND   (also returned if the session is no longer 'active')
```

#### `POST /sessions/:id/complete`  *(auth)*
Close the session and award XP.
```ts
// Request
{ xpAwarded: number }       // FE computes via correct*10 + 25; backend SHOULD
                            // recompute server-side and ignore the body value
                            // (server is the authority — see backend-plan §9.7)

// 200 Response: StudySession
//   status: 'complete', xpAwarded set, endedAt set

// Errors
// 404 SESSION_NOT_FOUND
// 422 SESSION_NOT_ACTIVE
```

#### `POST /sessions/:id/exit`  *(auth)*
User left mid-session. Marks `active` → `incomplete`, pushes to incomplete list.
```ts
// Request: empty body
// 204 No Content

// Errors
// 404 SESSION_NOT_FOUND   (or already not active — return 204 in that case)
```

#### `POST /sessions/:id/resume`  *(auth)*
Resume an incomplete session. If another session is currently `active`, it gets
ended-as-incomplete first (same rule as `POST /sessions`).
```ts
// Request: empty body
// 200 Response: StudySession  (status: 'active', endedAt: null)

// Errors
// 404 SESSION_NOT_FOUND
```

#### `GET /sessions/active`  *(auth)*
```ts
// 200 Response: { session: StudySession | null }
```
Called on app boot (frontend's `sessions.hydrate()`).

#### `GET /sessions/incomplete`  *(auth)*
Most-recent-first, capped at 10.
```ts
// 200 Response: { sessions: StudySession[] }
```
The frontend reads `sessions[0]` as `latestIncomplete` (powers the
"Continue studying" CTA on the dashboard).

### 3.6 SRS

#### `GET /srs/progress`  *(auth)*
Returns all `CardProgress` rows for the user — used to compute the due queue
client-side.
```ts
// 200 Response
{ progress: Record<cardId, CardProgress> }
```
Optimization note: filter server-side to only cards inside decks the user still
owns. If progress grows past a few thousand rows, swap this for a paginated
`GET /srs/due?limit=50` and update the FE store at the same time.

#### `POST /srs/rate`  *(auth)*
Rate a card. Server runs SM-2 and upserts the user's `CardProgress`.
**A `CardProgress` row is created on first rate**, not when the card is created.

```ts
// Request
{ cardId: string; deckId: string; rating: SrsRating }
// rating: 'again' | 'hard' | 'good' | 'easy'
// Server maps to SM-2 quality: again=0, hard=3, good=4, easy=5

// 200 Response: CardProgress

// Errors
// 404 CARD_NOT_FOUND
// 403 if user doesn't own the parent deck
```

The frontend's pure SM-2 implementation lives at
[`app/composables/useSpacedRepetition.ts`](../app/composables/useSpacedRepetition.ts).
Backend must produce **identical** outputs — port the same algorithm and the
same test cases. Specifically:
- Quality < 3 → repetitions = 0, intervalDays = 1.
- Quality ≥ 3 → repetitions++; intervalDays = 1, 6, or round(prev × ease).
- easeFactor += 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02); clamped at 1.3.
- nextReviewAt = now + intervalDays.

### 3.7 Health

#### `GET /health`  *(public, no `/api/v1` prefix)*
```ts
// 200 Response: { status: 'ok' }
```

---

## 4. Frontend wiring notes

### Token storage / lifecycle
1. On `login` / `verify-email` / `refresh`:
   - Persist `accessToken` to localStorage.
   - Refresh token arrives in `Set-Cookie` (HttpOnly, never read by FE).
2. The [`http`](../app/utils/http.ts) wrapper:
   - Sends `Authorization: Bearer <accessToken>` if present.
   - Sends every request with `credentials: 'include'` so the refresh cookie tags along.
   - On 401 with `code: 'AUTH_INVALID_TOKEN'`, calls `POST /auth/refresh` once
     (the cookie does the work), updates `accessToken`, retries the original request.
   - On 401 with `code: 'AUTH_INVALID_REFRESH'`, hard log-out — clears
     accessToken, navigates to `/login`.
3. On `logout`: `POST /auth/logout` (backend clears the cookie), then clear
   accessToken locally.

### Auth-flow state machine
```
register(email, password)
  → 201 { userId, email }
     → go to OTP step (carry userId)

verify-email(userId, code)
  → 200 { accessToken, user, needsProfile } + cookie set
     → if needsProfile → account-details step
     → else → /dashboard

login(email, password)
  → 200 → if needsProfile → account-details step; else /dashboard
  → 401 EMAIL_NOT_VERIFIED → OTP step with details.userId
```

### Session-flow contract
- Starting / resuming a session implicitly ends any currently `active` one.
- Don't trust `xpAwarded` from the client; recompute server-side.
- "Continue studying" CTA = `sessions[0]` from `GET /sessions/incomplete`.

### Pagination wiring
Stash `nextCursor` per list view; "Load more" passes it as `?cursor`. `null`
means no more pages. Don't try to compute totals on the client.

---

## 5. Local development

1. **Backend up:** `http://127.0.0.1:3001` (configurable via `NUXT_PUBLIC_API_BASE`).
2. **OTP in dev:** print to backend stdout (e.g. `MAIL_PROVIDER=console`).
   The frontend's OTP step accepts any 6 digits in mock mode; once backend is wired,
   real codes come from the backend's log.
3. **CORS:** must include `Access-Control-Allow-Origin: http://localhost:3000` and
   `Access-Control-Allow-Credentials: true`. No wildcard.
4. **Cookies in dev over HTTP:** `Secure` cookies don't work on plain `http://`.
   Either (a) serve dev backend over HTTPS, or (b) relax `Secure` only when
   `NODE_ENV !== 'production'`.
5. **Smoke (curl):**
   ```bash
   BASE=http://127.0.0.1:3001/api/v1
   curl -isX POST "$BASE/auth/register" -H 'content-type: application/json' \
        -d '{"email":"alice@example.com","password":"hunter22!"}'
   # → 201 { "userId": "...", "email": "alice@example.com" }
   # grab the OTP from backend stdout
   curl -isX POST "$BASE/auth/verify-email" -H 'content-type: application/json' \
        --cookie-jar /tmp/cookies.txt \
        -d '{"userId":"<id>","code":"123456"}'
   # → 200 { "accessToken": "...", "user": {...}, "needsProfile": true }
   # → Set-Cookie: mnemio_refresh=...
   ```

---

## 6. Out of scope at MVP

The frontend never calls (and the backend should 404) any of these:
- Password reset / forgot-password.
- File uploads (avatar).
- OAuth (Apple / Facebook / Google) — UI buttons exist but have no handlers yet.
  Add when those click handlers go in.
- `POST /decks/:id/cards/bulk` (paste-import) — no UI consumer yet.
- `GET /dashboard` aggregation — frontend parallel-fetches and that's fine for now.
- `GET /srs/due` — frontend computes due client-side from `GET /srs/progress`.
  Add if progress rows grow past a few thousand per user.
- Public deck browsing / explore / clone.
- Folders, achievements, leagues.
- Account deletion (`DELETE /users/me`) — Phase 5 hardening.
- WebSockets / push notifications.

If any of these is needed sooner, file it as an addition to `backend-plan.md` §10
(Phase 5) before wiring the frontend.

---

## 7. Diff vs prior version of this contract

For reviewers who read the previous draft, the changes are:
- **Ports flipped:** backend `:3001`, frontend `:3000` (was the other way around).
- **Refresh token moved from localStorage to HttpOnly cookie.** All endpoints
  that returned `refreshToken` in the body now set a cookie instead.
  `POST /auth/logout` body changed to empty.
- **Session shape matches the FE's `StudySession` type:** `index` (was `cardIndex`),
  `correct` (was `cardsStudied`/`correctAnswers`), `endedAt` (was `completedAt`).
- **`POST /sessions/:id/exit`** added (FE calls it; was missing from prior spec).
- **`GET /sessions/active`** + **`POST /sessions/:id/resume`** added.
- **`POST /srs/rate`** now accepts an `SrsRating` string (`'again' | 'hard' | 'good' | 'easy'`)
  + a `deckId` parameter, matching the FE call site. Server maps to SM-2 quality internally.
- **`GET /srs/progress`** replaces (and is simpler than) `GET /srs/due` for MVP.
- **`GET /decks/:id`** returns the deck with **nested cards**, not paginated cards.
- **`GET /dashboard` removed** from MVP (FE parallel-fetches instead).
- **`POST /decks/:id/cards/bulk` removed** (no UI consumer).
- **User type simplified:** dropped `avatarUrl`, `xp`, `streak`, `role`, `emailVerified`
  — none of these are read by the FE yet. Add them back when their UI gets built.
