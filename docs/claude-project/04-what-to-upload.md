# What to put in the project, and how to keep it fresh

## The principle

Project knowledge is retrieved, not free. More files ≠ more context — a project
stuffed with stale READMEs makes answers *worse*, because the model can't tell
which version of reality it's looking at. So: **a few curated, dated,
non-contradictory documents**, plus live connectors for what changes daily.

| Tier | What | Why |
|---|---|---|
| **A — upload** | Curated docs that rarely change and are known-true | Cheap, high signal |
| **B — connect** | Notion, and the GitHub repos if your plan offers it | Always current, no manual refresh |
| **C — paste on demand** | Specific source files, for the one question that needs them | Don't permanently budget tokens for code |

---

## Tier A — upload these

| # | File | Where | Why |
|---|---|---|---|
| 1 | `01-product-context.md` | `mnemio-frontend/docs/claude-project/` | The product snapshot. Fuels every product, pricing and growth conversation. |
| 2 | `02-tech-context.md` | same folder | The engineering snapshot. |
| 3 | `03-notion-map.md` | same folder | So Claude knows which Notion page a fact belongs on. |
| 4 | `api-contract.md` | **`mnemio-backend/docs/`** ⚠️ not the frontend copy | 2 350 lines, authoritative, current: every endpoint, payload, error code, invariant. |
| 5 | `CLAUDE.md` | `mnemio-frontend/` | Frontend conventions, layering, component patterns, styling. |
| 6 | `AGENTS.md` | `mnemio-backend/` | Backend conventions. |
| 7 | `backlog.md` | `mnemio-backend/docs/` | The deliberately-deferred list with revisit triggers — stops Claude proposing "missing" features you already decided against. |
| 8 | `deployment.md` | `mnemio-backend/docs/` | Railway, migrations, envs. |
| 9 | `analytics-strategy.md` + `analytics-implementation-plan.md` | `mnemio-frontend/docs/` | Needed for any metrics or growth work. |
| 10 | `schema.txt` | generate (below) | The data model in one file. |
| 11 | `tree.txt` | generate (below) | File map of both repos, so Claude can name the file to paste. |

If you only ever upload three: **1, 2, 4.**

Generate 10 and 11 first:

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
  tech context). Upload them and Claude will tell you billing is Stripe, the AI
  provider is a mock, and OAuth isn't wired.
- `FIXED.md` — history that reads like current state.
- `package-lock.json`, `node_modules`, `.env`, the whole `app/` tree, the i18n
  JSON files (big, low signal).
- `.env.example` — summarised in the tech context already, and the frontend one
  carries a live sandbox Paddle token.

---

## Tier B — connectors

- **Notion** — on. This is the product's long-term memory; map in
  `03-notion-map.md`.
- **GitHub** — if the knowledge panel offers "Add from GitHub" on your plan,
  connect both repos. Strictly better than uploading code: current, searched on
  demand. Still upload the two context files — the repos say what the code *is*,
  the snapshots say what's *true, stale, and already decided*.
- **Google Drive** — only if designs or spreadsheets live there.

---

## Tier C — paste on demand

For a question that needs real code:
> Per `tree.txt`, tell me which files you need and I'll paste them.

Don't pre-upload code "just in case" — it ages badly and you'll forget which
version is in there.

---

## Keeping it fresh

After any sprint that changes architecture, the API, pricing or the stack — and
otherwise once a month — refresh the snapshots and re-upload. Nothing else
needs touching.

Run this in **Claude Code** from the frontend repo:

```text
Refresh docs/claude-project/01-product-context.md and 02-tech-context.md.

For the TECH file, read the actual source (never a README):
  - mnemio-backend/docs/api-contract.md §0 + endpoint inventory
  - mnemio-backend/src/config/env.ts (env vars + daily caps)
  - mnemio-backend/prisma/*.prisma
  - mnemio-backend/src/{routes,services}/
  - mnemio-frontend/{nuxt.config.ts,package.json,CLAUDE.md}
  - mnemio-frontend/app/{api,stores,composables,pages}/ (inventory only)
  - git log --oneline -40 in both repos
Keep the structure and the snapshot date header. Update every table. Re-verify
§12 "Known-stale documents" — add newly stale docs, remove fixed ones.

For the PRODUCT file, update only what the code can prove: features shipped,
caps, price, the live landing pages, what's deferred. Preserve every one of my
hand-written answers and ⚠️ FILL IN blocks verbatim — never overwrite them with
a guess.

Finish with a short list of what changed since the last snapshot.
```

Then in the Desktop project: **delete the old file from project knowledge and
upload the new one.** Replace, never add — two snapshots in one project is
exactly the contradiction this document exists to prevent.

When a chat reveals the snapshot is wrong, don't patch it in Notion. Note it and
fold it into the next refresh. One file, one truth.

---

## First-session checklist

1. Create the project, title `Mnemio`.
2. Paste the block from `00-PROJECT-INSTRUCTIONS.md` into project instructions.
3. **Fill the ⚠️ blocks in `01-product-context.md`** — launch status, users,
   subscribers, MRR, traffic, this quarter's metric, real costs. Do it before
   uploading; most product answers hinge on them.
4. Generate `schema.txt` + `tree.txt`.
5. Upload tier A, skipping the "do not upload" list.
6. Turn on the Notion connector (+ GitHub if available).
7. Sanity-check with three questions — a wrong answer means the context is
   wrong, not the model:
   - *"What does premium actually buy, and why is it gated that way?"* → higher
     daily AI caps, ~10×; the learning loop stays free because the habit is what
     creates a paying customer.
   - *"How many AI word-list fills does a free user get per day, and what
     happens on the 6th?"* → 5; a paywall dialog naming that limit.
   - *"Can I use `http.ts` on a server-rendered discover page?"* → No; it reads
     `localStorage`. Use `publicHttp.ts` inside `useAsyncData`.
8. Run the Notion prompts from `03-notion-map.md`, starting with the skeleton.
