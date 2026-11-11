# Mnemio — product context

**Snapshot date:** 2026-10-08
**This file is the product view:** what Mnemio is, who it's for, how it makes
money, how people find it. No code. The engineering view lives in
`02-tech-context.md` — don't mix the two.

---

## 1. In one line

Mnemio is a flashcard app that writes the flashcards for you, then makes sure
you actually remember them.

A longer version: you give Mnemio a list of words, a topic, or a photo of a
textbook page. It turns that into proper flashcards — translation, meaning,
part of speech, an example sentence. Then it schedules those cards so each one
comes back just before you'd forget it, and tracks your progress so coming back
tomorrow feels worth it.

Site: **mnemio.xyz** (live, publicly accessible) · staging: **dev.mnemio.xyz** ·
Interface: **English and Ukrainian** · Built and run by one person.

**Where we actually are:** publicly launched and working, but pre-traction.
No real users yet beyond friends. Paddle is still in sandbox, so nobody has
paid for anything — zero subscribers, zero conversion data, no measured
retention. Every number in this file that isn't a cost or a cap is a guess, and
is marked as one.

---

## 2. The problem

Learning vocabulary with flashcards works. Almost nobody keeps doing it, for
three reasons:

1. **Making the cards is the boring part.** Typing 80 words and their meanings
   takes an hour before any learning happens. Most people quit here.
2. **Reviewing on your own is guesswork.** Without a schedule you re-read the
   words you already know and never see the ones you half-know.
3. **The good tools make you choose.** Anki schedules brilliantly but looks and
   feels like software from 2009 and takes a weekend to learn. Quizlet is
   friendly but has turned its best features — and the quiet of not seeing ads —
   into a subscription.

Mnemio's answer: **AI removes the typing, spaced repetition removes the
guesswork, and the learning itself stays free.**

---

## 3. Who it's for

**Decided focus: people learning English.** Not language learners in general —
English specifically. Everything (copy, landing pages, example decks, defaults)
aims there.

