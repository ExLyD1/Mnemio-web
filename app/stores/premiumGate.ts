import { defineStore, ref } from '#imports';
import { useAnalytics } from '@/composables/useAnalytics';

export const usePremiumGateStore = defineStore('premiumGate', () => {
    const open = ref(false);
    const context = ref<'ai_budget' | 'feature' | null>(null);
    const details = ref<{ capPerDay?: number } | null>(null);

    const show = (ctx: 'ai_budget' | 'feature' = 'feature', extra?: { capPerDay?: number }) => {
        context.value = ctx;
        details.value = extra ?? null;
        open.value = true;
        // Single choke-point for every paywall surface → one funnel step.
        useAnalytics().track('paywall_viewed', {
            trigger_context: ctx,
            cap_per_day: extra?.capPerDay,
        });
    };

    const hide = () => {
        if (open.value && context.value) {
            useAnalytics().track('paywall_dismissed', { trigger_context: context.value });
        }
        open.value = false;
        context.value = null;
        details.value = null;
    };

    return { open, context, details, show, hide };
});
