# AGENTS.md

Cross-tool agent guidance for **Mnemio** (frontend). The full, canonical guide
lives in [`CLAUDE.md`](./CLAUDE.md) — read it first. This file is a standalone
quick reference for agents that don't load `CLAUDE.md`.

## Project

Frontend for **Mnemio**, a flashcard / spaced-repetition learning app
(npm package is still named `quizlet` — legacy). Talks to a separate backend
over HTTP; the contract is [`docs/api-contract.md`](./docs/api-contract.md).

**Stack:** Nuxt 4 · Vue 3 (`<script setup>`) · TypeScript (strict) · Pinia ·
Tailwind + shadcn-vue · @nuxtjs/i18n (en/uk) · vee-validate + zod.

## Commands

```bash
npm run dev       # dev server — REQUIRES the backend on http://127.0.0.1:3001
npm run build     # production build
npm run lint      # eslint
npm run validate  # lint + prettier check — run before declaring work done
```

No test runner is configured. Verify via `npm run validate` + running the app.

## Layered architecture (respect these boundaries)

`pages/components → composables (useAsync) → Pinia stores → app/api/* → app/utils/http.ts → backend /api/v1`

- **`app/utils/http.ts`** is the only fetch wrapper: `/api/v1` prefix, `Bearer`
  access token (localStorage), `credentials:'include'` for the HttpOnly
  `mnemio_refresh` cookie, 401→refresh→retry once, normalized `{code,message}` errors.
- **`app/api/*`** — typed fns per domain; adapt backend wire types → FE types here.
- **`app/stores/*`** — Pinia **setup** stores: `defineStore('id', () => {…})`.
- **`app/composables/*`** — wrap store actions in `useAsync` → `{data,error,loading,execute}`.
  Never call `http` directly from components.
- `@/` is aliased to `app/`.

## Dev proxy

`nuxt.config.ts` proxies `/api/**` → `http://127.0.0.1:3001/api/**` (keeps the
refresh cookie first-party). The backend **must** run on `:3001` in dev. Set
`NUXT_PUBLIC_API_BASE` in prod. Demo user (backend `npm run seed`):
`demo@mnemio.local` / `demo-password-123`.

## Conventions

- TypeScript strict; handle `null`, no implicit `any`.
- i18n: add UI strings to **both** `app/i18n/en.json` and `uk.json`; read them
  with `const { t } = useT(); t('some.key')`.
- Components auto-import with a path-derived prefix (e.g. `components/shared/StatTile.vue`
  → `<SharedStatTile>`); follow the pattern used in nearby files.
- Styling: Tailwind with custom design tokens (`cream`, `plum`, `pink`, `brand`,
  `bg-surface`, custom `text-display-sm/h2/body/eyebrow` scale). Visual reference
  lives in `new_design/`.
- Format: Prettier — 4-space tabs, single quotes, semicolons, trailing commas, width 100.
- Git: work branch `development`, PRs target `main`, conventional commit messages.
  Commit/push only when asked.

For anything not covered here, see [`CLAUDE.md`](./CLAUDE.md) and
[`docs/api-contract.md`](./docs/api-contract.md).
