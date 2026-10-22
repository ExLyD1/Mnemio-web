<template>
    <div
        class="mx-auto grid max-w-[1160px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:gap-12 md:px-12 md:py-12"
    >
        <div class="min-w-0 space-y-6">
            <NuxtLink
                :to="from"
                class="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-cream-dim"
                ><ChevronLeft class="size-4" />{{ t('billing.checkout.back') }}</NuxtLink
            >
            <h1 class="font-display text-[40px] leading-none md:text-[52px]">
                {{ t('billing.checkout.title') }}
            </h1>
            <BillingOptionRow
                :model-value="plan"
                :options="options"
                :label="t('billing.subscription.yourPlan')"
                :disabled="
                    !billing.checkoutReady.value ||
                    billing.inlineCheckout.loading.value ||
                    billing.paymentProcessing.value
                "
                @update:model-value="selectPlan"
            />
            <div v-if="data" class="rounded-2xl bg-bg-deep p-5" aria-live="polite">
                <BillingSummaryLine
                    :label="`${t('billing.subscription.premium')} · ${t(`billing.settings.plan.${plan}`)}`"
                    :value="
                        eventMoney(
                            trial
                                ? (data.recurring_totals?.subtotal ?? data.totals.subtotal)
                                : data.totals.subtotal,
                        )
                    "
                />
                <BillingSummaryLine
                    v-if="trial"
                    :label="
                        t('billing.checkout.trial').replace(
                            '{days}',
                            trial.frequency +
                                ' ' +
                                t('billing.checkout.intervals.' + trial.interval),
                        )
                    "
                    :value="
                        eventMoney(
                            data.totals.subtotal -
                                (data.recurring_totals?.subtotal ?? data.totals.subtotal),
                        )
                    "
                />
                <BillingSummaryLine
                    v-if="data.totals.discount"
                    :label="t('billing.checkout.discount')"
                    :value="eventMoney(-data.totals.discount)"
                />
                <BillingSummaryLine
                    :label="t('billing.checkout.tax')"
                    :value="eventMoney(data.totals.tax)"
                />
                <div class="mt-2 border-t border-line pt-3">
                    <BillingSummaryLine
                        :label="t('billing.checkout.dueToday')"
                        :value="eventMoney(data.totals.balance ?? data.totals.total)"
                    />
                </div>
                <p v-if="data.recurring_totals" class="mt-2 text-[14px] text-cream-faint">
                    {{
                        t(trial ? 'billing.checkout.then' : 'billing.checkout.renewal')
                            .replace('{price}', eventMoney(data.recurring_totals.total))
                            .replace('{plan}', t(`billing.settings.plan.${plan}`))
                    }}
                </p>
            </div>
            <p v-else-if="!unavailable" class="text-small text-cream-faint" aria-live="polite">
                {{ t('billing.checkout.summaryPending') }}
            </p>
        </div>
        <div class="min-w-0 self-start rounded-[24px] border border-line bg-bg-surface p-5 md:p-7">
            <h2 class="mb-4 text-[17px] font-bold">{{ t('billing.checkout.details') }}</h2>
            <div
                v-if="unavailable"
                role="alert"
                class="rounded-2xl border border-error/30 bg-error/10 p-5"
            >
                <p>{{ t('billing.checkout.unavailable') }}</p>
                <a
                    href="mailto:hello@mnemio.xyz"
                    class="mt-3 inline-flex min-h-11 items-center font-bold underline"
                    >{{ t('premiumGate.ctaContact') }}</a
                >
            </div>
            <div
                v-if="billing.paymentError.value"
                class="mb-5 flex items-start gap-3 rounded-2xl bg-error/10 p-4"
                role="alert"
            >
                <TriangleAlert class="size-5 shrink-0 text-error-soft" />
                <div>
                    <p class="font-bold text-error-soft">{{ t('billing.checkout.declined') }}</p>
                    <p class="mt-1 text-[15px] text-cream-dim">
                        {{ t('billing.checkout.declinedBody') }}
                    </p>
                    <p class="mt-2 text-small text-error-soft">
                        {{ t(`billing.card.decline.${declineKey(billing.paymentError.value)}`) }}
                    </p>
                </div>
            </div>
            <UiSpinner v-if="billing.inlineCheckout.loading.value" class="mx-auto my-8" />
            <div
                class="paddle-frame min-w-0"
                :class="billing.paymentError.value ? 'rounded-xl border border-error-soft' : ''"
            />
            <p
                v-if="billing.updateItems.error.value"
                role="alert"
                class="mt-4 text-small text-error-soft"
            >
                {{ t('billing.error') }}
            </p>
            <BillingLegal class="mt-5 pb-[env(safe-area-inset-bottom)]" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { ChevronLeft, TriangleAlert } from 'lucide-vue-next';
import { sanitizeNext } from '@/utils/returnTo';
import { declineKey } from '@/utils/subscriptionState';
import { formatMoney } from '@/utils/format';
import type { BillingPlan } from '@/types/billing';
definePageMeta({ layout: 'checkout' });
const { t } = useT();
const { current } = useAppLocale();
const route = useRoute();
const billing = useBilling();
const prices = usePremiumPrices();
const plan = ref<BillingPlan>(route.query.plan === 'monthly' ? 'monthly' : 'annual');
const from = computed(() => sanitizeNext(route.query.from) || '/dashboard');
const data = billing.checkoutData;
const trial = computed(() => data.value?.items[0]?.trial_period);
const unavailable = computed(
    () =>
        billing.paddleFailed.value ||
        !!billing.inlineCheckout.error.value ||
        billing.billingStore.notConfigured,
);
const options = computed(() => [
    {
        value: 'annual' as const,
        title: t('billing.settings.plan.annual'),
        price: prices.price('annual'),
        subtitle: [
            t('billing.checkout.perMonth').replace('{price}', prices.perMonth.value),
            prices.saveLabel.value,
        ]
            .filter(Boolean)
            .join(' · '),
    },
    {
        value: 'monthly' as const,
        title: t('billing.settings.plan.monthly'),
        price: prices.price('monthly'),
        subtitle: t('billing.checkout.monthly'),
    },
]);
const eventMoney = (amount: number) =>
    formatMoney(data.value ? { amount, currency: data.value.currency_code } : null, current.value);
const selectPlan = async (value: BillingPlan) => {
    const previous = plan.value;
    plan.value = value;
    await billing.updateItems.execute(value);
    if (billing.updateItems.error.value) plan.value = previous;
    else
        await navigateTo(
            { path: '/checkout', query: { plan: value, from: from.value } },
            { replace: true },
        );
};
onMounted(async () => {
    await billing.load.execute();
    if (billing.billingStore.notConfigured) return;
    await billing.inlineCheckout.execute({
        plan: plan.value,
        frameTarget: 'paddle-frame',
        onComplete: async () => {
            await navigateTo({ path: '/billing/success', query: { from: from.value } });
        },
    });
});
useSeo({ title: t('billing.checkout.title'), description: t('seo.appDesc'), noindex: true });
</script>