**Beachhead:** Ukrainian students preparing for **НМТ English**. This is the
sharp end of the same group, and it's coherent rather than a compromise: they
are English learners, they have a fixed published word list ("лексичний
мінімум"), they're reachable through Ukrainian-language search, and Quizlet
serves them with an English-only interface. The Ukrainian interface and the UA
landing pages are what make this beachhead winnable — they are not a second
market, they're the way into the first one.

**Primary, more broadly:** self-directed English learners, roughly 16–30, who
already know they should be using flashcards and have tried Quizlet or Anki.
They have a word list from somewhere — a textbook, a class, a film, an exam
syllabus — and want it to become a deck without an hour of typing.

**Secondary / later:** other languages (the product is language-agnostic
already), then anyone memorising structured facts — medical and law students,
certification exams. Nothing is aimed at them.

**Not for (today):** classrooms and teachers (no groups, no assignments, no
class dashboard), and anyone who wants a full language course — Mnemio does
vocabulary and recall, not grammar or conversation.

**Real users so far:** friends only. Nobody from the beachhead has used it yet,
so there is no feedback, no retention curve, and no evidence for any claim in
this section. Treat all of it as a hypothesis to test, starting with ten real
НМТ candidates.

---

## 4. How it works, from the user's side

1. **Sign up** with email (a code arrives) or Google. A short onboarding asks
   your native language, what you're learning, and why.
2. **Get a deck.** Four ways: paste a word list and let AI fill in the rest;
   describe a topic and let AI build the deck; photograph a textbook page;
   or copy a public deck someone else made. You can also import a Quizlet set
   or plain text, or type cards by hand.
3. **Study.** Pick a mode — flashcards, true/false, multiple choice, matching,
   written answer, or guided learning. Every mode is free.
4. **Grade yourself** on each card: again / hard / good / easy. That grade sets
   when the card comes back.
5. **Come back to Review.** The cards due today are waiting, oldest-overdue
   first. This is the habit the whole product is built around.
6. **See it add up.** XP, a streak, a year-long activity heatmap, retention per
   deck, achievements, and which decks are letting you down.

**Mimi** is the AI tutor sitting alongside all of this. It's a chat: ask it to
explain a word, build a deck, or add cards to a deck you already have — and it
does it, in the conversation, in your language. It also drops short nudges on
the dashboard and in Review.

---

## 5. What's actually built

Everything below works today.

**Learning**
Six study modes · "just browse" mode that doesn't affect your schedule ·
spaced repetition (SM-2, the algorithm behind Anki) · a Review queue of
everything due · resume an interrupted session · independent progress on
public decks, so studying someone else's deck doesn't touch their progress.

**Creating**
Decks with covers, colours and subjects · rich cards (term, meaning,
translation, part of speech, example sentence, reading, tags, difficulty,
image, audio) · bulk add · import from Quizlet or plain text · export ·
make a deck public.

**AI**
Fill in a word list (up to 100 words at once) · build a deck from a topic ·
build a deck from a photo · Mimi chat that can create decks and add cards ·
contextual nudges. Replies stream in as they're written, in English or
Ukrainian.

**Motivation**
XP (earned per session, calculated server-side so it can't be faked) ·
daily streak, counted in your own time zone · 7 achievements · stats:
retention, days practiced, study time, a 53-week heatmap, weakest decks.

**Discovery**
A public deck catalogue browsable by subject and language, with featured
decks — and it's readable by search engines, so individual public decks pull in
traffic.

**Account & money**
Email + password with verification, Google sign-in, profile, preferences,
avatar upload, account deletion, light/dark theme, EN/UK interface,
subscriptions and a self-service billing portal.

---

## 6. What makes it different

|                                | Mnemio                             | Quizlet                           | Anki              |
| ------------------------------ | ---------------------------------- | --------------------------------- | ----------------- |
| Making cards                   | AI does it — list, topic, or photo | You type them (AI behind paywall) | You type them     |
| Study modes                    | All six, free                      | Best ones behind Plus             | One, plus add-ons |
| Scheduling                     | SM-2, on by default                | Weak unless you pay               | Best in class     |
| Ads                            | None                               | Yes, on free                      | None              |
| Learning curve                 | Sign up and go                     | Easy                              | Steep             |
| Ukrainian interface            | Yes                                | No                                | Partial           |
| AI tutor that edits your decks | Yes (Mimi)                         | No                                | No                |

The honest one-line pitch: **the scheduling of Anki, the friendliness of
Quizlet, and the card-writing done for you.**

---

## 7. Competitors

This is positioning, not market research — worth a real pass later.

- **Quizlet** — the default. Huge library, familiar, now aggressively
  monetised. Most Mnemio users will arrive from here. Main threat: they ship
  good AI card generation on the free tier.
- **Anki** — the serious learners' choice. Free, powerful, ugly, hard. Not
  really competing for the same person; competing for the same _job_.
- **Memrise / Brainscape / Cram** — mid-sized flashcard apps, each with one
  strong idea (video, confidence-based repetition, simplicity).
- **Knowunity / StudySmarter / Vaia** — student study apps with AI, strong in
  Europe, going after the same age group with a wider scope.
- **Duolingo** — not a competitor by feature, but it's where the attention and
  the habit already live. It sets the expectation for what a learning streak
  should feel like.
- **ChatGPT alone** — the real quiet competitor. Someone can ask it for twenty
  words and their meanings for free. What they _can't_ get is the schedule, the
  progress, and the habit. That gap is the product.

---

## 8. Monetization

**Model:** freemium subscription. Paddle handles payment and is the merchant of
record, so it deals with VAT and local currencies; prices are shown in the
visitor's own currency.

**Status: sandbox.** Paddle is not live yet, so there are no subscribers, no
MRR and no conversion rate. Going live is a near-term task.

**Price: decided (sandbox).** One paid plan, Premium, for tutors and
students (a tutor pays only for their own AI usage). Ukraine: $6/month or
$60/year, VAT included. Everywhere else (Europe and the rest of the world):
$8/month or $80/year, VAT added at checkout. Yearly = "2 months free". 7-day
trial kept for now. Paddle price = $8/$80 with a Ukraine override of $5/$50.

**Free gets everything structurally.** No limit on decks, cards or folders
anywhere. Full SRS scheduler, all study modes, practice and review, stats,
discovery, Mimi chat, photo→cards, AI deck generation, imports. The _only_
difference between free and premium is a **10× multiplier on six daily
counters**:

| Counter                      | Free / day | Premium / day |
| ---------------------------- | ---------- | ------------- |
| Build a deck from a topic    | 20         | 200           |
| Fill in a word list (enrich) | 5          | 50            |
| Mimi nudges (suggest)        | 60         | 600           |
| Mimi chat turns              | 50         | 500           |
| Imports (Quizlet / text)     | 20         | 200           |
| Photo → cards                | 10         | 100           |

How the counters behave — worth knowing, because it shapes both the user
experience and the cost ceiling:

- Reset at **UTC midnight** (not the user's local midnight, unlike streaks).
- Counted **per call, not per token** — a 100-word enrich costs one unit, same
  as a 5-word one. That rewards batching and punishes nobody for long input.
- **Only successful calls count.** Usage is recorded after the provider
  returns, so a failure doesn't burn a unit.
- The cap is checked **before** the AI call, so a capped user never spends API
  credits. The paywall is also the cost control.

Hitting a cap opens a paywall dialog naming the limit you actually hit.

> ⚠️ **The caps are provisional and will be re-examined.** They were set by
> judgement, not measurement — nobody has yet hit one in real use. Don't build
> arguments on these exact numbers; treat the _shape_ (free is structurally
> complete, premium is volume) as the decision and the numbers as a dial.

**Why gate volume and not features:** the learning loop creates the habit and
the habit creates a paying customer, so charging for study modes would tax the
exact behaviour you want. AI calls also cost real money per call, so a volume
cap is simultaneously the paywall and the spend limit. One mechanism, two jobs.

---

## 9. What Mnemio costs to run

**Models:** Claude Haiku 4.5 ($1 / $5 per million tokens in/out) for
everything, except Ukrainian card content, which routes to Claude Sonnet 5
($2 / $10) for quality. So Ukrainian content costs roughly 2× English — which
matters, because the beachhead is Ukrainian.

**Cost per AI call** (measured):

| Call                            | Cost                  |
| ------------------------------- | --------------------- |
| Mimi chat turn (text)           | $0.007                |
| Mimi chat turn (with tool use)  | $0.014                |
| Build a deck (8 cards)          | $0.010 EN · $0.021 UK |
| Fill in a word list (~50 words) | $0.020 EN · $0.040 UK |
| Nudge (suggest)                 | $0.001                |
| Photo → cards                   | $0.012                |

**Per-service bill:**

| Service                  | What it's for            | Cost shape                           | Amount            |
| ------------------------ | ------------------------ | ------------------------------------ | ----------------- |
| Anthropic (Haiku/Sonnet) | every AI action          | **per use — the only variable cost** | see above         |
| Railway                  | backend + Postgres + SSR | monthly, flat                        | part of $80–120   |
| Resend                   | verification emails      | monthly                              | part of $80–120   |
| Sentry                   | error tracking           | monthly                              | part of $80–120   |
| **Infra subtotal**       |                          | **flat**                             | **$80–120 / mo**  |
| Paddle                   | payments, VAT, invoicing | 5% + $0.50 per transaction           | ~$1.00 / sub / mo |
| Domain `mnemio.xyz`      |                          | yearly                               | ⚠️ (small)        |
| Mixpanel + GA4           | analytics                | free tier                            | $0                |
| File storage             | avatars, card images     | on the Railway volume                | cents             |

**Everything except AI is effectively fixed.** Per-user marginal infra (rows,
egress, media) is cents. So the whole cost question reduces to one thing: _how
much AI does a user consume per month?_

**Cost per paying user, per month:**

| Usage pattern                            | LLM   | Paddle | Infra  | Total  |
| ---------------------------------------- | ----- | ------ | ------ | ------ |
| Light                                    | $0.40 | ~$1.00 | ~$0.10 | ~$1.50 |
| Typical (20 active days, 8 chat turns/d) | $1.90 | ~$1.00 | ~$0.10 | ~$3.00 |
| Heavy (daily, 25 chat turns/d)           | $8.00 | ~$1.00 | ~$0.10 | ~$9.10 |
| Maxing every premium cap, every day      | $270  | ~$1.00 | —      | ~$271  |

Annual billing cuts the Paddle fee to ~$0.38/month equivalent.

> ⚠️ Paddle's fee is computed on the $8 price (5% + $0.50 per payment; Paddle
> offers custom pricing for products under $10). The infra range is an estimate, not a read bill — worth confirming
> once from the actual invoices.

---

## 10. Unit economics

Now mostly knowable. At the $8/month price (rest of world; Ukraine below):

```
Revenue per subscriber              = $8.00   (VAT passes through)
  minus Paddle (5% + $0.50)         = −$0.90   → net ≈ $7.10
  minus their own AI usage          = −$1.90   (typical)
  = contribution per subscriber     ≈ $5.20    (≈ 65% margin)

Ukraine ($6.00 incl. VAT → $5.00 before fee):
  minus Paddle ≈ $0.80, minus AI $1.90 → ≈ $2.30 (≈ 46% margin)

  heavy user (~$9.10 cost)          = loses money in both regions
  cap-maxing user                   ≈ −$264    (catastrophic, see below)
```

Then the part that isn't known yet:

```
Free users carried per subscriber   = ⚠️ 1 / conversion rate (no data)
Cost of an average free user        = ⚠️ (no data — but bounded, see below)
Acquisition cost                    ≈ $0 today (all organic)
Break-even                          ≈ $80–120 infra ÷ ~$5.20 = 16–23 subscribers (more at the Ukraine price)
```

**Three things this says out loud:**

1. **Break-even is ~16–23 subscribers.** That's the whole business goal right
   now, and it's a small number. Reaching it needs maybe 1–2k engaged free
   users at a plausible conversion rate.
2. **A typical subscriber is comfortably profitable; a cap-maxing one is a
   disaster.** $271/month of cost against $8 of revenue. The premium caps are
   10× higher than the free ones, which means the _paid_ tier is where the real
   cost risk lives — the opposite of the usual intuition. Premium caps are the
   number to re-examine first, not free ones.
3. **A free user is bounded but not cheap.** Multiplying the free caps by the
   per-call costs: roughly **$1/day, so ~$30/month** for someone who maxes
   every free counter every day (~$39 if their content is Ukrainian, since that
   routes to Sonnet). One such user eats four subscribers' contribution. The
   realistic average will be a small fraction of that — but the tail is what
   bites, and that worst case is the number worth designing against.
   _(This is arithmetic from the caps and the per-call costs above, not a
   measurement.)_

**Conclusion to carry into the pricing work:** the margin at typical usage is
healthy enough that price can be set by what the market will bear, not by cost.
Cost only constrains the _caps_. Those are two separate decisions and should be
made separately.

---

## 11. How people find it

No paid acquisition today. The channels that exist:

- **Search — intent pages.** Dedicated pages for the searches people actually
  type: "free Quizlet alternative", "Mnemio vs Quizlet vs Anki", "AI flashcards
  from a photo", plus Ukrainian pages for "квізлет альтернатива" and "лексичний
  мінімум НМТ".
- **Search — public decks.** Every public deck and subject is a real page search
  engines can read. The catalogue grows itself as users publish decks.
- **Blog.** Written and shipped with the site.
- **Word of mouth from copied decks** — a copied deck brings its owner's
  friends.
- **Social** — ⚠️ nothing yet. See the Notion map.

Measurement: Mixpanel + GA4 are wired, with a named event for every meaningful
step including the paywall funnel. `dev.mnemio.xyz` is the staging environment —
keep its analytics in a separate Mixpanel project so test traffic never lands
in production numbers.

> ⚠️ **No traffic data recorded yet.** Unknown: monthly visitors, where they
> come from, signup rate, and which page pulls the most. Since the site is
> live, this is readable from Search Console and Mixpanel today — doing that
> once is the highest-value hour available right now, because every strategy
> question below depends on it.

---

## 12. Deliberately not built

Say "decided against", not "missing". The reason is as important as the choice.

| Not built                         | Why                                                  | Revisit when                            |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| Leaderboards, friends             | Needs a social graph; adds abuse and privacy surface | Social features become a real direction |
| Folders for decks                 | Nobody with under ~25 decks needs them               | A power user passes 25 decks            |
| Shared / co-edited decks          | Real-time co-editing is heavy                        | A user asks for it as a top-3 need      |
| Classrooms, teachers, assignments | A different product with a different sale            | Deliberate decision to go after schools |
| Mobile apps                       | The web app works on a phone                         | Retention on web proves the habit       |
| Password reset                    | Only real gap — support handles it by hand today     | ⚠️ before any real launch push          |
| Streak freezes                    | A whole meta-system (buy? earn? gift?)               | Streak loss shows up as churn           |
| Reminders / notifications         | Nothing designed to send yet                         | A reminder UX is designed               |

---

## 13. Words we use

- **Deck** — a set of cards on one topic.
- **Card** — one thing to learn: term on the front, meaning on the back, plus
  extras (example, translation, part of speech, image, audio).
- **Study session** — one sitting with one deck in one mode.
- **Review** — the queue of cards due today, across all decks. The habit.
- **Spaced repetition / SM-2** — the schedule that decides when a card returns,
  based on how well you knew it.
- **Mimi** — Mnemio's AI tutor and mascot.
- **Discover** — the public deck catalogue.
- **XP / streak** — points per session; consecutive days practiced.
- **Premium** — the paid plan. Higher AI caps, nothing else locked.

---

## 14. Still open

> ⚠️ Answer these in the Notion workspace, not here — this file is a snapshot,
> Notion is where thinking accumulates.

**Settled** (as of this snapshot): publicly launched · focus is English
learners, beachhead НМТ English · gate AI volume, not features.

**Open, roughly in the order they matter:**

1. **Get ten real users from the beachhead.** Nothing below can be answered
   without them. This is the only item that unblocks the others.
2. **Read the existing data.** The site is live and analytics are wired —
   visitors, sources, signup rate and the paywall funnel are sitting there
   unread.
3. **Paddle sandbox → live.** Until this ships, the business cannot be tested
   at all. The 7-day trial is kept for now (revisit after real data).
4. **Price validation.** Prices are set ($6/$60 Ukraine, $8/$80 elsewhere) but
   untested on real buyers. Watch conversion by region, and whether people pick
   "Ukraine" at checkout to get the lower price. Rest-of-world price can be
   changed per country in Paddle without code.
5. **Recalibrate the caps — premium first.** A premium user maxing every cap
   costs ~$271/month against ~$8 of revenue. Premium caps at 10× free are the
   larger exposure; a hard monthly ceiling or a soft-throttle above a threshold
   is worth designing before anyone pays.
6. **Free caps: habit vs conversion.** Currently judgement, not measurement.
   Once there are users: what share ever hits a cap, and what do they do next?
7. **Password reset.** The only real functional gap. Decide before or after the
   first growth push — a lost account on a launch day is an expensive way to
   learn this.
8. **The one metric for this quarter.** Pick it. Given the stage, "engaged
   users who come back for a second review session" beats any revenue number.
9. **Does Ukrainian content need Sonnet?** It doubles the cost of exactly the
   content the beachhead generates. Worth an A/B on quality before scaling.
