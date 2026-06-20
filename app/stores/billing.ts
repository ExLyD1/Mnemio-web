import { defineStore, ref, shallowRef } from '#imports';
import { getSubscription } from '@/api/billing';
import type { Subscription } from '@/types/billing';

export const useBillingStore = defineStore('billing', () => {
    const subscription = shallowRef<Subscription | null>(null);
    const loaded = ref(false);
    const loading = ref(false);
    const notConfigured = ref(false);

    const load = async () => {
        if (loaded.value || loading.value) {
            return;
        }
        loading.value = true;
        try {
            subscription.value = await getSubscription();
        } catch (e) {
            const code = (e as { code?: string }).code;
            if (code === 'BILLING_NO_SUBSCRIPTION') {
                subscription.value = null;
            } else if (code === 'BILLING_NOT_CONFIGURED') {
                notConfigured.value = true;
            }
            // other errors: silently ignore; banners stay hidden
        } finally {
            loaded.value = true;
            loading.value = false;
        }
    };

    const resetCache = () => {
        loaded.value = false;
        subscription.value = null;
        notConfigured.value = false;
    };

    return { subscription, loaded, loading, notConfigured, load, resetCache };
});
