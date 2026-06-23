# Mnemio — Product Analytics & Growth Measurement Strategy

> **Scope:** Mixpanel = product, funnels, conversion, retention (source of truth).
> GA4 = acquisition/traffic only. This document defines **what** to measure and **why**.
> Implementation (SDK wiring, event-firing locations) is a separate workstream.

> **Grounding:** This strategy is based on Mnemio's actual product surface:
>
> - **3 free study modes** — `flashcard`, `multiple-choice`, `srs` (review). The SRS scheduler is the retention engine.
> - **The monetization engine is a daily AI budget cap**, not a hard feature lock. Free users get `capPerDay` AI actions/day; hitting it throws `AI_BUDGET_EXCEEDED` → the `PremiumGate` modal (`ai_budget` context). Premium = unlimited AI + advanced stats.
> - **AI features:** `generate-deck` (bulk creation), `enrich-words` (smart hints/enrichment), AI `suggest` (contextual nudges). A **free trial** exists (`trialing` status).
> - The backend already emits activation milestones: `welcome: { hasDeck, hasSession, hasReviewed }`.
> - Onboarding captures **interests + a daily goal tier**; gamification = streak, XP, weekly goal, achievements, mastery/retention.

---

## 1. Business & Growth Questions (AARRR)

The taxonomy exists to answer these. If an event can't help answer one of these, we don't ship it.

### Acquisition

1. Which channels (organic search, blog/SEO, discover deck pages, referral, paid) produce users who **activate**, not just sign up? (GA4 → Mixpanel handoff via UTM/source.)
2. Do users who land on a **public deck or blog article** (SEO content) sign up at a higher rate than those who land on the homepage?
3. What is the landing → signup-start → signup-complete rate, and where in the email/OTP flow do we lose people?

### Activation

4. What % of signups reach the "aha moment" (first real study value) **within their first session / first 24h / first 7 days**?
5. Where do brand-new users drop off in session one: onboarding profile → interests/goal → first deck → first study session?
6. Does **how** the first deck is created (manual vs AI-generated vs imported vs copied from Discover) change activation and retention?
7. Does completing onboarding (interests + daily goal) increase activation vs skipping it?

### Retention

8. Which **study mode** (flashcard / multiple-choice / SRS review) correlates most strongly with D7/D30 retention?
9. Does engaging with the **SRS due-review loop** (returning to clear due cards) predict long-term retention better than ad-hoc study?
10. What is the impact of **streak length** and hitting the **daily/weekly goal** on retention and resurrection?
11. What share of users become "dormant" and which re-engagement trigger (due cards, streak risk, AI suggestion) brings them back?

### Revenue

12. **Which AI feature most often precedes a paywall hit and a conversion** — bulk deck generation, word enrichment (smart hints), or AI suggestions?
13. How often do free users **hit the daily AI cap**, and what is the cap-hit → paywall-view → checkout-start → subscribe rate?
14. Is the **daily AI cap** set correctly? (Too low = frustration/churn before value; too high = no monetization pressure.) What cap level maximizes conversion without hurting activation?
15. Trial → paid conversion rate, and monthly vs annual mix; what behavior during trial predicts conversion?
16. What is the **paywall encounter → conversion** rate by context (`ai_budget` vs `feature`) and by plan tenure?

### Referral / Virality

17. Does the **Discover loop** drive growth — i.e., do users who publish public decks generate signups via deck copies/shares, and do copiers retain?
18. What is the deck **copy → signup → activation** chain for logged-out visitors landing on a public deck?

> **Open question:** Is there any in-product invite/referral mechanic today, or is "referral" purely organic via public Discover decks + SEO? (No referral code surface was found in the code.)

---

## 2. North Star Metric + Metric Tree

### North Star Metric (NSM)

**Weekly Cards Reviewed in a completed study session, per active user** — operationally tracked as **Weekly Active Reviewers (WAR): the count of users who complete ≥1 study/review session containing ≥N card reviews in a 7-day window.**

**Why this NSM:**

