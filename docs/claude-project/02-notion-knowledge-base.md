# Mnemio knowledge base in Notion — structure & working rules

The point of this KB is **not** to duplicate the repos. Code, the API contract
and the Prisma schema already live in git and are kept honest by CI. Notion
holds what git is bad at: decisions and their reasons, product state, growth
work, metrics, and the things you'd otherwise re-derive every three months.

Rule of thumb: **if it would go stale the moment you merge a PR, it belongs in
the repo. If it explains *why*, it belongs in Notion.**

---

## Top-level structure

```
Mnemio HQ                        (one top-level page; everything nests under it)
├── 00 · Start here              overview + links + "current focus" callout
├── 01 · Product
│   ├── Features                 (database)
│   ├── Roadmap                  (database — now / next / later)
│   └── Positioning & ICP        page: who it's for, vs Quizlet/Anki, messaging
├── 02 · Decisions (ADR)         (database — append-only)
├── 03 · Specs                   (database — one page per feature spec)
├── 04 · Engineering
│   ├── Architecture map         page: the layering + the 2 http exceptions
│   ├── Invariants               page: the FE/BE contract rules you must not break
│   ├── Runbook                  deploy, envs, rotate secrets, restore DB
│   └── Bug patterns             (database — recurring classes of bug, not tickets)
├── 05 · Growth
│   ├── SEO pages                (database — one row per landing page/article)
│   ├── Content calendar         (database)
│   └── Experiments              (database — hypothesis → result)
├── 06 · Metrics                 page/database: weekly numbers snapshot
├── 07 · Monetization            pricing, caps, Paddle setup, refund policy notes
└── 08 · Sessions                (database — one page per working session w/ Claude)
```

Eight sections is the ceiling. If you can't keep a database fed, delete it —
an abandoned Notion database is worse than no database, because it lies.

---

## Databases: properties that actually earn their keep

### Features
| Property | Type | Values |
|---|---|---|
| Name | title | |
| Status | select | `idea` · `spec'd` · `building` · `shipped` · `deferred` · `killed` |
| Surface | multi-select | `frontend` · `backend` · `AI` · `billing` · `SEO` |
| Plan gate | select | `free` · `premium` |
| Spec | relation | → Specs |
| Decisions | relation | → Decisions |
| Shipped | date | |
| Notes | text | one line: what it actually does |

Seed it from §2 of `01-mnemio-context.md` — that table is already a feature
inventory.

### Decisions (ADR)
| Property | Type | Notes |
|---|---|---|
| Title | title | `Paddle over Stripe for billing` |
| Date | date | |
| Status | select | `active` · `superseded` |
| Supersedes / Superseded by | relation (self) | never delete an old decision |
| Area | multi-select | `architecture` · `product` · `growth` · `money` · `infra` |

Page body template — four headings, nothing more:
`Context` · `Decision` · `Alternatives rejected (and why)` · `Consequences`.

**Backfill these first.** Highest-value decisions already made:
Paddle over Stripe · Nuxt SSR only for public/crawler pages · refresh token in
an HttpOnly cookie instead of a body · hand-maintained api-contract instead of
generated OpenAPI · SM-2 instead of FSRS · allowlist route guard instead of a
denylist · caps-based paywall (AI volume) instead of gating study modes ·
EN+UK only · Claude Haiku as the AI provider · no test runner on the frontend ·
Mimi as a composable rather than a store.

That list alone is worth the whole exercise: each one is a question you will
otherwise re-open.

### Specs
Status `draft → approved → built`, relation to Features, and a body template:
`Problem` · `User story` · `Scope / Out of scope` · `API changes` ·
`UI states (incl. empty/error/loading)` · `Analytics events` · `Risks`.
Have Claude generate the spec in chat, then push it here.

### Bug patterns
Not a ticket tracker (git history and GitHub issues do that). One row per
*class* of bug that bit you more than once, with `Symptom`, `Root cause`,
`Guard` (the test/lint/convention that now prevents it). `FIXED.md` and the
Sep-2026 audit commits are the raw material — e.g. "i18n keys added to en.json
only", "stats computed in UTC instead of the user's local day", "FE invented a
field the contract doesn't have", "SSR page used `http.ts` and touched
localStorage".

### SEO pages
| Property | Type |
|---|---|
| URL | url / text (`/free-quizlet-alternative`) |
| Target query | text |
| Locale | select `en` · `uk` |
| Status | select `live` · `draft` · `idea` |
| Indexed | checkbox |
| Impressions / Clicks / Position | number (updated when you check Search Console) |

### Experiments
`Hypothesis` · `Change` · `Metric` · `Result` · `Decision` (keep / revert).
Keeps you from re-running a losing experiment next quarter.

### Sessions
One page per substantial working session: date, what you were doing, what was
decided, what's next. This is what makes a new chat productive three weeks
later — the *thread* of the work, which project knowledge files can't capture.

---

## Working rules (also encoded in the project instructions)

1. **Search before writing.** Update the existing page; don't create a second
   one with a similar name.
2. **Decisions are append-only.** Superseding a decision creates a new row and
   flips the old one to `superseded` with a relation.
3. **One source of truth per fact.** Endpoints, payloads, error codes and env
   vars live in the repos. Notion links to them; it does not copy them. The one
   exception is the *Invariants* page, which restates the ~14 contract rules
   because they're load-bearing in every design conversation — mark it with the
   contract's date and re-check it when the contract changes.
4. **Date every snapshot.** Metrics and status pages get an "as of" line at the
   top. An undated number is a trap.
5. **Notion is for the why; git is for the what.** If a Notion page starts to
   look like documentation of code, move it into the repo's `docs/`.

---

## Bootstrapping it (prompts to run in the new project)

Run these one at a time, in order, in the Mnemio project with the Notion
connector enabled and the knowledge files uploaded.

**1 — Skeleton**
> Create the Notion structure from `02-notion-knowledge-base.md` under a new
> top-level private page called "Mnemio HQ": the 8 sections and the 7 databases
> with exactly the properties specified. Don't fill in content yet. Show me the
> links when done.

**2 — Feature inventory**
> Populate the Features database from §2 and §6 of `01-mnemio-context.md`. One
> row per feature area, with Status, Surface, Plan gate and a one-line note. Do
> not invent features that aren't in the context file.

**3 — Decisions backfill** (the highest-value step)
> Create Decision pages for the decisions listed under "Backfill these first"
> in `02-notion-knowledge-base.md`. For each, fill Context / Decision /
> Alternatives rejected / Consequences from the knowledge files. Where you
> don't know my actual reasoning, write the page with a `⚠️ assumed reasoning`
> callout at the top instead of guessing silently, and list which ones you
> flagged so I can correct them.

**4 — Invariants page**
> From `mnemio-backend/docs/api-contract.md` §0, write the Invariants page as a
> numbered list of the FE/BE rules, each with one line on what breaks if it's
> violated. Head it with "as of <contract date>".

**5 — Bug patterns**
> From `FIXED.md` and the known-stale list, extract recurring bug *classes* (not
> individual bugs) into the Bug patterns database, each with Symptom / Root
> cause / Guard.

**6 — Growth**
> Populate SEO pages from §9 of `01-mnemio-context.md`. Leave the metrics
> columns empty; I'll fill them from Search Console.

Then keep it alive: end each real working session with
> Write a Session page for today's work and update any Feature/Decision rows it
> changed.
