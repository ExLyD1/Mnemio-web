# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mnemio-web — the **frontend** for an AI-powered flashcard/vocabulary app (Nuxt 4 + Vue 3 + TypeScript). It talks to a separate Fastify backend (`mnemio-api`) over REST; there is no database access here and the `server/` middleware is minimal. The README's "Project Structure" and "pnpm" references are partly aspirational — trust the actual tree (everything lives under `app/`) and use **npm** (the repo is locked with `package-lock.json`).

## Commands

```bash
npm run dev            # dev server — Nuxt picks port 3000, or increments if taken
npm run build          # production build (nuxt build)
npm run lint           # eslint .   (see gotcha below)
npm run lint:fix
npm run format         # prettier --write
npm run format:check
npm run validate       # lint + format:check — run before considering work done
```

There is **no test runner** configured. "Verifying" a change means `npm run dev` and exercising it, plus `npm run validate`.

The dev server needs the backend running at `http://127.0.0.1:3001` (see proxy below).

## Critical gotchas

- **ESLint does not lint `.vue` files** — the flat config (`eslint.config.js`) only matches `**/*.{js,ts}`. Running eslint on a `.vue` file prints "File ignored because no matching configuration was supplied". Vue files are only checked by Prettier. Don't assume `npm run lint` covered your template changes.
- **Config files (`nuxt.config.ts`, `tailwind.config.ts`) are not in the TS project service**, so `npm run lint` reports a parsing error and a `process.env` unsafe-access error on them. These are pre-existing and unrelated to your edits.
- **Line endings**: edits can introduce CRLF that Prettier rejects. Run `npm run format` on touched files if you see a wall of `Delete ␍` errors.
- **`useColorMode()` from `@nuxtjs/color-mode` fails outside Nuxt context** — don't call it inside components that may render during SSR or inside async Pinia actions. To react to the current theme inside a component, detect it via DOM: `document.documentElement.classList.contains('dark')` and observe changes with a `MutationObserver` (see `components/study/FlashCard.vue` for the pattern).
- **`useRuntimeConfig()` must not be called after async await boundaries** — Nuxt's async context is lost across some Pinia action boundaries. `http.ts` solves this by caching `apiBase` on first call via `getBaseURL()`. Follow the same pattern if you need runtime config in a utility function.
- **`bg-white/[0.0x]` is invisible in light mode** — these near-transparent white overlays vanish on cream/lavender surfaces. Use `bg-brand/20` for hover states and `bg-bg-surface` or `bg-bg-surface-2` for fills.
- **`PUBLIC_ROUTES`** in `middleware/auth.global.ts` is a hard-coded `Set`. Add new public pages (e.g. `/privacy`, `/terms`) there or the auth guard will redirect unauthenticated visitors to `/login`.
- **Throwing API-shaped errors in app code**: the linter enforces `only-throw-error` (must throw `Error` instances). Use `throw Object.assign(new Error(message), { code: 'MY_CODE' })` when you need to surface an `ApiError`-shaped throw that `useAsync` will pick up correctly.

## Architecture

### Data flow: `api/ → stores/ → composables/ → pages/`

1. **`app/api/*.ts`** — thin, typed `async` functions, one file per domain (decks, cards, auth, ai, srs, sessions, stats…). Each calls the shared `http()` helper and returns typed data. No state.
2. **`app/stores/*.ts`** — Pinia stores hold normalized state and call the `api/` functions. Stores expose a `hydrate()` for boot-time loading.
3. **`app/composables/use*.ts`** — the binding layer pages use. The common pattern wraps each store action in `useAsync` to get `{ data, error, loading, execute }` (see `useDecks.ts` → `useAsync(store.fetchList)`). `useAsync` (`composables/useAsync.ts`) is the canonical way to run an async op with loading/error state — prefer it over hand-rolled `try/catch + ref`.
4. **`app/pages/`** — file-based routes. Dynamic study routes live under `pages/study/[deckId]/[mode].vue`.

### Study flow (`useStudySession` → `usePractice` → page)

- **`useStudySession`** (`composables/useStudySession.ts`) — the queue state machine. Manages session state (`idle | loading | active | paused | results`), the shuffled card queue, elapsed timer, and API calls to `sessionsStore`. It knows nothing about SRS grades or UI.
- **`usePractice`** (`composables/usePractice.ts`) — the layer pages use. Wraps `useStudySession` and adds SRS grading (calls `srsStore.rate()`), streak tracking, a revisit list, and Mimi mood triggers. Pages should call `usePractice()`, never `useStudySession()` directly.
- **`StudyCard`** (`utils/studyCard.ts`) — adapts a raw `Card` for display. Currently `pos`, `example`, and `exampleTranslation` are mocked client-side (deterministic hash + template string); they're expected to come from the backend eventually.
- **Grades** (`utils/grades.ts`) — the four SRS ratings (`again / hard / good / easy`) with their display labels, intervals, and key hints are defined once here. Import `GRADES` rather than redefining them.

