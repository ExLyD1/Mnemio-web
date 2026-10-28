# Mnemio in Notion — the map

Notion holds the **product and business** side of Mnemio. Nothing technical:
no architecture, no API docs, no decision records, no code. That stays in the
repos.

## Three rules

1. **One topic per page.** If you can't say what a page is for in one sentence,
   it's two pages.
2. **Plain language, no water.** Short sentences. Every number gets a date. If
   a paragraph doesn't change a decision, delete it.
3. **Numbered and flat.** One level deep. You find anything by reading fourteen
   page names, not by digging.

---

## The pages

Top-level page: **Mnemio**. Inside it, these fourteen children.

They're ordered so the page numbers tell a story — _what it is → who it's for →
the market → the money → what we're building → how people find us_. Your
original ten are all here; the four you picked are slotted where they read
best, not appended at the end. Renumber if you'd rather.

---

### 01 · What Mnemio is

One line, then a short paragraph, then the core loop in five steps.
_Here:_ the pitch, the site, the languages, who builds it.
_Not here:_ the feature list (11), why we're better (06).

### 02 · The problem we solve

The three real problems, in the user's words — not ours.
_Per problem:_ **who has it · when it bites · what they do today · why that's
bad.**
_Not here:_ our solution. One sentence at the bottom, maximum.

### 03 · Audience

- Who it's for — one paragraph, one person you can picture
- Beachhead: the one segment we chase first, and why it's reachable
- Secondary audiences, parked
- Explicitly **not** for us, and why
- Real users talked to: who · date · what they said

### 04 · User journey

Where a person goes and where they fall off.
_The steps:_ first visit → signup → onboarding → first deck → first study
session → first review (day 2) → day 7.
_Per step:_ what they do · what could stop them · what we know (⚠️ or a dated
number).
Keep this page honest and ugly. It's the page that tells you what to fix next.

### 05 · Competitors

The comparison table (us vs Quizlet vs Anki) at the top, then one short block
each: **what they do well · where they're weak · what we take from them · what
would make them dangerous.**
Six competitors maximum. A list of twenty is a list nobody reads.

### 06 · Positioning & messaging

Everything ever written about Mnemio starts here.

- The one-liner (one sentence, no "and")
- The elevator pitch (three sentences)
- Three taglines we actually use
- What we claim, and the proof for each claim
- Words we use · words we never use
- How we describe ourselves against Quizlet and against Anki — differently

### 07 · Market size (TAM · SAM · SOM)

_Per number:_ the figure, the arithmetic behind it, the source, the date.
A number without its arithmetic is decoration.

- TAM — everyone who could ever use this
- SAM — who we can serve today (language learners, EN+UK, web)
- SOM — what we could realistically win in 12 months

### 08 · Monetization

Free vs premium, the price, what premium actually buys, and **why we gate AI
volume instead of features.** Plus models considered and rejected (one line
each), and the pricing questions still open.

### 09 · Unit economics

The formula, the four unknowns, today's best numbers with a date.
Revenue per subscriber → minus payment fees → minus their AI cost → minus the
free users they carry. Plus the worst-case monthly cost of a single free user,
which the daily caps make calculable — that number is your floor of safety.

### 10 · Costs per service

Table: **service · what it's for · flat or per-use · monthly amount · last
checked.**
One line underneath: which costs grow with users. Today only AI does.

### 11 · Features — KYIV Framework

The feature inventory plus what to build next, scored.

**Structure:** one table, one row per feature.

| Feature | What it does (one line) | For whom | K   | Y   | I   | V   | Score | Tier | Status |
| ------- | ----------------------- | -------- | --- | --- | --- | --- | ----- | ---- | ------ |

