# Mnemio Analytics Implementation Plan (Mixpanel + GA4)

> Companion to [analytics-strategy.md](./analytics-strategy.md). The strategy defines **what** to
> measure and **why**; this document defines **how** to wire it across frontend and backend.
> Status: **approved plan — not yet implemented.** Resolve the open blockers (bottom) before coding.

## Context

Wire the approved taxonomy in [analytics-strategy.md](./analytics-strategy.md) into the
product. Mixpanel = product/conversion/retention source of truth; GA4 = acquisition only. The
**frontend (this repo)** is Nuxt 4 + Vue 3 + Pinia setup-stores + VueUse + Zod 4. The **backend is a
SEPARATE repo** (Fastify + Prisma + Stripe) — revenue events and the AI budget gate live there and
are specified here against [api-contract.md](./api-contract.md), not against local files.

No analytics deps exist today (`mixpanel-browser`, `mixpanel` node SDK, GA4 are all **new**).

## Architecture overview

```
                          ┌─────────────────────── ONE typed event contract ───────────────────────┐
                          │  events.ts  (AnalyticsEvent discriminated union + UserProps + names)     │
                          │  shared via npm pkg @mnemio/analytics-contract  (FE + BE both import)    │
                          └────────────────────────────────────────────────────────────────────────┘
   CLIENT (Nuxt)                                                  SERVER (Fastify, separate repo)
   components/stores/composables                                  routes / Stripe webhook
        │ (never call SDK directly)                                    │
        ▼                                                              ▼
   useAnalytics()  ──register/identify/track──►  mixpanel-browser     analytics.ts (mixpanel node)
        │                                            │  (batched)          │  track(distinct_id=userId)
        │                                            ▼                     ▼
        └── track() also → GA4 (nuxt-gtag)       Mixpanel  ◄──────────  Mixpanel HTTP (fire-and-forget)
            (page_view + conversions only)                              ▲
                                                                        │
                                          Stripe ──webhook──► Fastify ──┘  subscription_started,
                                                                            trial_*, *_canceled, ai_cap_reached
```

Rule enforced by lint/review: **no component or store imports `mixpanel-browser` or `gtag`** — only
`useAnalytics()` (client) or the server `analytics` module.

## Client vs server split (decisions)

