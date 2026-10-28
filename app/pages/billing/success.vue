<template>
    <div
        class="mx-auto flex min-h-[80dvh] max-w-[640px] flex-col items-center justify-center gap-6 px-5 py-12 text-center text-cream md:pt-[90px]"
    >
        <template v-if="state === 'polling'"
            ><UiSpinner size="lg" />
            <h1 class="font-display text-h2">{{ t('billing.success.polling') }}</h1>
            <p class="text-body text-cream-dim">{{ t('billing.success.pollingHint') }}</p></template
        >
        <template v-else-if="state === 'timeout'"
            ><h1 class="font-display text-h2">{{ t('billing.success.timeoutTitle') }}</h1>
            <p class="text-body text-cream-dim">{{ t('billing.success.timeoutBody') }}</p>
            <BillingButton :busy="polling" @click="retry">{{
                t('billing.success.refreshButton')
            }}</BillingButton></template
        >
        <template v-else>
            <SharedMimi pose="cheer" :size="150" :bob="false" />
            <p class="text-eyebrow uppercase text-cream-faint">
                {{
                    t(
                        sub?.status === 'trialing'
                            ? 'billing.success.trialStarted'
                            : 'billing.success.paid',
                    )
                }}
            </p>
            <h1 class="font-display text-[40px] leading-none md:text-[64px]">
                {{ t('billing.success.welcome') }}
            </h1>
            <p class="max-w-[44ch] text-[15px] leading-relaxed text-cream-dim md:text-[17px]">
                {{
                    sub?.status === 'trialing'
                        ? text('billing.success.trialBody', {
                              days: TRIAL_DAYS,
                              date: date(sub.trialEnd),
                              charge: text(
                                  sub.plan === 'annual'
                                      ? 'billing.success.perYear'
                                      : 'billing.success.perMonth',
                                  { price },
                              ),
                          })
                        : t('billing.success.paidBody')
                }}
            </p>
            <div class="mt-2 flex w-full flex-col gap-3 md:w-auto md:flex-row">
                <NuxtLink
                    :to="from"
                    class="flex min-h-11 items-center justify-center rounded-[14px] bg-purple px-6 py-3.5 font-bold text-on-accent"
                    >{{
                        from === '/dashboard'
                            ? t('billing.success.dashboard')
                            : from.startsWith('/pricing')
                              ? t('refunds.backToPricing')
                              : origin
                                ? text('billing.success.back', { origin })
                                : t('common.back')
                    }}</NuxtLink
                ><NuxtLink
                    to="/settings/billing"
                    class="flex min-h-11 items-center justify-center rounded-[14px] border border-line-strong px-6 py-3.5 font-bold text-cream transition-colors hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:shadow-focus-ring"
                    >{{ t('billing.success.subscription') }}</NuxtLink
                >
            </div>
        </template>
    </div>
</template>
<script setup lang="ts">
import { sanitizeNext } from '@/utils/returnTo';
import { TRIAL_DAYS } from '@/data/plans';
definePageMeta({ layout: 'default' });
const { t } = useT();
const auth = useAuthStore();
const route = useRoute();
const { billing, sub, store, price, date, text } = useSubscriptionView();
const from = computed(() => sanitizeNext(route.query.from) || '/dashboard');
// Page name for "Back to {origin}"; '' falls back to a plain "Back" (never a raw path).
const ORIGINS: [string, string][] = [
    ['/ai', 'rail.ai'],
    ['/decks', 'rail.decks'],
    ['/discover', 'rail.discover'],
    ['/statistics', 'rail.statistics'],
    ['/profile', 'rail.profile'],
    ['/settings/billing', 'billing.subscription.nav'],
];
const origin = computed(() => {
    const key = ORIGINS.find(([prefix]) => from.value.startsWith(prefix))?.[1];
    return key ? t(key) : '';
});
const state = ref<'polling' | 'timeout' | 'ready'>('polling');
const polling = ref(false);
let attempts = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;
const poll = async () => {
    if (stopped || polling.value) return;
    polling.value = true;
    attempts++;
    store.invalidate();
    await billing.load.execute();
    if (stopped) return;
    if (sub.value && ['active', 'trialing'].includes(sub.value.status)) {
        await auth.hydrate();
        if (stopped) return;
        state.value = 'ready';
        polling.value = false;
        return;
    }
    polling.value = false;
    if (
        attempts >= 10 ||
        (billing.load.error.value && billing.load.error.value.code !== 'BILLING_NO_SUBSCRIPTION')
    ) {
        state.value = 'timeout';
        return;
    }
    timer = setTimeout(poll, 3000);
};
const retry = () => {
    attempts = 0;
    state.value = 'polling';
    void poll();
};
onMounted(() => {
    void poll();
});
onUnmounted(() => {
    stopped = true;
    if (timer) clearTimeout(timer);
});
useSeo({ title: t('billing.success.welcome'), description: t('seo.appDesc'), noindex: true });
</script>
