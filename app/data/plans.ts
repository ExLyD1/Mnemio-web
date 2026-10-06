/**
 * The Mnemio plan catalog — the one place to edit plans, features, and Paddle
 * price IDs.
 *
 * Mnemio sells a single paid plan (Premium) alongside a free tier, so this is a
 * two-entry list, not the three-tier shape Paddle's starter kit assumes. `Free`
 * carries no `priceId` because it never reaches checkout.
 *
 * `priceId` values are environment-scoped: a sandbox `pri_...` does not exist in
 * production and Paddle.js throws "price not found" if you mix them. Keep these
 * in sync with `NUXT_PUBLIC_PADDLE_ENV`.
 *
 * Feature labels are i18n keys resolved through `useT()`, not literal copy — see
 * `pricing.features.*` in `app/i18n/{en,uk}.json`.
 */
export type BillingInterval = 'month' | 'year';

export interface Plan {
    /** Stable internal id. `premium` mirrors `UserPlan` in `@/types/billing`. */
    id: 'free' | 'premium';
    /** i18n key for the plan name. */
    nameKey: string;
    /** Feature rows. `included: false` renders a struck-through/dimmed row. */
    features: { key: string; included: boolean }[];
    /** Paddle price IDs per billing interval. Absent for non-purchasable plans. */
    priceId?: Record<BillingInterval, string>;
    /** Renders the emphasised, brand-bordered card. */
    featured: boolean;
}

export const PLANS: Plan[] = [
    {
        id: 'free',
        nameKey: 'pricing.freePlanName',
        featured: false,
        features: [
            { key: 'pricing.features.srs', included: true },
            { key: 'pricing.features.decksUnlimited', included: true },
            { key: 'pricing.features.aiLimited', included: true },
            { key: 'pricing.features.aiUnlimited', included: false },
            { key: 'pricing.features.advancedStats', included: false },
            { key: 'pricing.features.prioritySupport', included: false },
        ],
    },
    {
        id: 'premium',
        nameKey: 'pricing.premiumPlanName',
        featured: true,
        priceId: {
            month: 'pri_01m49b7ychmsbkz8dt2spxx3z1',
            year: 'pri_01m49b7yhzsa7q9yhnv3s3tn0j',
        },
        features: [
            { key: 'pricing.features.srs', included: true },
            { key: 'pricing.features.decksUnlimited', included: true },
            { key: 'pricing.features.aiUnlimited', included: true },
            { key: 'pricing.features.advancedStats', included: true },
            { key: 'pricing.features.prioritySupport', included: true },
        ],
    },
];

/** Free trial length, in days, configured on both Premium prices in Paddle. */
export const TRIAL_DAYS = 7;

/** Every purchasable price ID, for a single batched `PricePreview()` call. */
export const ALL_PRICE_IDS: string[] = PLANS.flatMap((p) =>
    p.priceId ? [p.priceId.month, p.priceId.year] : [],
);
