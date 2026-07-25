/**
 * Mnemio analytics event contract — the single source of truth for event names,
 * property shapes, and user-profile props. See docs/analytics-strategy.md (what/why)
 * and docs/analytics-implementation-plan.md (how).
 *
 * This module is shared in spirit with the backend (separate repo). Until the
 * distribution mechanism is decided (private npm pkg vs submodule — see plan
 * blocker #1), the backend keeps a byte-identical copy. Property names are
 * snake_case and enum values are fixed HERE and nowhere else, so client and
 * server can never drift.
 *
 * Rule: components/stores never import an analytics SDK — they call useAnalytics()
 * (client) which is typed against this union.
 */

export type Plan = 'free' | 'trial' | 'premium';
export type StudyModeProp = 'flashcard' | 'multiple_choice' | 'srs';
export type AiFeature = 'generate_deck' | 'enrich_words' | 'suggestion' | 'deck_from_image';
export type Grade = 'again' | 'hard' | 'good' | 'easy';
export type GradeCounts = Partial<Record<Grade, number>>;
export type CreationSource = 'manual' | 'ai_generated' | 'ai_from_image' | 'imported' | 'copied';
export type BillingPlanProp = 'monthly' | 'annual';
export type PaywallContext = 'ai_budget' | 'feature';

/**
 * The discriminated union of every tracked event. `props` is exactly what the
 * call-site must pass; super-props (plan, locale, platform, attribution) are
 * merged automatically by the client and must never be hand-set here.
 */
export type AnalyticsEvent =
    // ── Lifecycle / acquisition ───────────────────────────────────────────────
    | { name: 'app_opened'; props: { is_authenticated: boolean; entry_path: string } }
    | { name: 'signup_started'; props: { method: 'email' | 'google'; entry_point: string } }
    | {
          name: 'email_verification_failed';
          props: { error_code: string };
      }
    // ── Onboarding ────────────────────────────────────────────────────────────
    | { name: 'onboarding_step_completed'; props: { step: number; step_name: string } }
    | {
          name: 'onboarding_completed';
          props: { interests_count: number; goal?: string; theme?: string };
      }
    // ── Content creation ──────────────────────────────────────────────────────
    | {
          name: 'deck_created';
          props: {
              deck_id: string;
              creation_source: CreationSource;
              card_count: number;
              source_language?: string;
              target_language?: string;
              is_first_deck: boolean;
              is_public: boolean;
          };
      }
    | {
          name: 'deck_copied_from_discover';
          props: { deck_id: string; viewer_authenticated: boolean; entry_point: string };
      }
    | {
          name: 'card_added';
          props: { deck_id: string; method: 'manual' | 'ai_enriched' | 'bulk'; count: number };
      }
    // ── Study / engagement ────────────────────────────────────────────────────
    | {
          name: 'study_session_started';
          props: { study_mode: StudyModeProp; deck_id: string; card_count: number };
      }
    | {
          name: 'study_card_answered';
          props: { study_mode: StudyModeProp; deck_id: string; correct: boolean; grade?: Grade };
      }
    | {
          name: 'study_session_completed';
          props: {
              study_mode: StudyModeProp;
              deck_id: string;
              cards_reviewed: number;
              accuracy: number;
              duration_sec: number;
              xp_earned: number;
              streak_after?: number;
              grades?: GradeCounts;
          };
      }
    | {
          name: 'study_session_abandoned';
          props: {
              study_mode: StudyModeProp;
              deck_id: string;
              cards_reviewed: number;
              duration_sec: number;
          };
      }
    | { name: 'review_due_cleared'; props: { cards_reviewed: number } }
    // ── AI features ───────────────────────────────────────────────────────────
    | { name: 'ai_feature_viewed'; props: { ai_feature: AiFeature; context: string } }
    | { name: 'ai_feature_started'; props: { ai_feature: AiFeature; context: string } }
    | {
          name: 'ai_feature_completed';
          props: {
              ai_feature: AiFeature;
              context: string;
              result_size: number;
              duration_ms: number;
              accepted?: boolean;
          };
      }
    // ── Monetization (client side of the funnel) ──────────────────────────────
    | {
          name: 'paywall_viewed';
          props: { trigger_context: PaywallContext; ai_feature?: string; cap_per_day?: number };
      }
    | { name: 'paywall_dismissed'; props: { trigger_context: PaywallContext } }
    | {
          name: 'checkout_started';
          props: { billing_plan: BillingPlanProp; trigger_context?: string };
      }
    | { name: 'checkout_abandoned'; props: { billing_plan?: BillingPlanProp } }
    | { name: 'billing_portal_opened'; props: Record<string, never> }
    // ── Retention loops ───────────────────────────────────────────────────────
    | { name: 'streak_extended'; props: { streak_length: number } }
    | { name: 'streak_broken'; props: { previous_length: number } }
    | { name: 'daily_goal_reached'; props: { goal: number } }
    | { name: 'weekly_goal_reached'; props: { goal: number } }
    | { name: 'achievement_unlocked'; props: { achievement_id: string } }
    // ── Server-fired (backend repo; defined here so the union is shared) ───────
    | { name: 'account_created'; props: { method: 'email' | 'google' } }
    | {
          name: 'first_value_reached';
          props: { milestone: 'first_deck' | 'first_session' | 'first_review' };
      }
    | {
          name: 'ai_cap_reached';
          props: { ai_feature: AiFeature; cap_per_day: number };
      }
    | {
          name: 'subscription_started';
          props: {
              billing_plan: BillingPlanProp;
              status: 'trialing' | 'active';
              price: number;
              trigger_context?: string;
          };
      }
    | { name: 'trial_started'; props: { billing_plan: BillingPlanProp } }
    | { name: 'trial_converted'; props: { billing_plan: BillingPlanProp; price: number } }
    | { name: 'subscription_renewed'; props: { billing_plan: BillingPlanProp; price: number } }
    | {
          name: 'subscription_canceled';
          props: { billing_plan: BillingPlanProp; reason?: string };
      };

export type EventName = AnalyticsEvent['name'];

/** The props object required for a given event name. */
export type PropsFor<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['props'];

/**
 * Mixpanel `$set` allowlist — user-level profile props. NO PII: never email,
 * name, or raw card content. A dev assertion in useAnalytics warns if an
 * unknown key is set.
 */
export interface UserProps {
    plan: Plan;
    signup_date?: string;
    acquisition_source?: string;
    app_locale?: string;
    native_language?: string;
    learning_language?: string;
    daily_goal_tier?: string;
    lifetime_decks_created?: number;
    current_streak?: number;
    is_ever_paid?: boolean;
}

/** Allowlisted user-prop keys, used for the dev-time PII guard. */
export const USER_PROP_KEYS: ReadonlyArray<keyof UserProps> = [
    'plan',
    'signup_date',
    'acquisition_source',
    'app_locale',
    'native_language',
    'learning_language',
    'daily_goal_tier',
    'lifetime_decks_created',
    'current_streak',
    'is_ever_paid',
];

/**
 * The small set of conversion events mirrored to GA4 (acquisition only).
 * Mixpanel stays the product source of truth.
 */
export const GA4_CONVERSION_EVENTS: ReadonlySet<EventName> = new Set([
    'signup_started',
    'account_created',
    'subscription_started',
]);