### HTTP + auth (`app/utils/http.ts`, `utils/authToken.ts`)

- All requests go through `http<T>(path, opts)`. It prefixes `/api/v1`, attaches `Authorization: Bearer <token>`, sends `credentials: 'include'`, and **normalizes every error** into an `Error` instance that also carries `{ code, message, details? }` (i.e. `Error & ApiError`). Downstream code should branch on `error.code`, not HTTP status. `useAsync` normalizes catches the same way, so consumers always see a typed `ApiError` on `.error.value`.
- **Auth is split**: a short-lived **access token in `localStorage`** (`mnemio:auth:accessToken`) + an **HttpOnly refresh cookie** (`mnemio_refresh`). On a `401`, `http()` transparently calls `/auth/refresh` (deduped via a single in-flight promise), retries once, and redirects to `/login` if refresh fails. Use `skipAuth` / `skipRefresh` opts for auth endpoints themselves.
- **Same-origin proxy** (`nuxt.config.ts` `routeRules`): in dev `apiBase` is empty, so requests hit `/api/**` on the Nuxt origin and are proxied to `http://127.0.0.1:3001`. This keeps the refresh cookie first-party (SameSite=Lax). In prod set `NUXT_PUBLIC_API_BASE`.
- Boot sequence: `plugins/01.auth.client.ts` runs `auth.hydrate()` then prefs; `middleware/auth.global.ts` (client-only) guards routes, redirecting unauthenticated users to `/login` (allow-list in `PUBLIC_ROUTES`).

### Toast system (`composables/useToast.ts`)

`useToast()` is a **module-level singleton** (plain refs, not Pinia). Call `.info()`, `.success()`, or `.error()` from anywhere. Important: **do not toast auth-expiry error codes** — `http.ts` handles those centrally (refresh + redirect). Check `isAuthExpiry(error.code)` before surfacing a toast for API errors.

### Mimi mascot (`composables/useMimi.ts`)

`useMimi()` picks random lines from the `mimi.*` keys in the active i18n catalog. Call `mimi.say(mood)` with a `MimiMood` value (`'idle' | 'forgot' | 'hard' | 'good' | 'easy' | 'streak' | 'done'`). Lines are arrays in the JSON catalogs — `useT()` can't resolve arrays, so `useMimi` reads the catalog directly.

### i18n — custom layer, NOT vue-i18n's `$t`

Translations are plain JSON in `app/i18n/{en,uk}.json`, combined in `app/i18n/index.ts` into `catalogs`. Components use the project's own `useT()` (`composables/useT.ts`): `const { t } = useT(); t('dashboard.greeting')`. It does dotted-path lookup with English fallback. **It has no interpolation** — templates substitute manually, e.g. `t('deck.cardCount').replace('{n}', String(n))`. When adding UI strings, add the key to **both** `en.json` and `uk.json`.

**Option arrays with translated labels must be `computed()`**, not plain `const`, or they won't re-render when the locale changes: `const filterOptions = computed(() => [{ value: 'all', label: t('deck.filterAll') }, ...])`. A plain `const` captures the initial locale and stays stale.

### Styling & theming

- Tailwind with a semantic color system in `tailwind.config.ts`. **Theme-aware tokens are backed by RGB-channel CSS variables** (e.g. `bg.base` → `rgb(var(--c-bg-base) / <alpha-value>)`), defined in `app/assets/css/main.css` under `:root, .dark` and `.light`. This lets `/<alpha>` opacity modifiers keep working while the palette flips with color mode.
- **`@nuxtjs/color-mode`** is configured with `classSuffix: ''` and `preference/fallback: 'dark'`, so `<html>` gets a plain `dark`/`light` class and dark is the default. To add a new themed surface/text color, add a `--c-*` channel triplet to **both** blocks in `main.css` and reference it as a `rgb(var(--c-*) / <alpha-value>)` token in the config — don't hardcode hex on components.
- `text-on-color` is for light text that must stay light on colored fills (active nav, chips) in both themes.
- For theme-conditional styles that Tailwind's `dark:` prefix can't express (e.g. gradient `background-image`), bind an inline `:style` computed from a `MutationObserver` on `document.documentElement` — see `components/study/FlashCard.vue`.
- Icons: `lucide-vue-next`. Components are auto-imported with directory prefixes (e.g. `app/components/app/Topbar.vue` → `<AppTopbar>`, `shared/DeckCard.vue` → `<SharedDeckCard>`, `ui/Button.vue` → `<UiButton>`).

### Validation

Zod schemas live in `app/schemas/` and are applied with `utils/zodValidator.ts` (used with vee-validate for forms).

## Conventions

- TypeScript throughout; arrow-function style (the codebase and lint config favor arrow callbacks). `eqeqeq`, `curly`, `prefer-template`, `no-floating-promises` are enforced on `.ts`.
- Path aliases: `@/` and `~/` both map to `app/`.
- Reference data shapes via the types in `app/types/` rather than redeclaring inline.
