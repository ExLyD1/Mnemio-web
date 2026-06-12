import { defineStore, ref } from '#imports';

export const usePremiumGateStore = defineStore('premiumGate', () => {
    const open = ref(false);
    const context = ref<'ai_budget' | 'feature' | null>(null);
    const details = ref<{ capPerDay?: number } | null>(null);

    const show = (ctx: 'ai_budget' | 'feature' = 'feature', extra?: { capPerDay?: number }) => {
        context.value = ctx;
        details.value = extra ?? null;
        open.value = true;
    };

    const hide = () => {
        open.value = false;
        context.value = null;
        details.value = null;
    };

    return { open, context, details, show, hide };
});
