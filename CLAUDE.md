# CLAUDE.md

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
app/utils/http.ts                    ← the ONLY fetch wrapper
        │
backend  /api/v1/*
```

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
- `app/middleware/auth.global.ts` — route guard. `PUBLIC_ROUTES` = `/ /login /about /blog /privacy /terms`; everything else requires auth; authed users on `/login` go to `/dashboard`. Client-side only.

### Dev proxy (important)

`nuxt.config.ts` sets `routeRules['/api/**'] = { proxy: 'http://127.0.0.1:3001/api/**' }`.
In dev `runtimeConfig.public.apiBase` is empty, so the client issues **relative**
`/api/v1/...` requests to its own origin, which Nuxt proxies to the backend on
**`:3001`**. This keeps the refresh cookie first-party (same-site). **The backend
must be running on `:3001`** or every call 502s. In prod set `NUXT_PUBLIC_API_BASE`.

## Project layout (`app/`)

| Dir                                      | Purpose                                                                                                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/`                                   | One module per domain (`auth, decks, cards, sessions, srs, stats, discover, achievements, preferences, ai, media`). Typed fns over `http`; convert backend wire shapes → FE types. |
| `stores/`                                | Pinia setup stores (`auth, decks, sessions, srs, practice, preferences`).                                                                                                          |
| `composables/`                           | `useAsync` (the async-state primitive), domain composables that wrap store actions, plus `useT`, `useAppLocale`, `useToast`, `useMimi`, etc.                                       |
| `types/`                                 | Hand-written domain types (FE-facing shapes).                                                                                                                                      |
| `schemas/`                               | Zod schemas (`auth, card, deck`) → forms via `utils/zodValidator.ts` + vee-validate.                                                                                               |
| `utils/`                                 | `http`, `authToken`, `zodValidator`, `grades`, `media`, `deckVm`, `studyCard`, `coverSwatches`.                                                                                    |
| `components/`                            | `ui/` = shadcn-vue primitives; `shared/` = reusable app widgets; rest grouped by feature (`study, deck, dashboard, login, marketing, landing, review, card, app, layout`).         |
| `pages/`                                 | File-based routes (`dashboard, decks, discover, statistics, study/[deckId], review, profile, onboarding, login, …`).                                                               |
| `layouts/`                               | `default, auth, marketing, study`.                                                                                                                                                 |
| `i18n/`                                  | `en.json`, `uk.json`, `index.ts` (catalog + helpers).                                                                                                                              |
| `middleware/`, `plugins/`, `assets/css/` | Route guard, boot plugin, global CSS.                                                                                                                                              |

`@/` is aliased to `app/` (e.g. `@/utils/http`).

## Conventions

- **Stores:** setup syntax — `defineStore('id', () => { const x = ref(); … return {…} })`, importing `defineStore/ref/computed` from `#imports`.
- **API modules:** export small typed `async` fns that call `http<T>()`; keep backend↔FE field adaptation here (see the `BackendUser → User` `toUser` mapper in `api/auth.ts`).
- **Composables:** wrap store actions with `useAsync` to expose `{ data, error, loading, execute }`. Don't call `http` directly from components.
- **Components are auto-imported with a path-derived prefix** (Nuxt default — no `components` config). `components/shared/StatTile.vue` → `<SharedStatTile>`; `components/ui/Button.vue` → `<UiButton>`; `components/ui/Spinner.vue` → `<UiSpinner>`. Match the prefix pattern in nearby files rather than importing manually.
- **Errors:** surface `ApiError.code`/`message`; never let raw `$fetch` errors escape `http`.
- **TypeScript:** strict — no implicit `any`, handle `null`.

## i18n

Two mechanisms coexist:

1. **`@nuxtjs/i18n`** — strategy `no_prefix`, locales `en`/`uk`, locale persisted in the `i18n_locale` cookie, browser detection on root. Drives `useI18n()` / `setLocale`.
2. **Custom catalog** — `app/i18n/{en,uk}.json` + `useT()` (a dotted-key resolver with EN fallback). **Use `const { t } = useT()` then `t('dashboard.statStreak')` in components.** Interpolation is done manually (e.g. `.replace('{n}', String(x))`).

`useAppLocale()` exposes the active locale + setter + `LOCALE_OPTIONS`. When adding
UI strings, add the key to **both** `en.json` and `uk.json`.

## Styling

- Tailwind with a custom design system in `tailwind.config.ts`: color tokens (`cream`, `plum`, `pink`, `brand`, `bg-surface`, `line`), display font + custom `fontSize` scale (`text-display-sm`, `text-h2`, `text-body`, `text-eyebrow`, `text-small`), and gradient utilities.
- **`new_design/`** holds the static HTML/CSS redesign reference (the "Mnemio \*.html" mockups + screenshots). Use it as the visual source of truth when building/adjusting screens.
- Prettier: **4-space tabs**, single quotes, semicolons, trailing commas (`all`), `printWidth 100`. ESLint flat config (`eslint.config.js`) integrates Prettier + Vue + TS + Tailwind plugins.

## Docs

- [`docs/api-contract.md`](./docs/api-contract.md) — **the** backend contract: every endpoint, payload, error code, and the invariants the FE must respect (refresh-cookie rules, SRS `rate` body, server-computed XP, list `{ items, nextCursor }` shape, ownership 404/403, etc.). Consult it before changing any `app/api/*` call.
- [`docs/backend-plan.md`](./docs/backend-plan.md) — backend build plan. Note it describes an older **hybrid** state where Decks/Cards/Sessions/SRS were `localStorage` mocks; that migration is **done** — all `app/api/*` modules now use real `http`, `mockStore` is gone, and `app/services/` is empty.

## Backend / demo data

Backend repo runs on `:3001`. `npm run seed` (in the backend) creates
`demo@mnemio.local` / `demo-password-123` (pre-verified, profile complete, 2 seeded decks)
so you can skip the OTP flow during integration testing.

## Git

- Current working branch: `development`. PR target: `main`.
- Conventional commits in history: `feat(i18n): …`, `fix(auth): …`.
- Commit/push only when asked. End commit messages with the required co-author trailer.
