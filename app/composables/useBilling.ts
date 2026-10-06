import { useAsync, type ApiError } from '@/composables/useAsync';
import { useAnalytics } from '@/composables/useAnalytics';
import { usePaddle } from '@/composables/usePaddle';
import { postPortal } from '@/api/billing';
import { useBillingStore } from '@/stores/billing';
import { useAuthStore } from '@/stores/auth';
import { PLANS, type BillingInterval } from '@/data/plans';
import type { BillingPlan } from '@/types/billing';

/** Our plan vocabulary (`monthly`/`annual`) → Paddle's (`month`/`year`). */
const INTERVAL: Record<BillingPlan, BillingInterval> = {
    monthly: 'month',
    annual: 'year',
};

const premiumPriceId = (plan: BillingPlan): string | undefined =>
    PLANS.find((p) => p.id === 'premium')?.priceId?.[INTERVAL[plan]];

export const useBilling = () => {
    const billingStore = useBillingStore();
    const analytics = useAnalytics();
    const auth = useAuthStore();
    const { load: loadPaddle, failed: paddleFailed } = usePaddle();

    /**
     * Opens Paddle Checkout as a one-page overlay for the given plan.
     *
     * Keeps the `{ execute, loading, error }` shape the previous Stripe redirect
     * had, so `SharedPremiumGate` and `/pricing` call it identically — but nothing
     * navigates away any more; the overlay opens over the current page and Paddle
     * redirects to `successUrl` once payment succeeds.
     *
     * Activation is NOT confirmed here. `/billing/success` polls
     * `GET /billing/subscription` until the backend has processed Paddle's
     * webhook — the webhook is the source of truth, never this callback.
     */
    const checkout = useAsync(async (plan: BillingPlan) => {
        const priceId = premiumPriceId(plan);
        if (!priceId) {
            // Thrown as a bare ApiError object to match `utils/http.ts`, so callers
            // can branch on `.code` the same way regardless of where it came from.
            // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error
            throw {
                code: 'BILLING_PRICE_NOT_CONFIGURED',
                message: `No Paddle price ID configured for the ${plan} plan`,
            } satisfies ApiError;
        }

        const paddle = await loadPaddle();
        if (!paddle) {
            // Missing/mismatched token or env — usePaddle has already logged why.
            billingStore.notConfigured = true;
            return;
        }

        analytics.track('checkout_started', { billing_plan: plan });

        paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            // Pre-fill the signed-in user so they don't retype their address.
            ...(auth.user?.email ? { customer: { email: auth.user.email } } : {}),
            settings: {
                displayMode: 'overlay',
                variant: 'one-page',
                theme: 'dark',
                // Paddle requires an absolute URL. `/billing/success` already polls
                // for activation and routes on to /dashboard, so it is the right
                // landing page — there is no separate `/welcome` route in Mnemio.
                successUrl: `${window.location.origin}/billing/success`,
                // The email is ours, not theirs to swap mid-checkout.
                allowLogout: !auth.user?.email,
            },
        });
    });

    const portal = useAsync(async () => {
        try {
            const res = await postPortal();
            analytics.track('billing_portal_opened', {});
            window.location.assign(res.url);
        } catch (e) {
            const code = (e as { code?: string }).code;
            if (code === 'BILLING_NOT_CONFIGURED') {
                billingStore.notConfigured = true;
                return;
            }
            if (code === 'BILLING_NO_SUBSCRIPTION') {
                return;
            }
            throw e;
        }
    });

    return { checkout, portal, billingStore, paddleFailed };
};
