# Mnemio — technical context snapshot

**Snapshot date:** 2026-10-08
**Scope:** engineering only — stack, architecture, data model, contracts,
environments, gotchas. The product view (what it is, who for, pricing,
competitors, unit economics) is in `01-product-context.md`; don't duplicate it
here.
**Compiled from:** both repos' source, `mnemio-backend/docs/api-contract.md`,
the Prisma schema, env config, and git history. Where a repo doc is out of date
it is called out in [§12 Known-stale documents](#12-known-stale-documents).

---

## 1. What the system does (one paragraph)

Mnemio is a flashcard / spaced-repetition app at mnemio.xyz: decks of cards,
study sessions in six modes, an SM-2 scheduler driving a daily review queue, a
public deck catalogue that is SSR-rendered for crawlers, XP / streaks /
achievements / stats, AI card generation (word list, topic, photo), an AI chat
tutor ("Mimi") with tool use, and Paddle subscriptions that gate AI volume.
Two repos, one developer, EN + UK interface.

**Everything product-level — audience, competitors, monetization rationale,
costs, unit economics, channels — is in `01-product-context.md`.**

The user-visible core loop, for grounding: create or copy a deck → AI fills in
the cards → study session in a chosen mode → grade each answer (again / hard /
good / easy) → SM-2 sets the next due date → the review queue brings the card
back → XP, streak, achievements and stats close the loop.

---

## 2. Status snapshot (as of the date above)

| Area           | State                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend API    | Feature-complete per contract: **66 endpoints** under `/api/v1` + `/health` + `/ready` + static `/media/*`.                                                                                                       |
| Auth           | Email + password with OTP email verification, Google OAuth, refresh-token rotation with reuse detection. No password reset / email change (deferred).                                                             |
| Decks & cards  | Full CRUD, bulk add (≤100), copy public deck, import/export.                                                                                                                                                      |
| Study & SRS    | Sessions with one-active-per-user invariant, server-computed XP, SM-2 (`again→0, hard→2, good→3, easy→5`, EF floor 1.3), review queue, local-day bucketing by user timezone.                                      |
| AI             | Live **Anthropic** provider (Claude Haiku 4.5) with a mock provider for dev; enrich-words, generate-deck, deck-from-image, suggest (Mimi nudges), all SSE-streamable. Per-user daily caps.                        |
| Chat (Mimi)    | Persisted conversations + messages, SSE streaming, tool use (`create_deck`, `add_cards`), partial-reply recovery, per-day cap.                                                                                    |
| Billing        | **Paddle** (migrated off Stripe in Sep/Oct 2026): overlay checkout, localized price preview, webhook fulfillment with an idempotency ledger, customer portal, `plan: 'free' \| 'premium'` on every auth response. |
| Gamification   | XP, streaks, 7-entry achievement catalogue with unseen/ack endpoints. No leagues or leaderboards (deferred — needs a social graph).                                                                               |
| Stats          | Overview with trends, daily series, 53-week heatmap + month calendar, per-deck retention/mastery, study-time, decks-studied, card series.                                                                         |
| Discover / SEO | Public no-auth endpoints, SSR public deck pages, sitemap source, robots allow-list, blog (static data in `app/data/blog.ts`), SEO landing pages.                                                                  |
| Analytics      | Mixpanel + GA4 via `app/analytics/*`, typed event catalogue, paywall funnel events.                                                                                                                               |
| i18n           | EN + UK, parity enforced in CI (`npm run i18n:check`).                                                                                                                                                            |
| Testing        | Backend: Vitest (SM-2, XP, pagination, auth/OAuth integration, stats, ai-budget). Frontend: **no test runner** — verification is `npm run validate` + `npm run typecheck` + manual.                               |
| Deployment     | Backend: Railway (`railway.json`, Dockerfile, Postgres). Frontend: Dockerfile present; `site.url = https://mnemio.xyz`. ⚠️ confirm the current FE host (Vercel per old README).                                   |

Recent direction (from git history, newest first): Paddle billing migration →
brand refresh (logo/favicon/OG) → legal pages (refund policy, billing terms) →
a large September 2026 QA/audit batch that fixed chat honesty, i18n leakage,
stats consistency, auth stability and SRS queue performance.

---

## 3. Repos, stack, commands

### `mnemio-frontend`

Nuxt 4 (`compatibilityDate 2025-07-15`) · Vue 3 `<script setup>` · TypeScript
strict · Pinia (setup stores) · Tailwind + shadcn-vue (`new-york`, reka, lucide)
· `@nuxtjs/i18n` (no_prefix, en/uk) · `@nuxtjs/color-mode` · `@nuxt/image` ·
`@nuxtjs/sitemap` + `robots` · `@vueuse/nuxt` + `@vueuse/motion` · vee-validate

- zod · `@paddle/paddle-js` · mixpanel-browser · marked + dompurify.
  npm package name is still `quizlet` (legacy). Node ≥ 22.

```bash
npm run dev        # needs the backend on :3001
npm run validate   # lint + format:check  ← run before calling work done
npm run typecheck  # vue-tsc
npm run ci         # i18n:check + build + validate
```

### `mnemio-backend`

Fastify 5 · TypeScript · Prisma 7 (`@prisma/adapter-pg`) · PostgreSQL 17 ·
Zod · `@fastify/jwt` (HS256, 15 min access) + `@fastify/cookie` (30-day
rotating refresh) · argon2id · arctic (Google OAuth) · `@anthropic-ai/sdk` ·
`@paddle/paddle-node-sdk` · `@fastify/rate-limit` · `@fastify/multipart` ·
node-cron · Sentry · mixpanel (server) · Vitest.

```bash
npm run dev            # tsx watch :3001
npm test               # vitest
npm run typecheck
npm run seed           # demo@mnemio.local / demo-password-123
npm run prisma:migrate
```

Layering: `routes/ → controllers/ → services/ → repositories/ → Prisma`, with
`schemas/` (Zod) and `shared/{errors,pagination,mappers}`. Ownership checks live
in the **repository** layer so controllers can't forget them.

---

## 4. Request flow (frontend)

```
pages / components
  → composables (useAuth, useDecks, useStudySession, …)   wrap store actions in
                                                          useAsync → {data,error,loading,execute}
  → Pinia stores (auth, decks, sessions, srs, practice, preferences, billing, premiumGate)
  → app/api/* (one module per backend domain; adapts wire shapes → FE types)
  → app/utils/http.ts   ← the ONLY authenticated fetch wrapper (client-only)
  → backend /api/v1/*
```

`http.ts` responsibilities: prefix `/api/v1`, attach `Authorization: Bearer`
from `localStorage`, always `credentials: 'include'`, single shared in-flight
refresh on 401, hard logout only on `AUTH_INVALID_REFRESH`, normalize every
error to `{ code, message, details? }`. Options: `skipAuth`, `skipRefresh`.

**Two deliberate exceptions:**

1. `app/api/chat.ts` uses native `fetch` (ofetch can't stream SSE) and runs its
   own 401 → refresh → retry cycle.
2. `app/utils/publicHttp.ts` — no-auth GET wrapper that works during the Nitro
   server render _and_ in the browser. All SSR/crawler-facing content (public
   discover, public deck pages, blog) goes through it inside `useAsyncData`.
   `http.ts` must never run on the server — it reads `localStorage`.

**Dev proxy:** `routeRules['/api/**'] = { proxy: 'http://127.0.0.1:3001/api/**' }`
and `runtimeConfig.public.apiBase` is empty in dev, so the browser issues
_relative_ `/api/v1/...` calls to its own origin and Nuxt proxies them. This
keeps the refresh cookie first-party. The backend **must** be on `:3001` or
everything 502s. Prod: `NUXT_PUBLIC_API_BASE`, plus `NUXT_API_PROXY_TARGET` for
server-side `publicHttp`.

**Route protection:** `app/middleware/auth.global.ts` is client-only and uses an
**allowlist** of protected prefixes — `/dashboard /decks /study /review
/statistics /profile /onboarding /ai /settings`. Everything else (landing,
discover, blog, pricing, about, legal, OAuth + billing callbacks) is public and
SSR-renderable. Logged-out hits on a protected route → `/login?next=<intended>`,
returned via `app/utils/returnTo.ts`.

---

## 5. Data model (Prisma, model-per-file)

`User` (xp, streak, role, emailVerifiedAt, avatarUrl) · `Preference`
(interests, goal, nativeLanguage, learningLanguages, avatarHue, mimiPlacement,
favorites) · `RefreshToken` · `EmailVerification` · `OAuthIdentity` ·
`AuditLog` · `Deck` (coverColor, glyph, subject, isPublic, featured, copyCount,
cardCount, source/target language) · `Card` (term, definition, partOfSpeech,
example, exampleTranslation, reading, tags[], difficulty, type, audioUrl,
imageUrl) · `CardProgress` (SM-2 state per user+card) · `StudySession`
(cardIds[], cardIndex, correct, xpAwarded, per-grade counts, revisitCardIds,
durationMs, `srsEnabled`, status) · `DailyActivity` (local-day buckets for
streaks/goals) · `Achievement` + `UserAchievement` · `AiUsage` (daily cap
rollup, shared by `/ai/*` and `/imports/*` with separate counters) ·
`Conversation` + `ChatMessage` (role, tokens, `status: complete|partial`,
`attachments` JSON for tool side-effects) · `Subscription` (Paddle customer/sub/
price/product ids, period window, `cancelAtPeriodEnd`, trialEnd) ·
`PaddleWebhookEvent` (idempotency ledger) · `Folder` + `DeckCollaborator` +
`FolderCollaborator` (**schema exists, no endpoints — deferred**).

IDs are UUID strings; dates ISO-8601 UTC; birthday `YYYY-MM-DD`.

---

## 6. Key flows and invariants

**Auth.** `register → verify-email (OTP) → login`. Access token (15 min) in
`localStorage`; refresh token (opaque, 30 d, rotating) only in the `mnemio_refresh`
HttpOnly cookie scoped to `/api/v1/auth`. Presenting a rotated refresh token
revokes the whole family → `AUTH_INVALID_REFRESH` → hard logout. Every
token-issuing response carries `user`, `needsProfile`, `welcome { hasDeck,
hasSession, hasReviewed }` and `plan: 'free' | 'premium'`. `app/plugins/01.auth.client.ts`
hydrates on boot and is deliberately resilient: only `AUTH_INVALID_REFRESH`
clears the session, network errors keep the token.

**Study & SRS.** One `active` session per user, enforced inside Prisma
transactions plus a Postgres partial unique index. XP is **server-computed**
(`correct * 10 + 25`) — the FE never sends it. `POST /srs/rate` takes
`{ cardId, rating }` and the server derives the deck. `srsEnabled: false`
("just browse") sessions don't rate per card, so the day's activity counters are
rolled on session complete instead — otherwise browse study would be invisible
to streaks. Activity, streaks and "today" are bucketed by the **user's
timezone**, which the FE sends.

**Public decks.** An authenticated non-owner may read, study and rate a deck
with `isPublic = true`; SRS rows are keyed `(requesterId, cardId)` so progress
is independent. Writes stay owner-only. Flipping `isPublic = false` re-locks
reads immediately.

**AI.** Providers behind one interface (`mock` | `anthropic`), identical
response shapes — the FE never branches on provider. SSE when
`Accept: text/event-stream`. Budget check (`assertWithinBudget`) before every
LLM call; `/ai/*` and `/imports/*` keep separate counters in `ai_usage` with
distinct error codes (`AI_BUDGET_EXCEEDED` vs `IMPORT_BUDGET_EXCEEDED`).

**Mimi chat.** Streamed tokens before a `tool_use` frame are a _neutral
preamble_, not a result — the FE clears them on `tool_use` and renders the
post-`tool_result` tokens, so "added it" can never appear without a successful
tool result. A cut stream persists as `status: 'partial'`, is not charged
against the daily cap, and the FE offers retry. `useChat()` is a composable, not
a store — call it once at page level and pass state down.

**Billing.** Paddle overlay checkout from the FE with the userId passed through
so webhooks can attribute it; the backend owns webhook verification,
subscription state and entitlement. Entitlement rule:
`status IN (trialing, active, past_due, canceled) AND currentPeriodEnd > now()`.
`cancelAtPeriodEnd` alone never revokes access. `403 PREMIUM_REQUIRED` → FE
opens the paywall via `usePremiumGateStore().show(...)`, which also fires the
`paywall_viewed` analytics event. Server enforces even when the FE shows the
feature.

**Error envelope.** Every error is `{ code, message, details? }`. 400 validation
· 401 unauthenticated · 403 forbidden/premium · 404 not found · 409 conflict ·
422 business rule · 429 rate limited · 500 internal.

---

## 7. Caps, plans and rate limits

**The free/premium daily-cap table lives in `01-product-context.md` §8** (it's a
monetization decision, not an implementation detail). Enforcement details:

- Every cap is an env var with a default in `mnemio-backend/src/config/env.ts`
  (`AI_DAILY_*_CAP_PER_USER` and `*_CAP_PREMIUM_PER_USER`,
  `IMPORT_DAILY_CAP_PER_USER`). **That file is the source of truth for the
  numbers** — the product doc mirrors it in plain language.
- Counted in the `ai_usage` table as a per-user daily rollup, with separate
  counters for `/ai/*` and `/imports/*` and distinct error codes.
- Six counters: `generate`, `enrich`, `suggest`, `chat`, `import`, `image`.
  Premium is a flat **10×** on each.
- **Reset at UTC midnight** — note this differs from streaks/activity, which
  bucket by the user's local day. Deliberate, but a user in UTC+3 sees their
  caps reset at 03:00 local.
- **Per call, not per token** — a 100-word enrich costs the same unit as a
  5-word one.
- **Only successful calls count:** `recordUse` runs _after_ the provider
  returns (`ai.budget.service.ts:56-80`).
- `assertWithinBudget` runs **before** the provider call, so a capped user
  never burns API credits. `entitlement.service.ts` (`assertPremium` /
  `getPlan`) decides which cap applies.
- **Model routing** (`env.ts:59-65`): Claude Haiku 4.5 for everything, except
  Ukrainian card content → Claude Sonnet 5. Ukrainian content therefore costs
  ~2× English. (Worth knowing: Claude Sonnet 5.5 is the current Sonnet at the
  same $2/$10 per MTok, so that swap is free if quality is equal or better.)
- Max words per enrich call: 100. Study modes and SRS are uncapped and free.
- Pricing: the `/pricing` page renders Paddle's localized `PricePreview`
  client-side; the JSON-LD fallback hard-codes $6/mo and $60/yr for crawlers,
  so changing the real price means updating that structured data too.

Rate limits (per IP unless noted): 120 req/min global · 10/min register+login ·
5/min verify-email + resend-otp · 30/min refresh · 30/min per user on `/ai/*`
and `/media/uploads`.

---

## 8. Frontend layout and non-obvious patterns

| Dir                | Purpose                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/`         | auth, decks, cards, sessions, srs, stats, discover, publicDiscover, achievements, preferences, ai, chat, billing, media                                                                                                    |
| `app/stores/`      | auth, decks, sessions, srs, practice, preferences, billing, premiumGate                                                                                                                                                    |
| `app/composables/` | `useAsync` (the primitive), domain composables, plus `useT`, `useAppLocale`, `useToast`, `useMimi`, `useChat`, `useAnalytics`, `useStudySession`, `useImageDeck`, `usePaddle`/`usePaddlePrices`, `useSeo`, `useGeoCountry` |
| `app/analytics/`   | `client.ts` (Mixpanel/GA) + `events.ts` (typed catalogue) — always go through `useAnalytics()`                                                                                                                             |
| `app/components/`  | `ui/` = shadcn primitives, `shared/` = reusable widgets, rest by feature (study, deck, dashboard, login, marketing, landing, review, card, app, ai, layout)                                                                |
| `app/pages/`       | app routes + marketing/SEO pages (see §9)                                                                                                                                                                                  |
| `app/i18n/`        | `en.json`, `uk.json`, `index.ts`                                                                                                                                                                                           |
| `app/data/blog.ts` | all blog content (no CMS)                                                                                                                                                                                                  |

- **Components auto-import with a path-derived prefix:**
  `components/shared/StatTile.vue` → `<SharedStatTile>`, `components/ai/ImportDialog.vue`
  → `<AiImportDialog>`.
- **`SharedDeckCard`** has `variant: 'library' | 'recent' | 'discover'`.
- **`DeckCardVM` / `deckToCardVm`** — all deck cards take a `DeckCardVM`; the
  `swatch` field may be a hex colour _or_ a CSS gradient, so always bind
  `:style="{ background: deck.swatch }"`, never `backgroundImage`.
- **`AppRail`** expands 76 → 240 px on hover; the outer `<aside>` stays 76 px and
  the inner panel is absolutely positioned (no reflow). Mobile uses
  `AppBottomTabBar`.
- **i18n interpolation is manual:** the custom `useT()` resolver has no named
  placeholders — `t('key').replace('{n}', String(value))`.
- Two i18n mechanisms coexist: `@nuxtjs/i18n` (locale cookie `i18n_locale`,
  `no_prefix`, drives `setLocale` and is forwarded to the chat API so Mimi
  replies in the user's language) and the custom `useT()` catalogue used in
  components. Add every new key to **both** JSON files.
- **Styling:** design tokens in `app/assets/css/main.css` (`:root`/`.dark` for
  dark, `.light` for day; space-separated RGB channels so Tailwind opacity
  modifiers work). Dark is the default. `text-cream` for body copy on dark
  surfaces; `text-on-color` for text on a coloured fill. Fonts: Nunito Sans +
  Fraunces (`font-display`). Prettier: 4-space tabs, single quotes, printWidth 100.

---

## 9. Growth / SEO surface

Public, indexable, SSR pages: `/` · `/discover` + `/discover/[subject]` +
`/discover/sets/[id]` · `/blog` + `/blog/[slug]` · `/pricing` · `/about` ·
`/faq` · legal (`/privacy`, `/terms`, `/refunds`) and the intent landing pages:
`/free-quizlet-alternative`, `/mnemio-vs-quizlet-vs-anki`,
`/ai-flashcards-from-photo`, `/kvizlet-alternatyva` (UK), `/leksychnyi-minimum-nmt` (UK).

Robots disallows the app surfaces (`/dashboard`, `/decks`, `/study`, `/review`,
`/statistics`, `/profile`, `/onboarding`, `/ai$`, `/login`, `/auth`); the
sitemap module auto-excludes whatever robots disallows and pulls dynamic URLs
from `server/routes/__sitemap__` (deliberately outside `/api/**` so the proxy
rule doesn't shadow it). `/ai` is anchored with `$` so it doesn't also block
`/ai-flashcards-from-photo`.

Analytics is a hard no-op unless `NUXT_PUBLIC_ANALYTICS_ENABLED=true` **and** a
Mixpanel token is set; use separate Mixpanel projects per environment. Strategy
and event catalogue: `docs/analytics-strategy.md`, `docs/analytics-implementation-plan.md`.

---

## 10. Environments & secrets

Frontend (`NUXT_PUBLIC_*` is browser-exposed): `NUXT_PUBLIC_API_BASE` (empty in
dev!), `NUXT_API_PROXY_TARGET` (server-side public fetches), `NUXT_PUBLIC_SITE_URL`,
`NUXT_PUBLIC_ANALYTICS_ENABLED`, `NUXT_PUBLIC_MIXPANEL_TOKEN`, `NUXT_PUBLIC_GA4_ID`,
`NUXT_PUBLIC_ANALYTICS_DEBUG`, `NUXT_PUBLIC_ANALYTICS_CARD_SAMPLING`,
`NUXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NUXT_PUBLIC_PADDLE_ENV`. The Paddle **API
key** is deliberately un-prefixed and belongs to the backend only.

Backend: `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `WEB_URL` (CORS allow-list,
`credentials: true`), `PORT=3001`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL_DAYS=30`,
`MAIL_PROVIDER`, `AI_PROVIDER` (`mock` | `anthropic`) + `ANTHROPIC_API_KEY`,
`MEDIA_STORAGE` (`local` → `./uploads`), the cap vars from §7, and
`PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENV`, `PADDLE_PRICE_MONTHLY`,
`PADDLE_PRICE_ANNUAL` (all optional — unset disables billing).

Paddle is currently on **sandbox** in the committed example env. Media is local
FS (lost on container restart) — S3/R2 swap is a documented, deferred half-day.

---

## 11. Deliberately deferred (don't propose as "missing")

From `mnemio-backend/docs/backlog.md`, with the revisit trigger:

- Apple/Facebook/Microsoft OAuth (revisit at iOS launch) · logout-all-devices ·
  email-change · in-app password change.
- Folders / deck collections (revisit when a power user passes ~25 decks) ·
  public-deck moderation (first abuse report) · multi-author decks ·
  per-review history table.
- Streak freezes · leaderboards (needs a social graph) · achievement push.
- S3/R2 media · Resend email · zero-downtime deploys · multi-region ·
  OpenAPI generation (api-contract.md is hand-maintained on purpose).
- WebSockets (SSE covers streaming) · web/mobile push.
- Generic AI URL importer · server-side AI cache (revisit if the Anthropic bill
  passes ~$50/mo).

Also out of MVP scope historically: password reset, account deletion (⚠️ the
backlog says `DELETE /users/me` now exists — the contract lists it, so account
deletion **is** shipped; the README's "out of scope" list is stale here).

---

## 12. Known-stale documents

Do not quote these as current:

| File                                            | What's wrong                                                                                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mnemio-frontend/README.md`                     | Says pnpm (it's npm), "20+ language UI" (it's en/uk), leagues/badges as features (leagues deferred), Node 20 (it's ≥22), and the roadmap checklist is all-unchecked though most of it shipped. Project-structure tree doesn't match `app/`. |
| `mnemio-backend/README.md`                      | Says AI is mocked and OAuth is "planned, no routes wired" — both wrong (Anthropic live, Google OAuth shipped). Its API overview omits chat, billing, imports and public/SEO routes. "Out of MVP scope" list includes things now shipped.    |
| `mnemio-backend/docs/paid-subscription-plan.md` | Recommends and designs for **Stripe**. The product migrated to **Paddle** (`feat(billing): migrate fulfillment from Stripe to Paddle`). Useful only for the state-machine and entitlement reasoning, which carried over.                    |
| `mnemio-frontend/docs/api-contract.md`          | A stale fork of the backend doc, kept for old links. **Always use `mnemio-backend/docs/api-contract.md`.**                                                                                                                                  |
| `mnemio-frontend/CLAUDE.md`                     | Accurate on conventions, but says "42 endpoints" — it's 66.                                                                                                                                                                                 |
| `mnemio-frontend/FIXED.md`                      | Historical bug log (useful as a bug-pattern archive, not as current state).                                                                                                                                                                 |

---

## 13. File index (for pointing Claude at the right file)

**Frontend**
`nuxt.config.ts` (proxy, robots, sitemap, head/SEO) · `app/utils/http.ts` ·
`app/utils/publicHttp.ts` · `app/stores/auth.ts` · `app/plugins/01.auth.client.ts` ·
`app/middleware/auth.global.ts` · `app/api/chat.ts` (SSE) ·
`app/composables/useChat.ts` (the biggest composable, ~700 lines) ·
`app/composables/useStudySession.ts` · `app/composables/usePaddle.ts` +
`usePaddlePrices.ts` · `app/stores/premiumGate.ts` · `app/analytics/events.ts` ·
`app/i18n/{en,uk}.json` · `tailwind.config.ts` + `app/assets/css/main.css` ·
`app/data/blog.ts`.

**Backend**
`src/app.ts` (plugins + routes) · `src/config/env.ts` (every env var + caps) ·
`src/plugins/error-handler.ts` · `src/services/sm2.ts` (pure SM-2) ·
`src/services/srs.service.ts` · `src/services/sessions.service.ts` ·
`src/services/ai.provider.anthropic.ts` + `ai.prompts.ts` + `ai.budget.service.ts` ·
`src/services/chat.service.ts` + `chat.tools.ts` + `chat.prompt.ts` ·
`src/services/billing.service.ts` + `entitlement.service.ts` ·
`src/services/stats.service.ts` + `tz.ts` · `src/services/achievements.catalog.ts` ·
`prisma/*.prisma` · `docs/api-contract.md` · `docs/deployment.md` · `docs/backlog.md`.