- **K / Y / I / V** — your four scoring criteria, 1–5 each. Name them on the
  page itself, right above the table, with one line on what a 1 and a 5 mean.
  (⚠️ Tell me what the letters stand for and I'll write that header for you.)
- **Score** — however you combine them (sum, or value ÷ effort). Write the
  formula on the page once so every row is scored the same way.
- **Tier** — `must` · `should` · `could` · `won't (this quarter)`.
- **Status** — `idea` · `building` · `live` · `parked` · `killed`.

Two rules that keep this page useful:

1. Everything already built goes in too, as `live` — otherwise you can't see
   what you're adding to.
2. Re-score only when something real changes (a user says something, a number
   moves). Scores that get re-argued weekly are just opinions with decimals.

### 12 · Social media

- Where we are: handle · link · followers · last posted
- Where we should be, and why — one line each
- What we post: 3–5 recurring post types
- What we never post
- This month's plan

### 13 · Growth channels

One block per channel: **what we tried · what it returned · verdict (keep /
stop / retry later) · date.**
Channels that exist today: intent landing pages, public decks in search, the
blog, copied decks spreading by word of mouth. Everything else is untested —
say so rather than leaving it blank.
This page's whole job is to stop you re-running a dead channel next quarter.

### 14 · Metrics

One dated row per week. Nothing else on the page.

| Week | Visitors | Signups | Active users | Subscribers | MRR | Note |
| ---- | -------- | ------- | ------------ | ----------- | --- | ---- |

Pick **one** north-star number and write it at the top of the page in bold.
Everything else on the table is supporting detail.

---

## Extras you skipped (here if you change your mind)

| Page                         | What it's for                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Roadmap (now / next / later) | Three dated lists. Largely covered by page 11's Tier column.                                              |
| SEO & content plan           | Pages and articles: URL, target search, language, live?, traffic. Add when SEO becomes a weekly activity. |
| User feedback                | Raw quotes with date and source, never summarised. Add the day you have real users.                       |
| Launch plan                  | Product Hunt, Reddit, student communities — checklist with dates. Add when a launch is scheduled.         |
| Brand                        | Logo files, colours, fonts, Mimi's personality, tone of voice.                                            |
| Risks & assumptions          | What must be true for this to work, and what kills it.                                                    |
| Legal & admin                | Entity, Paddle as merchant of record, policies, contact.                                                  |
| Partnerships                 | Schools, teachers, tutors — only if B2B2C becomes a direction.                                            |
| Weekly journal               | One short entry a week: what happened, what I decided, what's next. Cheapest possible memory.             |

---

## Filling it in

Run these in the Claude project, one at a time, with the Notion connector on.

**1 — Build the skeleton**

> Create the Notion structure from `03-notion-map.md`: a top-level private page
> "Mnemio" with the fourteen numbered child pages, each holding its one-line
> purpose and the empty template from the map. No content yet. Send me the link.

**2 — The product pages**

> Draft pages 01, 02, 03 and 05 from `01-product-context.md`. Plain language,
> short sentences, no technical terms. Anything you can't support from the file,
> leave as a `⚠️` question for me instead of guessing.

**3 — Positioning**

> Draft page 06 from §1, §6 and §7 of `01-product-context.md`. Give me three
> candidate one-liners and three taglines, each with the claim it rests on and
> whether we can actually prove it. Mark the unprovable ones.

**4 — Money pages**

> Draft 08, 09 and 10 from §8, §9 and §10 of `01-product-context.md`. Leave
> every unknown as `⚠️ TODO` with the question spelled out. Never invent an
> amount.

**5 — Features**

> Fill page 11's table with everything already built, from §5 of
> `01-product-context.md`: one row per feature, Status `live`, Tier blank,
> scores blank. Don't add features that aren't in the file. Then list the
> candidate next features separately for me to score.

**6 — Journey and channels**

> Draft page 04 from §4 of `01-product-context.md` and page 13 from §11. Mark
> every drop-off rate and every channel result as `⚠️` — we have no data yet,
> and I'd rather see the holes than a plausible guess.

**7 — Market size** (do this with me, not for me)

> Walk me through TAM/SAM/SOM for Mnemio one step at a time. Ask for the inputs
> you need, show the arithmetic, and write page 07 only once I've agreed to the
> numbers.

Then keep it alive with one habit, at the end of a working session:

> Update the Notion pages today's conversation changed, and tell me which ones
> you touched.
