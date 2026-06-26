# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guidance for Claude Code (and other AI agents) working in this repository.

> The cross-tool copy in [`AGENTS.md`](./AGENTS.md) points here — **this file is canonical.**

## What this is

**Mnemio** — the frontend for a flashcard / spaced-repetition learning app
(Quizlet-like). Decks of cards, study/practice/review sessions, an SRS scheduler,
discovery of public decks, stats, achievements, and an AI deck generator.

> ⚠️ The npm package is still named `quizlet` (legacy). The product is **Mnemio**.

The backend lives in a separate repo and is the source of truth for data; this
repo only talks to it over HTTP. The full API is documented in
[`docs/api-contract.md`](./docs/api-contract.md) (42 endpoints under `/api/v1`).

## Stack

- **Nuxt 4** (`compatibilityDate 2025-07-15`) + **Vue 3** (`<script setup>`, Composition API)
- **TypeScript**, `strict` + `strictNullChecks`
- **Pinia** (`@pinia/nuxt`) — setup-style stores
- **Tailwind CSS** (`@nuxtjs/tailwindcss`) + **shadcn-vue** (style `new-york`, base `reka`, `lucide` icons)
- **@nuxtjs/i18n** (en / uk) + a small custom catalog resolver (see [i18n](#i18n))
- **@nuxtjs/color-mode**, **@nuxt/image**, **@vueuse/nuxt** + **@vueuse/motion**
- **vee-validate** + **zod** for forms/validation

## Commands

```bash
npm run dev            # dev server (needs the backend on :3001 — see Dev proxy)
npm run build          # production build
npm run generate       # static generate
npm run preview        # preview a build
npm run lint           # eslint .
npm run lint:fix       # eslint . --fix
npm run format         # prettier --write
npm run format:check   # prettier --check
npm run validate       # lint + format:check  (run before considering work done)
```

There is **no test runner configured**. Verify changes via `npm run validate`
and by running the app.

## Architecture — request flow

Data flows through clear layers; respect them when adding features.

```
pages / components
        │  call
composables (useAuth, useDecks, …)   ← wrap store actions in useAsync → {data,error,loading,execute}
        │
Pinia stores (app/stores/*)          ← setup stores: defineStore(id, () => {...}); hold state + orchestrate
        │  call
api modules (app/api/*)              ← typed async fns, one per backend domain; adapt wire types → FE types
        │  call
app/utils/http.ts                    ← the ONLY fetch wrapper (authenticated, client-only)
        │
backend  /api/v1/*
```

**Exception — SSE chat streaming:** `app/api/chat.ts` uses native `fetch` directly (not `http.ts`) because `$fetch`/ofetch cannot stream SSE. It manages its own 401→refresh→retry cycle and redirects to `/login` when the refresh token is expired. See the `streamMessage` function before touching chat networking.

**Exception — public/SSR content:** `app/utils/publicHttp.ts` is a no-auth GET wrapper that works in both the Nitro server render pass and the browser. Use it (inside `useAsyncData`) for public discover, blog, and other crawler-facing content. Never use `http.ts` for SSR-rendered pages — it reads `localStorage` which doesn't exist on the server.

### `app/utils/http.ts` (read before touching networking)

- Prefixes paths with `/api/v1` (unless they already start with `/api/` or `http`).
- Access token from `localStorage` via `app/utils/authToken.ts` → `Authorization: Bearer`.
- Always sends `credentials: 'include'` so the HttpOnly refresh cookie (`mnemio_refresh`) rides along.
- **401 handling:** refresh once via `POST /auth/refresh`, then retry the request; a single in-flight refresh is shared. `AUTH_INVALID_REFRESH` → hard logout (`/login`), never retried.
- Normalizes all errors to `{ code, message, details? }` (`ApiError`). Always `throw` normalized errors.
- Options: `skipAuth`, `skipRefresh`.

### Auth

- `app/stores/auth.ts` — setup store. Flow: `register → verifyEmail (OTP) → login`. Access token kept in `localStorage`; refresh is an HttpOnly cookie.
- `app/plugins/01.auth.client.ts` — on boot calls `auth.hydrate()` (then preferences). Hydrate is resilient: only `AUTH_INVALID_REFRESH` clears the session; network errors keep the token so a restart/booting backend doesn't log you out.
- `app/middleware/auth.global.ts` — route guard, client-side only. Uses an **allowlist** of protected path prefixes (`/dashboard /decks /study /review /statistics /profile /onboarding /ai /settings`). Everything else (landing, discover, blog, pricing, about, legal, OAuth/billing callbacks) is public and SSR-renderable. Logged-out users hitting a protected route are sent to `/login?next=<intended>` and returned there after login via `app/utils/returnTo.ts`.

### Dev proxy (important)

`nuxt.config.ts` sets `routeRules['/api/**'] = { proxy: 'http://127.0.0.1:3001/api/**' }`.
In dev `runtimeConfig.public.apiBase` is empty, so the client issues **relative**
`/api/v1/...` requests to its own origin, which Nuxt proxies to the backend on
**`:3001`**. This keeps the refresh cookie first-party (same-site). **The backend
must be running on `:3001`** or every call 502s. In prod set `NUXT_PUBLIC_API_BASE`.

`publicHttp.ts` reads `runtimeConfig.apiProxyTarget` on the server side (direct backend URL) and falls back to `runtimeConfig.public.apiBase` on the client. Set `NUXT_API_PROXY_TARGET` in production for SSR public pages.

## Project layout (`app/`)

| Dir                                      | Purpose                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/`                                   | One module per domain (`auth, decks, cards, sessions, srs, stats, discover, publicDiscover, achievements, preferences, ai, chat, billing, media`). Typed fns over `http`; convert backend wire shapes → FE types. `normLang()` is exported from `decks.ts` and imported by `discover.ts` for language normalization. |
| `stores/`                                | Pinia setup stores (`auth, decks, sessions, srs, practice, preferences, billing, premiumGate`).                                                                                                                                                                                                                      |
| `composables/`                           | `useAsync` (the async-state primitive), domain composables that wrap store actions, plus `useT`, `useAppLocale`, `useToast`, `useMimi`, `useChat`, `useAnalytics`, etc.                                                                                                                                              |
| `analytics/`                             | `client.ts` (Mixpanel/GA wrapper), `events.ts` (typed event catalog). Call via `useAnalytics()` composable — never import `analytics/client.ts` directly in components.                                                                                                                                              |
| `types/`                                 | Hand-written domain types (FE-facing shapes).                                                                                                                                                                                                                                                                        |
| `schemas/`                               | Zod schemas (`auth, card, deck`) → forms via `utils/zodValidator.ts` + vee-validate.                                                                                                                                                                                                                                 |
| `utils/`                                 | `http`, `publicHttp`, `authToken`, `returnTo`, `anonId`, `zodValidator`, `grades`, `media`, `deckVm`, `studyCard`, `coverSwatches`.                                                                                                                                                                                  |
| `data/`                                  | Static content. `blog.ts` = all blog post data (no CMS).                                                                                                                                                                                                                                                             |
| `components/`                            | `ui/` = shadcn-vue primitives; `shared/` = reusable app widgets; rest grouped by feature (`study, deck, dashboard, login, marketing, landing, review, card, app, ai, layout`).                                                                                                                                       |
| `pages/`                                 | File-based routes. `discover/` is a directory with `index.vue`, `[subject].vue`, `sets/[id].vue`. `blog/` is a directory with `index.vue` + `[slug].vue`.                                                                                                                                                            |
| `layouts/`                               | `default, auth, marketing, study`.                                                                                                                                                                                                                                                                                   |
| `i18n/`                                  | `en.json`, `uk.json`, `index.ts` (catalog + helpers).                                                                                                                                                                                                                                                                |
| `middleware/`, `plugins/`, `assets/css/` | Route guard, boot plugin, global CSS.                                                                                                                                                                                                                                                                                |

`@/` is aliased to `app/` (e.g. `@/utils/http`).

## Conventions

- **Stores:** setup syntax — `defineStore('id', () => { const x = ref(); … return {…} })`, importing `defineStore/ref/computed` from `#imports`.
- **API modules:** export small typed `async` fns that call `http<T>()`; keep backend↔FE field adaptation here (see the `BackendUser → User` `toUser` mapper in `api/auth.ts`). Apply `normLang()` (from `@/api/decks`) to any `sourceLanguage`/`targetLanguage` field coming from the backend.
- **Composables:** wrap store actions with `useAsync` to expose `{ data, error, loading, execute }`. Don't call `http` directly from components.
- **Components are auto-imported with a path-derived prefix** (Nuxt default — no `components` config). `components/shared/StatTile.vue` → `<SharedStatTile>`; `components/ui/Button.vue` → `<UiButton>`; `components/ai/ImportDialog.vue` → `<AiImportDialog>`. Match the prefix pattern in nearby files rather than importing manually.
- **Errors:** surface `ApiError.code`/`message`; never let raw `$fetch` errors escape `http`.
- **TypeScript:** strict — no implicit `any`, handle `null`.

## Key component patterns (non-obvious)

**`SharedDeckCard`** — has a `variant` prop: `'library'` (default, book-cover layout used in the deck grid), `'recent'` (horizontal strip with action buttons), `'discover'` (public deck browsing). Always pass `variant="library"` in the main deck grid.

**`DeckCardVM` / `deckToCardVm`** — deck cards everywhere take `DeckCardVM` from `app/types/deck.ts`. Build one from a `DeckSummary` via `deckToCardVm(summary, isFavorite?)` from `@/utils/deckVm`. The `swatch` field can be either a hex color or a CSS gradient string (from `coverGradientFor()` / `swatchFor()` in `app/utils/coverSwatches.ts`). **Always bind as `:style="{ background: deck.swatch }"`**, never `backgroundImage:` — the shorthand handles both.

**`AppRail`** — expands 76 px → 240 px on `mouseenter` of the outer `<aside>`. The outer `<aside>` is always 76 px in the flex layout (no reflow); the inner panel is `position: absolute` and overlays page content when expanded. `dueCount` badge from `useSrsStore()`. Library rows from `useDecksStore().summaries` (top 3 by `updatedAt`). On mobile, `AppBottomTabBar` replaces the rail.

**`SharedPremiumGate`** — modal that gates premium features. Trigger it by calling `usePremiumGateStore().open()`. The store in `app/stores/premiumGate.ts` controls visibility and the reason string shown in the modal.

**`AiImportDialog`** — floating dialog for importing words via AI into a deck. Controlled by a local `aiOpen` ref; always paired with a floating Mimi trigger button (`fixed bottom-[26px] right-[28px]`).

**`useChat`** — composable for the Mimi chat page. Not a Pinia store — each page that calls `useChat()` gets its own state. Do not call it from multiple components simultaneously; place it at the page level and pass state down.

**i18n interpolation** — the custom `useT()` catalog does not support named placeholders natively. Interpolate manually: `t('key').replace('{n}', String(value))`.

## i18n

Two mechanisms coexist:

1. **`@nuxtjs/i18n`** — strategy `no_prefix`, locales `en`/`uk`, locale persisted in the `i18n_locale` cookie, browser detection on root. Drives `useI18n()` / `setLocale`.
2. **Custom catalog** — `app/i18n/{en,uk}.json` + `useT()` (a dotted-key resolver with EN fallback). **Use `const { t } = useT()` then `t('dashboard.statStreak')` in components.** Interpolation is done manually (e.g. `.replace('{n}', String(x))`).

`useAppLocale()` exposes the active locale + setter + `LOCALE_OPTIONS`. When adding UI strings, add the key to **both** `en.json` and `uk.json`. The active locale from `useI18n().locale` is forwarded to the chat API via `streamMessage` so Mimi responds in the user's language.

## Styling

- Tailwind with a custom design system in `tailwind.config.ts`: color tokens (`cream`, `plum`, `pink`, `brand`, `bg-surface`, `line`), display font (`Fraunces` → `font-display`) + custom `fontSize` scale (`text-display-sm`, `text-h2`, `text-body`, `text-eyebrow`, `text-small`), and gradient utilities.
- **Color palette lives in `app/assets/css/main.css`** — `:root`/`.dark` block for dark theme, `.light` block for bright mode. All tokens are space-separated RGB channels so Tailwind can apply opacity modifiers (`rgb(var(--c-cream) / 0.6)`). Dark is the default; `.light` is the bright/day theme.
- **Color rules:** use `text-cream` (not `text-cream-dim`) for body copy on dark surfaces. Use `text-on-color` (not `text-cream`) for text that sits directly on a colored fill (cover gradients, `bg-brand` buttons) — it must stay light in both themes.
- Prettier: **4-space tabs**, single quotes, semicolons, trailing commas (`all`), `printWidth 100`. ESLint flat config (`eslint.config.js`) integrates Prettier + Vue + TS + Tailwind plugins.

## Docs

- [`docs/api-contract.md`](./docs/api-contract.md) — **the** backend contract: every endpoint, payload, error code, and the invariants the FE must respect (refresh-cookie rules, SRS `rate` body, server-computed XP, list `{ items, nextCursor }` shape, ownership 404/403, etc.). Consult it before changing any `app/api/*` call.

## Backend / demo data

Backend repo runs on `:3001`. `npm run seed` (in the backend) creates
`demo@mnemio.local` / `demo-password-123` (pre-verified, profile complete, 2 seeded decks)
so you can skip the OTP flow during integration testing.

## Git

- PR target: `main`. Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`.
- Commit/push only when asked. End commit messages with the required co-author trailer.