| Event(s) | Side | Why |
|---|---|---|
| `subscription_started`, `trial_started`, `trial_converted`, `subscription_renewed`, `subscription_canceled` | **Server (Stripe webhook)** | [billing/success.vue](../app/pages/billing/success.vue) only *polls* for an already-updated sub — the user may never return to it. Stripe webhook is the only reliable, authoritative revenue signal. |
| `ai_cap_reached` | **Server (AI route budget gate)** | The cap is enforced server-side (`AI_BUDGET_EXCEEDED`); firing at the gate is authoritative, un-bypassable, and fires even when 3 different client call-sites swallow the error. Client still fires `paywall_viewed`. |
| `account_created`, `first_value_reached` | **Server** | verify-email / oauth-callback routes know *new vs returning* (client can't reliably tell for OAuth); `welcome` flags flip server-side. |
| Everything else (funnel/engagement/UI) | **Client** | Rich UI context (mode, duration, accuracy, entry_point, deck_source) only exists client-side. |
| `page_view` + conversion mirror | **Client → GA4** | Acquisition only. |

## Event → file → trigger mapping (P0/P1)

### Client-fired
| Event | File | Trigger location |
|---|---|---|
| `app_opened` / first-touch attribution | new `app/plugins/03.analytics.client.ts` | on boot, after consent |
| `signup_started` | [app/components/login/AuthForm.vue](../app/components/login/AuthForm.vue) | `onSubmit` when `activeTab==='register'`; `entry_point` from route query/referrer |
| `email_verification_failed` | [app/pages/login.vue](../app/pages/login.vue) | `onOtpSubmit` error branch (`verifyEmail.error`) |
| `onboarding_step_completed` / `onboarding_completed` | [app/pages/onboarding.vue](../app/pages/onboarding.vue) | `goStep2` and the `getStarted` success branch (after `updateProfile.execute`) — props from `prefs.interests`, `goal`, `hue` |
| `deck_created` | [app/pages/decks/create.vue](../app/pages/decks/create.vue) (manual save ~L470, AI save ~L558) | after `decks.create`; `creation_source = manual \| ai_generated`; also import dialog path |
| `deck_copied_from_discover` | [discover/index.vue](../app/pages/discover/index.vue), [discover/[subject].vue](../app/pages/discover/[subject].vue), [discover/sets/[id].vue](../app/pages/discover/sets/[id].vue) | `onCopy` → `copyDeck`; `viewer_authenticated` flag |
| `card_added` | [app/api/cards.ts](../app/api/cards.ts) callers (card add page, `bulkAddCards`) | after add; `method = manual\|ai_enriched\|bulk` |
| `study_session_started` | [app/composables/useStudySession.ts](../app/composables/useStudySession.ts) `start()` L51 | after `sessions.start` resolves |
| `study_card_answered` *(aggregate — see below)* | `useStudySession.ts` `answer()` L91 / [usePractice.ts](../app/composables/usePractice.ts) `apply()` L36 | per answer (buffered, not sent individually by default) |
| `study_session_completed` | `useStudySession.ts` `finishComplete()` L80 | after `sessions.complete`; props: mode, cards_reviewed, accuracy, duration, xp, streak, **grade distribution** |
| `study_session_abandoned` | `useStudySession.ts` `exit()` L118 + `pagehide`/`visibilitychange` handler | session left active without completion |
| `review_due_cleared` | [app/pages/review/index.vue](../app/pages/review/index.vue) | when `finished` flips true / queue empties |
| `ai_feature_viewed/started/completed` | [app/api/ai.ts](../app/api/ai.ts) callers — `generateDeck` ([create.vue](../app/pages/decks/create.vue) L488), `enrichWords` (card add), `useChat` ([ai.vue](../app/pages/ai.vue)) | started before call, completed after; `ai_feature`, `context`, input/result size, languages |
| `paywall_viewed` / `paywall_dismissed` | [app/stores/premiumGate.ts](../app/stores/premiumGate.ts) `show()` / `hide()`; modal [PremiumGate.vue](../app/components/shared/PremiumGate.vue) | single choke-point for all paywall surfacing |
| `checkout_started` | [app/composables/useBilling.ts](../app/composables/useBilling.ts) `checkout` | before `window.location.assign(res.url)`; props: `billing_plan`, `trigger_context` |
| `billing_portal_opened` | `useBilling.ts` `portal` | before portal redirect |
| `streak_extended/broken`, `daily/weekly_goal_reached`, `achievement_unlocked` | [usePractice.ts](../app/composables/usePractice.ts), stats/dashboard, [useAchievements.ts](../app/composables/useAchievements.ts) | on state transitions |

### Server-fired (backend repo — against api-contract)
| Event | Backend location (separate repo) |
|---|---|
| `account_created` | `/auth/verify-email`, `/auth/oauth/google/callback` (new-user branch) |
| `first_value_reached` | wherever `welcome.{hasDeck,hasSession,hasReviewed}` flips (deck create / session complete / first rating) |
| `ai_cap_reached` | AI budget middleware/guard that throws `AI_BUDGET_EXCEEDED` (generate-deck, enrich-words, chat) |
| `subscription_started`, `trial_started`, `trial_converted`, `subscription_renewed`, `subscription_canceled` | Stripe webhook handler (`checkout.session.completed`, `customer.subscription.*`, `invoice.paid`) |

## Typed event contract (shape, not full code)

One module, shared by both repos (see blocker re: distribution):

```ts
// events.ts — single source of truth
export type Plan = 'free' | 'trial' | 'premium';
export type StudyModeProp = 'flashcard' | 'multiple_choice' | 'srs';

interface BaseProps { /* super-props auto-merged by client; never hand-set */ }

export type AnalyticsEvent =
  | { name: 'signup_started';        props: { method: 'email'|'google'; entry_point: string } }
  | { name: 'deck_created';          props: { deck_id: string; creation_source: 'manual'|'ai_generated'|'imported'|'copied'; card_count: number; source_language?: string; target_language?: string; is_first_deck: boolean; is_public: boolean } }
  | { name: 'study_session_completed'; props: { study_mode: StudyModeProp; deck_id: string; cards_reviewed: number; accuracy: number; duration_sec: number; xp_earned: number; streak_after: number; grades?: Record<'again'|'hard'|'good'|'easy', number> } }
  | { name: 'ai_feature_completed';  props: { ai_feature: 'generate_deck'|'enrich_words'|'suggestion'; result_size: number; duration_ms: number; accepted?: boolean } }
  | { name: 'paywall_viewed';        props: { trigger_context: 'ai_budget'|'feature'; ai_feature?: string; cap_per_day?: number; days_since_signup: number } }
  | { name: 'subscription_started';  props: { billing_plan: 'monthly'|'annual'; status: 'trialing'|'active'; price: number; trigger_context?: string } }
  /* …one variant per event in §5 of the strategy… */;

export type EventName = AnalyticsEvent['name'];
export type PropsFor<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['props'];

export interface UserProps {   // Mixpanel $set allowlist (NO PII)
  plan: Plan; signup_date: string; acquisition_source?: string;
  native_language?: string; learning_language?: string; daily_goal_tier?: string;
  lifetime_decks_created?: number; current_streak?: number; is_ever_paid?: boolean; /* … */
}
```

- **Client** `useAnalytics().track(name, props)` is typed so `props` must match `PropsFor<name>` — names/props can't drift.
- **Server** `analytics.track(distinctId, name, props)` imports the *same* union.
- Property-name casing (snake_case) and enum values are fixed in this file only.

## `useAnalytics.ts` (client composable interface)

Thin wrapper over the SDK; the **only** module components touch. Mirrors existing composable style
(plain function returning typed methods, like `useBilling`/`useStudySession`).

```ts
useAnalytics() => {
  track<N extends EventName>(name: N, props: PropsFor<N>): void   // no-op until consent+enabled
  identify(userId: string): void                                  // merge anon → user
  setUserProps(p: Partial<UserProps>): void                       // $set (allowlisted)
  registerSuper(p: Record<string, unknown>): void                 // persistent super-props
  reset(): void                                                   // on logout
  flush(): void                                                   // force send (page-unload)
}
```

Internals: guards on `runtimeConfig.public.analyticsEnabled` + consent; lazy-imports
`mixpanel-browser`; also forwards the small conversion set to `gtag` for GA4; swallows all SDK errors
(analytics never throws into product code).

## Mixpanel setup

- **Client init** in `app/plugins/03.analytics.client.ts` (after `01.auth.client` so auth state exists):
  `mixpanel.init(token, { batch_requests: true, persistence: 'localStorage', opt_out_tracking_by_default: true })`.
  Register first-touch super-props (UTM/source). If already authed on boot → `identify(user.id)` +
  `setUserProps`. Fire `app_opened`.
- **identify():** called on `verifyEmail`/`login`/`oauthExchange` success in [app/stores/auth.ts](../app/stores/auth.ts) `setSession`, and on boot hydrate. `reset()` in `clearSession`.
- **Super-props:** `plan`, `app_locale`, `platform: 'web'`, `acquisition_source` (registered once).
- **User profile `$set`:** allowlisted `UserProps` only, written on signup + plan change + onboarding complete.
- **Server init** (backend repo): `mixpanel` node SDK with project token + API secret; `track(name, { distinct_id: userId, ...props })` so server events land on the same profile the client identified. `people.set` for server-known props (plan/subscription).

## Identity stitching (strategy Q5)

1. **Anonymous visitor** (homepage / public `/discover/*` / `/blog/*`): the analytics client plugin
   inits for everyone (post-consent). `mixpanel-browser` generates a stable `$device_id` in
   `localStorage` — persists across the public→signup journey on the same browser.
2. **First-touch attribution** captured in the plugin from `route.query` (UTM) + `document.referrer`,
   stored in `localStorage['mnemio:attribution']`, and `register`ed as super-props (so every anon
   event carries source).
3. **deck_copy → signup chain:** logged-out `onCopy` redirects to `/login?tab=register`. Before
   redirect, set super-prop `registration_intent = 'discover_copy'` + `intent_deck_id`. The anon
   `$device_id` carries through; these become attribution on the eventual signup.
4. **On signup** (`setSession`): call `identify(user.id)`. With Mixpanel's modern **Identity Merge
   (Simplified)**, the anon `$device_id` history merges into the user automatically — no manual
   `alias()` needed (and `alias` would be wrong here). Then `setUserProps({ signup_date,
   acquisition_source: <stored first-touch>, … })`.
5. **Server events** use `distinct_id = user.id`; because the client identified to the same id, server
   and client events share one profile.

> If "Simplified" ID merge isn't enabled on the project, switch to the original API-merge and call
> `identify` only (still no `alias`). **Confirm project ID-merge setting before build** (blocker).

## GA4 setup + attribution bridge

- Add **`nuxt-gtag`** (new dep; consent-aware, Nuxt-native, no manual script). Config in
  [nuxt.config.ts](../nuxt.config.ts): `gtag: { id: NUXT_PUBLIC_GA4_ID, enabled: false }` (enabled
  toggled on after consent via the module's `useGtag().enableAnalytics()`).
- GA4 scope: automatic `page_view` + a **small conversion mirror** (`account_created`,
  `subscription_started`) only. No product events.
- **Bridge:** the same first-touch UTM/source captured for Mixpanel super-props is the single source;
  GA4 gets it natively via its linker. Mixpanel is authoritative for source attribution; GA4 stays
  traffic-only.

## High-volume `study_card_answered`

**Recommendation: aggregate into `study_session_completed`, do not send per-card by default.**
- A 20-card session × all users would multiply event volume ~15–20× and Mixpanel bills per event.
- The analytical value (accuracy, grade distribution, mode performance) is fully captured as
  **aggregate props on `study_session_completed`** (`cards_reviewed`, `accuracy`, `grades{}`,
  `duration_sec`). `usePractice.ts` already tracks `counts` per grade — pass it through.
- Keep `study_card_answered` defined in the contract but **gated behind a sampling flag**
  (`NUXT_PUBLIC_ANALYTICS_CARD_SAMPLING`, default 0) for deep-dive studies only. Buffer in-composable
  and `flush()` on completion if ever enabled.

## Environment & config

| Var | Scope | Where |
|---|---|---|
| `NUXT_PUBLIC_MIXPANEL_TOKEN` | public | `runtimeConfig.public` in [nuxt.config.ts](../nuxt.config.ts) |
| `NUXT_PUBLIC_GA4_ID` | public | `nuxt-gtag` config |
| `NUXT_PUBLIC_ANALYTICS_ENABLED` | public | gate — `false` in dev/preview ⇒ `useAnalytics` is a no-op |
| `NUXT_PUBLIC_ANALYTICS_CARD_SAMPLING` | public | 0..1 sampling for per-card |
| `MIXPANEL_TOKEN`, `MIXPANEL_API_SECRET` | **private** | backend repo config only |

Analytics is a hard no-op unless `analyticsEnabled && consentGranted && token present`.

## Privacy / consent & PII

- **Consent gate (new):** a small cookie-backed consent store + banner. Until "accept", `opt_out`
  Mixpanel and keep `nuxt-gtag` disabled. `useAnalytics.track` early-returns without consent.
- **PII allowlist:** `useAnalytics` ships an explicit allowlisted `UserProps`/event-props shape; email,
  full name, raw card word/definition content are **never** sent. Decks are referenced by `deck_id`,
  cards by counts/grades only — matches strategy PII note. A dev assertion warns if an unknown prop
  key is passed.
- Confirm against privacy policy ([app/pages/privacy.vue](../app/pages/privacy.vue)) — add an analytics
  clause (content task).

## Reliability

- **Page-unload:** register `pagehide`/`visibilitychange==='hidden'` → fire `study_session_abandoned`
  (if a session is active) then `mixpanel.flush()` (batch mode). Use `navigator.sendBeacon` path that
  `mixpanel-browser` uses on unload.
- **Server events never block product:** in the backend, `analytics.track` is fire-and-forget wrapped
  in try/catch with a short timeout; a Mixpanel outage must never fail a Stripe webhook ACK or a user
  request. Webhook handler ACKs Stripe first, emits analytics after.
- Client SDK errors are swallowed in `useAnalytics`.

## Phased implementation checklist

**Phase 1 — Plumbing & abstraction (no product events yet)**
1. Add deps: `mixpanel-browser` (+ `@types/mixpanel-browser`), `nuxt-gtag`. Backend repo: `mixpanel`.
2. Create the shared `events.ts` contract + decide distribution (see blockers).
3. `runtimeConfig.public` vars + `NUXT_PUBLIC_ANALYTICS_ENABLED` no-op gate.
4. Consent store + minimal banner.
5. `useAnalytics.ts` + `app/plugins/03.analytics.client.ts` (init, super-props, identify on boot/login,
   reset on logout). Backend: thin `analytics.ts` module.

**Phase 2 — P0 events**
6. Identity stitching end-to-end (anon → signup `identify`, first-touch attribution, deck_copy intent).
7. Client P0: `signup_started`, `deck_created`, `study_session_started/completed`, `ai_feature_started/completed`, `paywall_viewed`, `checkout_started`, `deck_copied_from_discover`.
8. Server P0 (backend repo): `account_created`, `first_value_reached`, `ai_cap_reached`, all Stripe-webhook revenue events.
9. `setUserProps` on signup/onboarding/plan-change.

**Phase 3 — P1/P2**
10. `email_verification_failed`, `onboarding_*`, `card_added`, `study_session_abandoned` (+ unload flush), `review_due_cleared`, `paywall_dismissed`, `checkout_abandoned`, `billing_portal_opened`, streak/goal/achievement, `app_opened`.
11. `study_card_answered` sampling harness (off by default).

**Phase 4 — GA4 + attribution bridge**
12. `nuxt-gtag` consent-gated; `page_view` + conversion mirror; verify UTM capture.

**Phase 5 — QA & go-live** (below).

## QA / verification checklist

- **Mixpanel debug:** init with `debug: true` in a staging build; watch **Live View** while running
  each P0 funnel manually; confirm event name + every required prop + correct types.
- **Identity:** in one browser, browse logged-out (fire anon events) → register → confirm in Mixpanel
  the user profile **inherits the pre-signup events** (merge worked) and `distinct_id` is the user id.
- **Server events:** use Stripe CLI (`stripe trigger checkout.session.completed`,
  `customer.subscription.deleted`) → confirm `subscription_started` / `subscription_canceled` land on
  the right user profile with `billing_plan`.
- **`ai_cap_reached`:** force the free cap → confirm server event fires once and client `paywall_viewed`
  fires once (no double count).
- **No-op gate:** with `NUXT_PUBLIC_ANALYTICS_ENABLED=false`, confirm zero network calls to Mixpanel/GA4.
- **Consent:** before accept → zero events; after accept → events flow.
- **PII scan:** inspect outgoing payloads (network tab + Mixpanel) for any email/name/card text — must
  be absent.
- **Unload:** start a session, close tab mid-session → confirm `study_session_abandoned` arrives.
- **Funnels:** build Funnel A–D in Mixpanel from real test events; confirm steps connect.

## Open blockers / unknowns (resolve before implementation)

1. **Shared contract distribution (architectural).** FE and BE are separate repos but must share ONE
   `events.ts`. Decide: publish `@mnemio/analytics-contract` to a private registry (recommended), git
   submodule, or copy-with-CI-checksum. *Not a strategy open-Q — new infra decision.*
2. **Mixpanel project ID-merge mode** (Simplified vs original) — determines `identify`-only vs
   alias/merge calls in identity stitching. Confirm in Mixpanel project settings. *(Strategy Q5.)*
3. **AI cap value & reset window** — exact free `capPerDay` and UTC-midnight vs rolling-24h reset; the
   server must emit it on `ai_cap_reached`/`paywall_viewed`. *(Strategy open-Q #1.)*
4. **"AI quiz generator"** — does a distinct paid AI feature exist, or is the brief conflating it with
   the free `multiple-choice` study mode? Affects `ai_feature` enum. Only `generate-deck`,
   `enrich-words`, chat `suggest` exist in code. *(Strategy open-Q #2 / §5E note.)*
5. **`learning_language` / `native_language` capture point.** Onboarding collects interests + goal but
   **not languages** (languages are per-deck: `source_language`/`target_language`). Decide where the
   user-level language prop is set (first deck? a new onboarding step?). *(Strategy open-Q #7 PII +
   activation props.)*
6. **OAuth new-vs-returning signal.** `oauthExchange` returns `needsProfile` but not an explicit
   "account just created" flag — backend must expose one so `account_created` isn't fired for returning
   Google logins. *(Confirm in backend repo.)*
7. **Trial mechanics** — is the trial universal, paywall-only, card-required? Shapes `trial_started`
   firing + the Free→Paid funnel. *(Strategy open-Q #3.)*
8. **Consent banner scope/compliance** — no consent system exists; confirm required regions (GDPR) and
   whether a simple accept/deny banner suffices or a CMP is mandated.
9. **Backend repo access** — this plan specifies server events against api-contract; the BE engineer
   must wire them in the Fastify repo (webhook handler, AI budget guard, auth routes). Confirm
   ownership/coordination.
