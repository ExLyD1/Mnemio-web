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

Site: **mnemio.xyz** · Interface: **English and Ukrainian** · Built and run by
one person.

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

**Primary:** self-directed language learners, roughly 16–30, who already know
they should be using flashcards and have tried Quizlet or Anki. They have a word
list from somewhere — a textbook, a class, a film, a vocabulary minimum — and
want it to become a deck without an hour of typing.

**Beachhead:** Ukrainian students preparing for the **НМТ** exam. Specific,
reachable, with a known word list ("лексичний мінімум"), currently served by
Quizlet with an English-only interface. There are dedicated landing pages for
this segment.

**Secondary / later:** anyone memorising structured facts — medical and law
students, certification exams. The product already supports it; nothing is
aimed at them yet.

**Not for (today):** classrooms and teachers (no groups, no assignments, no
class dashboard), and anyone who wants a full language course — Mnemio does
vocabulary and recall, not grammar or conversation.

> ⚠️ **FILL IN:** has anyone from the beachhead segment actually used it? Any
> real user you've talked to? One honest sentence beats a persona.

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

| | Mnemio | Quizlet | Anki |
|---|---|---|---|
| Making cards | AI does it — list, topic, or photo | You type them (AI behind paywall) | You type them |
| Study modes | All six, free | Best ones behind Plus | One, plus add-ons |
| Scheduling | SM-2, on by default | Weak unless you pay | Best in class |
| Ads | None | Yes, on free | None |
| Learning curve | Sign up and go | Easy | Steep |
| Ukrainian interface | Yes | No | Partial |
| AI tutor that edits your decks | Yes (Mimi) | No | No |

The honest one-line pitch: **the scheduling of Anki, the friendliness of
Quizlet, and the card-writing done for you.**

---

## 7. Competitors

This is positioning, not market research — worth a real pass later.

- **Quizlet** — the default. Huge library, familiar, now aggressively
  monetised. Most Mnemio users will arrive from here. Main threat: they ship
  good AI card generation on the free tier.
- **Anki** — the serious learners' choice. Free, powerful, ugly, hard. Not
  really competing for the same person; competing for the same *job*.
- **Memrise / Brainscape / Cram** — mid-sized flashcard apps, each with one
  strong idea (video, confidence-based repetition, simplicity).
- **Knowunity / StudySmarter / Vaia** — student study apps with AI, strong in
  Europe, going after the same age group with a wider scope.
- **Duolingo** — not a competitor by feature, but it's where the attention and
  the habit already live. It sets the expectation for what a learning streak
  should feel like.
- **ChatGPT alone** — the real quiet competitor. Someone can ask it for twenty
  words and their meanings for free. What they *can't* get is the schedule, the
  progress, and the habit. That gap is the product.

---

## 8. Monetization

**Model:** freemium subscription. Paddle handles payment and is the merchant of
record, so it deals with VAT and local currencies; prices are shown in the
visitor's own currency.

**Price:** $10 / month or $96 / year (annual ≈ 20% off).

**What's free, forever:** all study modes, spaced repetition, unlimited decks
and cards, stats, streaks, achievements, the public catalogue, no ads.

**What premium buys:** more AI. Everything AI-powered has a daily cap, and
premium raises each one roughly 10×:

| AI action | Free / day | Premium / day |
|---|---|---|
| Fill in a word list | 5 | 50 |
| Build a deck from a topic | 20 | 200 |
| Deck from a photo | 10 | 100 |
| Mimi chat messages | 50 | 500 |
| Imports (Quizlet / text) | 20 | 200 |
| Mimi nudges | 60 | 600 |

**Why gate volume and not features:** the learning loop is what creates the
habit, and the habit is what creates a paying customer. Charging for study
modes taxes the thing you want people doing. AI calls also cost real money per
use, so the cap is both the paywall and the cost control.

Hitting a cap opens a paywall dialog that names the limit you actually hit.

> ⚠️ **FILL IN:** paying customers, MRR, trial/conversion rate, and whether
> Paddle is still in sandbox or live.

---

## 9. What Mnemio costs to run

Per-service costs, with amounts to fill in from your bills:

| Service | What it's for | Cost shape | Amount |
|---|---|---|---|
| Anthropic (Claude Haiku) | every AI action | per use — the only cost that scales with usage | ⚠️ |
| Railway | backend + PostgreSQL | monthly, flat-ish | ⚠️ |
| Frontend hosting | the website | monthly | ⚠️ |
| Paddle | payments, VAT, invoicing | ~5% + fee per transaction | — |
| Domain `mnemio.xyz` | | yearly | ⚠️ |
| Email sending | verification codes | monthly / per email | ⚠️ |
| Mixpanel + GA4 | analytics | free tier today | ⚠️ |
| Sentry | error tracking | free tier today | ⚠️ |
| File storage | avatars, card images | local disk today → paid object storage later | ⚠️ |

**The only one that moves with growth is Anthropic.** Everything else is
roughly flat until you're much bigger. So the unit economics question is
narrow: *what does a heavy free user cost in AI per month, and how many of them
does one subscriber pay for?*

---

## 10. Unit economics — the skeleton

Fill the four unknowns and this answers itself:

```
Revenue per subscriber (monthly)   = $10        (or $96/12 = $8 annual)
  minus Paddle                     ≈ 5% + fee  → net ≈ $9.20 monthly
  minus their own AI usage         = ⚠️ A
  = gross margin per subscriber

Cost of a free user                = ⚠️ B   (AI cost of an average free user/month)
Free users per paying user         = ⚠️ C   (1 / conversion rate)

Contribution per paying user = net revenue − A − (B × C)
Payback = acquisition cost (⚠️ D) / contribution
```

Two things to notice before measuring anything:

- The daily caps put a **hard ceiling** on A and B. A free user physically
  cannot cost more than their caps allow — that was the point of capping by
  volume. Work out that worst-case number; it's your floor of safety.
- With no paid acquisition, D ≈ 0 and the whole model only has to beat the flat
  hosting bill. Organic-first makes the maths forgiving; it also makes growth
  slow. That trade-off is the central business decision right now.

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
step including the paywall funnel.

> ⚠️ **FILL IN:** monthly visitors, where they come from, signup rate, and
> which single page brings the most.

---

## 12. Deliberately not built

Say "decided against", not "missing". The reason is as important as the choice.

| Not built | Why | Revisit when |
|---|---|---|
| Leaderboards, friends | Needs a social graph; adds abuse and privacy surface | Social features become a real direction |
| Folders for decks | Nobody with under ~25 decks needs them | A power user passes 25 decks |
| Shared / co-edited decks | Real-time co-editing is heavy | A user asks for it as a top-3 need |
| Classrooms, teachers, assignments | A different product with a different sale | Deliberate decision to go after schools |
| Mobile apps | The web app works on a phone | Retention on web proves the habit |
| Password reset | Only real gap — support handles it by hand today | ⚠️ before any real launch push |
| Streak freezes | A whole meta-system (buy? earn? gift?) | Streak loss shows up as churn |
| Reminders / notifications | Nothing designed to send yet | A reminder UX is designed |

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

1. Launch status: is Mnemio publicly launched, soft-launched, or still private?
2. The one metric for this quarter.
3. Beachhead: go all-in on НМТ students, or stay general?
4. Is $10/month the right price for a Ukrainian student? (Paddle shows local
   currency, but purchasing power is a pricing decision, not a currency one.)
5. Free-tier caps: generous enough to build the habit, tight enough to convert?
   Nothing has been measured yet.
6. Password reset before or after the next growth push?
