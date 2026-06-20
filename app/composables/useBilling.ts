import { useAsync } from '@/composables/useAsync';
import { postCheckout, postPortal } from '@/api/billing';
import { useBillingStore } from '@/stores/billing';
import type { BillingPlan } from '@/types/billing';

export const useBilling = () => {
    const billingStore = useBillingStore();

    const checkout = useAsync(async (plan: BillingPlan) => {
        try {
            const res = await postCheckout(plan);
            window.location.assign(res.url);
        } catch (e) {
            const code = (e as { code?: string }).code;
            if (code === 'BILLING_NOT_CONFIGURED') {
                billingStore.notConfigured = true;
                return;
            }
            // BILLING_PRICE_NOT_CONFIGURED: rethrow so the caller can show inline error
            throw e;
        }
    });

    const portal = useAsync(async () => {
        try {
            const res = await postPortal();
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

    return { checkout, portal, billingStore };
};
