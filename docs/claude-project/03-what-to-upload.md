# What to put in the project, in what order, and how to keep it fresh

## The principle

Project knowledge is retrieved, not free. More files ≠ more context — a project
stuffed with stale READMEs and raw source trees makes answers *worse*, because
the model can't tell which version of reality it's looking at. So: **a few
curated, dated, non-contradictory documents**, plus live connectors for the
things that change hourly.

Three tiers:

| Tier | What | Why |
|---|---|---|
| **A — upload** | Curated docs that rarely change and are known-true | Cheap, high signal |
| **B — connect** | Notion (KB) and, if your plan offers it, the GitHub repos | Always current, no manual refresh |
| **C — paste on demand** | Specific source files, for the one question that needs them | Avoids permanently budgeting tokens for code |

---

## Tier A — upload these, in this order

Upload order matters a little (earlier files anchor the later ones), but
*naming* matters more — the numeric prefixes are what let you say "per 01, …".

| # | File | Where it is | Why |
|---|---|---|---|
| 1 | `01-mnemio-context.md` | `mnemio-frontend/docs/claude-project/` | The snapshot. Single most important file. |
| 2 | `api-contract.md` | **`mnemio-backend/docs/`** ⚠️ not the frontend copy | 2 350 lines, authoritative, current. Every endpoint, payload, error code, invariant. |
| 3 | `CLAUDE.md` | `mnemio-frontend/` | Frontend conventions, layering, component patterns, styling rules. |
| 4 | `AGENTS.md` | `mnemio-backend/` | Backend conventions (178 lines). |
| 5 | `02-notion-knowledge-base.md` | `docs/claude-project/` | So Claude knows where to file things in Notion. |
| 6 | `backlog.md` | `mnemio-backend/docs/` | The deliberately-deferred list with revisit triggers. Stops Claude proposing "missing" features you already decided against. |
| 7 | `deployment.md` | `mnemio-backend/docs/` | Railway, migrations, env, media swap path. |
| 8 | `analytics-strategy.md` + `analytics-implementation-plan.md` | `mnemio-frontend/docs/` | Needed for any growth/metrics conversation. |
| 9 | `schema.txt` | generate it (see below) | The full Prisma schema concatenated — the data model in one file. |
| 10 | `tree.txt` | generate it (see below) | A file map of both repos, so Claude can name the right file to paste. |

Generate 9 and 10 before uploading:

```bash
cd ~/Data/work-projects
cat mnemio-backend/prisma/*.prisma > /tmp/mnemio-schema.txt

{ echo "=== mnemio-frontend ==="; \
  find mnemio-frontend/app mnemio-frontend/server -type f \
    \( -name '*.ts' -o -name '*.vue' \) | sort; \
  echo; echo "=== mnemio-backend ==="; \
  find mnemio-backend/src mnemio-backend/prisma -type f \
    \( -name '*.ts' -o -name '*.prisma' \) | sort; \
} > /tmp/mnemio-tree.txt
```

### Do NOT upload

- `mnemio-frontend/README.md`, `mnemio-backend/README.md`,
  `mnemio-frontend/docs/api-contract.md`,
  `mnemio-backend/docs/paid-subscription-plan.md` — all stale (see §12 of the
  context file). Uploading them means Claude will confidently tell you billing
  is Stripe and the AI provider is a mock.
- `FIXED.md` — upload it *only* while doing the Notion bug-patterns backfill,
  then remove it. It's history, and it reads like current state.
- `package-lock.json`, `node_modules`, `.env` (obviously), the whole `app/`
  source tree, i18n JSON files (big, low signal per token).
- `.env.example` files — summarised in §10 of the context file already, and the
  frontend one contains a live sandbox Paddle token.

---

## Tier B — connectors

- **Notion** — enable it. This is the project's long-term memory; see
  `02-notion-knowledge-base.md`.
- **GitHub** — if the project-knowledge panel offers "Add from GitHub" on your
  plan, connect both repos. That's strictly better than uploading code: it
  stays current and is searched on demand. If it isn't offered, don't worry —
  tiers A and C cover it.
- **Google Drive** — only if you keep designs/spreadsheets there.

If you connect GitHub, still upload `01-mnemio-context.md`. The repos tell
Claude *what the code is*; the context file tells it *what's true, what's
stale, and what you've already decided*.

---

## Tier C — the paste-on-demand habit

For a question that needs real code, say:
> Per `tree.txt`, tell me which files you need and I'll paste them.

Then paste. Don't pre-upload code "just in case" — it ages badly and you'll
forget which version is in there.

---

## Keeping it fresh

**The ritual:** after any sprint that changes architecture, the API, pricing or
the stack — and otherwise once a month — refresh file 1 and re-upload. Nothing
else needs touching.

Run this in **Claude Code**, from the frontend repo:

```text
Re-generate docs/claude-project/01-mnemio-context.md as a fresh snapshot.

Read, from the actual source (not from any README):
  - mnemio-backend/docs/api-contract.md §0 and the endpoint inventory
  - mnemio-backend/src/config/env.ts (env vars + daily caps)
  - mnemio-backend/prisma/*.prisma (data model)
  - mnemio-backend/src/{routes,services}/ (what exists)
  - mnemio-frontend/{nuxt.config.ts,package.json,CLAUDE.md}
  - mnemio-frontend/app/{api,stores,composables,pages}/ (inventory only)
  - git log --oneline -40 in both repos (recent direction)

Keep the existing section structure and the snapshot-date header. Update every
table. Re-verify §12 "Known-stale documents" — add any doc that has since gone
stale, remove any that was fixed. Preserve my hand-written answers in the
"FILL IN" block of §1 verbatim. Report at the end what changed since the last
snapshot, as a short list.
```

Then in the Desktop project: delete the old `01-mnemio-context.md` from project
knowledge and upload the new one. (Replace, don't add — two snapshots in the
same project is exactly the contradiction this whole document is trying to
avoid.)

**Smaller signal:** when a chat in the project reveals that the snapshot is
wrong, don't patch it in Notion. Note it, and fold it into the next refresh. One
file, one truth.

---

## First-session checklist

1. Create the project, title `Mnemio`.
2. Paste the block from `00-PROJECT-INSTRUCTIONS.md` into project instructions.
3. Fill in the ⚠️ **FILL IN** block in §1 of `01-mnemio-context.md` (users,
   revenue, launch status, this quarter's metric) — do this before uploading.
4. Generate `schema.txt` + `tree.txt`.
5. Upload tier A (10 files), skipping the "do not upload" list.
6. Enable the Notion connector (+ GitHub if available).
7. Sanity-check with these three questions — if any answer is wrong, the context
   is wrong, not the model:
   - *"What payment provider does Mnemio use, and how is entitlement computed?"*
     → Paddle; `status IN (trialing, active, past_due, canceled) AND
     currentPeriodEnd > now()`.
   - *"How many AI enrich calls does a free user get per day, and what happens
     on the 6th?"* → 5; `AI_BUDGET_EXCEEDED` → paywall modal via
     `usePremiumGateStore()`.
   - *"Can I use `http.ts` on a server-rendered discover page?"* → No; it reads
     `localStorage`. Use `publicHttp.ts` inside `useAsyncData`.
8. Run the Notion bootstrap prompts from `02-notion-knowledge-base.md`,
   starting with the skeleton and the decisions backfill.