- It sits exactly at **delivered learning value** — a card reviewed in a completed session is the atomic unit of "I learned something on Mnemio." Decks created or signups are leading vanity; reviews are the value exchange.
- It is **mode-agnostic** (works across flashcard, MC, SRS) and **plan-agnostic** (free and paid both review), so it won't bias us toward monetization at the expense of the free product that drives acquisition/SEO.
- It **leads revenue**: heavy reviewers are the ones who build/expand decks, exhaust the AI cap, and convert. Growing WAR grows the top of the monetization funnel.
- It **captures retention** by construction (it's a weekly-active measure of the core loop), discouraging shallow signup-chasing.

> Track NSM as both **WAR (breadth)** and **total weekly reviews (depth)**; watch the ratio so we don't grow reviews only by overloading a few power users.

### Supporting metric tree

| Layer                               | Metric                                | Precise definition (what counts / window)                                                                                                                                                               |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Activation**                      | Activation rate                       | % of new signups who **create ≥1 deck AND complete ≥1 study session with ≥1 reviewed card within 7 days** of signup (the `welcome.hasDeck && hasSession/hasReviewed` state). Reported D1 and D7.        |
| **Engagement**                      | Core-loop depth                       | Avg **completed study sessions per active user per week** + avg cards reviewed/session. Slice by study_mode.                                                                                            |
| **Retention**                       | D7 / D30 returning-reviewer retention | % of an activation cohort that completes ≥1 study session in week 1 (D1–7) and in week 4 (D28–34). Bucketed by signup cohort week. Secondary: **SRS review return rate** (returned to clear due cards). |
| **Revenue**                         | Free→Paid conversion                  | % of free users who start a subscription within 30 days of signup; plus **paywall-hit→subscribe** rate and **trial→paid** rate. MRR, ARPPU, monthly/annual split as financial outputs.                  |
| **Monetization pressure (leading)** | AI-cap-hit rate                       | % of free WAU who hit `AI_BUDGET_EXCEEDED` ≥1×/week — the single best leading indicator of conversion intent.                                                                                           |

---

## 3. Core Funnels

Conversion = reached the final step; drop-off = entered step _n_ but never fired step _n+1_ within the funnel window.

### Funnel A — Acquisition → Activation (new-user, window: 7 days)

1. `page_view` (landing — homepage / public deck / blog) _(GA4 + Mixpanel anonymous)_
2. `signup_started` (chose register)
3. `signup_email_submitted`
4. `email_verified` (OTP success)
5. `onboarding_completed` (profile + interests + goal) _(soft step — measure skip rate)_
6. `deck_created` (first deck — any source)
7. `study_session_started` (first)
8. `study_session_completed` (first) ← **Activation**

Watch the steepest drops: OTP verification (4) and first-deck (6). The **OTP gate is the highest-risk early step** — instrument it heavily.

### Funnel B — Free → Paid (window: 30 days from first paywall view)

1. `study_session_completed` / `deck_created` (evidence of real usage — qualifier)
2. `ai_feature_used` (used any AI action at least once)
3. `ai_cap_reached` _(or)_ `premium_feature_blocked` (paywall trigger fired)
4. `paywall_viewed`
5. `checkout_started` (Stripe session created)
6. `subscription_started` (active or trialing) ← **Conversion**
7. _(trial branch)_ `trial_started` → `subscription_renewed`/`trial_converted`

Drop-off between **3→4** (trigger fired but modal not meaningfully seen) and **4→5** (saw paywall, didn't start checkout) tells us whether the problem is **pricing/offer** vs **value/timing**.

### Funnel C — Study Session (per mode; window: single session)

1. `study_session_started` _(props: study_mode, deck_id, card_count, due_count)_
2. `study_card_answered` (≥1 — proves engagement, not just a bounce)
3. `study_session_completed` _(props: cards_reviewed, accuracy, duration)_ ← **Conversion**
    - Drop-off = `study_session_abandoned` (left before completion). Compare **completion rate by mode** and **by deck size** — this directly answers "which mode drives retention" and "are big AI decks too long to finish."

### Funnel D — AI Feature (the monetization funnel; per feature)

1. `ai_feature_viewed` (saw the entry point: AI generate panel / enrich button / suggestion)
2. `ai_feature_started` (initiated a generation/enrichment)
3. `ai_feature_completed` (got a usable result) — _value delivered_
4. `ai_cap_reached` (free user blocked) ← the paywall fork
5. `paywall_viewed` → `checkout_started` → `subscription_started` ← **Conversion**

This funnel answers Q12–14: segment by `ai_feature` to find the **strongest paywall trigger** and whether users convert because the AI was _good_ (completed → cap → convert) or merely _blocked_.

---

## 4. Activation Moment ("Aha")

**Hypothesis:** activation = the user experiences the core memory loop _closing once_ — they put content in and got a study session out — early enough that the habit can form.

### Candidate definitions

- **A — "Create + Complete":** created ≥1 deck **and** completed ≥1 study session **within 24h** of signup. (Maps cleanly to the existing `welcome.hasDeck && hasSession`.)
- **B — "Reviewed for real":** completed a study session with **≥10 cards reviewed within 7 days** (raises the bar from "tried it" to "got value"; maps to `hasReviewed` + a depth threshold).
- **C — "Came back to study":** completed study sessions on **2 separate days within the first 7 days** (captures the habit/SRS-return signal, not just first-touch).

### How we validate which is correct

1. For a signup cohort, compute each candidate flag per user.
2. Measure **D30 retention (and 30-day conversion) conditional on each flag** vs. the unflagged baseline.
3. Pick the definition with the **largest, most stable retention lift, the cleanest "elbow"** in the lift curve (e.g., retention jumps sharply at 10 reviewed cards), and **high enough base rate** to be a usable target (an aha only 3% of users reach is a poor north-star input).
4. Confirm it's **achievable in session one** (so onboarding can be designed to drive it) and **leading, not lagging** (not just a proxy for "already retained"). Candidate C is likely the best _predictor_ but a worse _activation target_ because it spans days — so we'd likely set **B as the activation metric** and use **C as an early-retention checkpoint**. Validate with the data before committing.

> **Open question:** Confirm whether the backend timestamps first-deck and first-session precisely enough to compute "within 24h / 7 days" windows, or whether Mixpanel event time is the source of truth.

---

## 5. Event Taxonomy (Mixpanel)

Properties are deliberate: each one exists so a growth analyst can **segment a funnel or cohort** by it. Global super-properties attached to **every** event: `plan` (free/trial/premium), `is_authenticated`, `app_locale` (en/uk), `platform`, `acquisition_source`, `days_since_signup`.

### A. Acquisition & Onboarding

| Event                       | Business meaning                         | Key properties                                                                                                     | Priority |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| `signup_started`            | User intent to create an account         | `method` (email/google), `entry_point` (home/deck/blog/pricing/paywall), `source`, `utm_*`                         | **P0**   |
| `signup_email_submitted`    | Email captured; entered the OTP gate     | `method`                                                                                                           | P1       |
| `email_verification_failed` | OTP friction (a top early drop-off)      | `attempt_number`, `reason` (expired/invalid/resend)                                                                | P1       |
| `account_created`           | New account exists (post-verify)         | `method`, `signup_source`                                                                                          | **P0**   |
| `onboarding_step_completed` | Progress through onboarding              | `step` (profile/interests/goal), `step_index`                                                                      | P1       |
| `onboarding_completed`      | Finished onboarding with intent captured | `interests[]`, `daily_goal_tier` (casual/steady/serious), `learning_language`, `native_language`, `skipped` (bool) | **P0**   |

### B. Activation

| Event                 | Business meaning                             | Key properties                                                                                                                                                  | Priority |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `deck_created`        | User authored content (activation input)     | `deck_id`, `creation_source` (manual/ai_generated/imported/copied), `card_count`, `source_language`, `target_language`, `subject`, `is_public`, `is_first_deck` | **P0**   |
| `card_added`          | Deck-building depth                          | `deck_id`, `method` (manual/ai_enriched/bulk), `card_type` (basic/cloze/image), `has_media`                                                                     | P2       |
| `deck_published`      | Made a deck public (referral/virality input) | `deck_id`, `card_count`, `subject`                                                                                                                              | P1       |
| `first_value_reached` | Server-confirmed activation milestone        | `milestone` (has_deck/has_session/has_reviewed), `hours_since_signup`                                                                                           | **P0**   |

### C. Engagement — Study Modes

| Event                     | Business meaning                 | Key properties                                                                                                         | Priority                                  |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `study_session_started`   | Entered the core value loop      | `study_mode` (flashcard/multiple_choice/srs), `deck_id`, `card_count`, `due_count`, `is_review_session`, `deck_source` | **P0**                                    |
| `study_card_answered`     | Atomic learning unit (NSM input) | `study_mode`, `deck_id`, `grade`/`correct`, `card_difficulty`, `response_ms`                                           | P1 _(sample/aggregate if volume is high)_ |
| `study_session_completed` | Delivered value; NSM event       | `study_mode`, `deck_id`, `cards_reviewed`, `accuracy`, `duration_sec`, `xp_earned`, `streak_after`                     | **P0**                                    |
| `study_session_abandoned` | Drop-off in the session funnel   | `study_mode`, `cards_reviewed`, `pct_complete`, `card_count`                                                           | P1                                        |
| `review_due_cleared`      | Closed the SRS retention loop    | `cards_due`, `cards_cleared`, `deck_id`                                                                                | **P0**                                    |

### D. AI Features (monetization engine)

| Event                   | Business meaning                                            | Key properties                                                                                                           | Priority |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| `ai_feature_viewed`     | Saw an AI entry point (top of monetization funnel)          | `ai_feature` (generate_deck/enrich_words/suggestion), `context` (deck_create/card_add/dashboard/deck_detail/review)      | P1       |
| `ai_feature_started`    | Initiated an AI action (consumes budget)                    | `ai_feature`, `context`, `input_size` (topic len / word_count), `target_language`, `source_language`, `cap_remaining`    | **P0**   |
| `ai_feature_completed`  | AI delivered a usable result (value proof)                  | `ai_feature`, `result_size` (cards/words enriched), `duration_ms`, `accepted` (kept vs discarded), `cap_remaining_after` | **P0**   |
| `ai_cap_reached`        | Free user hit the daily AI budget — **the paywall trigger** | `ai_feature`, `cap_per_day`, `context`, `attempts_today`                                                                 | **P0**   |
| `ai_suggestion_clicked` | Engaged with a contextual AI nudge                          | `context`, `kind` (tip/deck/review), `action`                                                                            | P2       |

### E. Monetization & Paywall

| Event                                      | Business meaning                                              | Key properties                                                                                                                           | Priority |
| ------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `paywall_viewed`                           | Saw the upgrade modal                                         | `trigger_context` (ai_budget/feature), `ai_feature`, `cap_per_day`, `days_since_signup`, `lifetime_ai_caps_hit`                          | **P0**   |
| `paywall_dismissed`                        | Rejected the offer (objection signal)                         | `trigger_context`, `time_on_modal_sec`                                                                                                   | P1       |
| `checkout_started`                         | Entered Stripe checkout                                       | `billing_plan` (monthly/annual), `trigger_context`, `price`                                                                              | **P0**   |
| `checkout_abandoned`                       | Started but didn't pay                                        | `billing_plan`, `trigger_context`                                                                                                        | P1       |
| `trial_started`                            | Began a free trial                                            | `billing_plan`, `trial_end`, `trigger_context`                                                                                           | **P0**   |
| `subscription_started`                     | **Became a paying/trialing customer** (primary revenue event) | `billing_plan`, `status` (trialing/active), `price`, `days_since_signup`, `trigger_context`, `lifetime_sessions`, `lifetime_ai_caps_hit` | **P0**   |
| `subscription_renewed` / `trial_converted` | Recurring value / trial→paid                                  | `billing_plan`, `period`                                                                                                                 | **P0**   |
| `subscription_canceled`                    | Churn (with reason if captured)                               | `plan_tenure_days`, `cancel_reason`, `cancel_at_period_end`                                                                              | **P0**   |
| `billing_portal_opened`                    | Manage-subscription intent (often pre-churn)                  | `entry_point`                                                                                                                            | P2       |

### F. Retention & Gamification

| Event                                        | Business meaning                                  | Key properties                                                | Priority |
| -------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | -------- |
| `streak_extended`                            | Daily habit reinforced                            | `streak_length`, `is_new_record`                              | P1       |
| `streak_broken`                              | Habit lapse (resurrection trigger input)          | `previous_streak`                                             | P1       |
| `daily_goal_reached` / `weekly_goal_reached` | Hit self-set commitment (strong retention signal) | `goal_tier`, `cards_target`, `cards_done`                     | P1       |
| `achievement_unlocked`                       | Gamification reward delivered                     | `achievement_id`, `category`                                  | P2       |
| `deck_copied_from_discover`                  | Virality/acquisition loop + free re-engagement    | `deck_id`, `source_author`, `subject`, `viewer_authenticated` | **P0**   |
| `app_opened`                                 | Session/return cadence (DAU/WAU, resurrection)    | `entry_point`, `days_since_last_open`                         | P1       |

> **Open question:** The brief lists "AI quiz generator" as a paywalled feature, but in the product the **multiple-choice mode is a free study mode** and the only AI endpoints found are `generate-deck`, `enrich-words`, and `suggest`. Confirm whether an AI quiz-generation feature exists / is planned so we can add an `ai_feature: quiz_generate` value rather than mismodel it.

---

## 6. User & Group Properties (Mixpanel profile)

Persistent attributes for cohorting (set on signup; updated on change). These power every segment in §7.

**Identity / acquisition**

- `signup_date`, `acquisition_source`, `acquisition_channel` (organic/seo_content/discover/referral/direct/paid), `first_utm_source/medium/campaign`, `signup_method` (email/google), `signup_entry_point`.

**Profile / intent**

- `native_language`, `learning_language(s)`, `onboarding_interests[]`, `daily_goal_tier`, `onboarding_completed` (bool), `account_age_days`.

**Plan / monetization**

- `plan` (free/trial/premium), `billing_plan` (monthly/annual/null), `subscription_status`, `trial_end_date`, `first_subscribed_date`, `is_ever_paid`, `lifetime_ai_caps_hit`, `lifetime_paywall_views`.

**Engagement / value (rolling, updated periodically)**

- `lifetime_decks_created`, `lifetime_public_decks`, `lifetime_sessions_completed`, `lifetime_cards_reviewed`, `current_streak`, `longest_streak`, `last_active_date`, `last_study_date`, `preferred_study_mode`, `avg_accuracy`, `total_due_cards`.

**AI usage**

- `ai_features_used[]`, `lifetime_ai_generations`, `lifetime_ai_enrichments`, `is_ai_activated` (used AI ≥1×).

> Set a `cohort_week` (signup week) for clean retention/cohort curves. Maintain `is_activated` (per the §4 definition) as a boolean profile flag once validated.

---

## 7. Cohorts & Segments to Build Day One

**Activation / onboarding**

1. **Signed up, not activated** — account but no completed session within 7d (onboarding/first-run fix target).
2. **Onboarding skippers** — finished signup but `onboarding_completed = false` (test whether intent capture matters).
3. **Activated by source** — activated users split by `creation_source` of first deck (manual vs AI vs copied) — answers Q6.

**Retention / engagement** 4. **Power users on free plan** — high `lifetime_sessions` / weekly reviews, `plan = free` → prime conversion + interview pool. 5. **SRS loyalists vs one-mode users** — segment by `preferred_study_mode` and `review_due_cleared` frequency → answers Q8–9. 6. **Streak-at-risk** — `current_streak ≥ 3` and `last_study_date ≥ 1d` → resurrection-trigger audience. 7. **Dormant / churned-active** — was active, `last_active_date > 14/30d`, never paid → win-back.

**Monetization** 8. **Cap-hitters, not converted** — `lifetime_ai_caps_hit ≥ 1`, `plan = free` (the hottest conversion segment — Q13). 9. **Paywall-bounced** — `paywall_viewed ≥ 1`, no `checkout_started` (offer/price objection cohort). 10. **Trial users (live)** — `subscription_status = trialing` → trial-conversion nurture; split by in-trial AI usage. 11. **Activated-but-never-hit-AI** — engaged free users who never used an AI feature → "they don't know the paid value exists" segment (Q12/feature-discovery problem). 12. **Churned-after-paywall / cancelled** — converted then cancelled, by tenure → churn-reason analysis.

**Referral / virality** 13. **Public-deck publishers** — `lifetime_public_decks ≥ 1` → measure copies/signups they generate. 14. **Discover-origin users** — `acquisition_source = discover` → do copied-deck signups retain vs other channels (Q17–18).

---

## Cross-cutting Open Questions (flagged, not assumed)

1. **AI cap value & reset** — what is the exact free `capPerDay`, and does it reset at UTC midnight or rolling 24h? Conversion analysis on cap-hits depends on this.
2. **"AI quiz generator"** — does it exist as a distinct paid AI feature, or is the brief conflating it with the free multiple-choice mode? (See §5E note.)
3. **Free trial mechanics** — is the trial offered to everyone, only at the paywall, card-required or not? Affects trial-funnel modeling.
4. **Referral mechanic** — is there any invite/referral system planned, or is virality purely Discover + SEO? (None found in code.)
5. **Identity stitching** — how do we map an anonymous SEO/Discover visitor (GA4 + Mixpanel anon ID) to the post-signup user for true source attribution and the logged-out deck_copy→signup loop?
6. **Platform roadmap** — web-only today; if mobile/PWA is coming, `platform` must be a first-class property from day one.
7. **PII & locale** — `learning_language`/`native_language` and `app_locale` (en/uk) should be properties, but confirm no PII (email, full name) is sent to Mixpanel per privacy policy.

---

_Strategy document only — no events implemented. Next step (separate workstream): Mixpanel SDK
wiring, event-firing locations in the Nuxt app (`useStudySession`, `usePractice`, `api/ai.ts`,
`stores/premiumGate.ts`, `composables/useBilling.ts`, auth/onboarding flows), super-property /
identify setup, and a GA4 ↔ Mixpanel attribution bridge._
