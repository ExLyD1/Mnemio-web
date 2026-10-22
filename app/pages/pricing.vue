<template>
    <div>
        <!-- Header -->
        <section class="mx-auto max-w-[880px] px-6 py-16 text-center">
            <h1 class="font-display text-display-sm text-cream">{{ t('pricing.title') }}</h1>
            <p class="mt-3 text-body text-cream-dim">{{ t('pricing.subtitle') }}</p>

            <!-- Monthly / Annual toggle -->
            <div class="mt-8 flex items-center justify-center gap-3">
                <button
                    type="button"
                    :class="[
                        'text-body font-semibold transition-colors',
                        billingCycle === 'monthly' ? 'text-cream' : 'text-cream-dim',
                    ]"
                    @click="billingCycle = 'monthly'"
                >
                    {{ t('pricing.toggleMonthly') }}
                </button>
                <button
                    type="button"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    :class="billingCycle === 'annual' ? 'bg-brand' : 'bg-bg-muted'"
                    :aria-label="t('pricing.toggleAria')"
                    @click="billingCycle = billingCycle === 'monthly' ? 'annual' : 'monthly'"
                >
                    <span
                        class="inline-block size-4 rounded-full bg-on-plum shadow transition-transform"
                        :class="billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'"
                    />
                </button>
                <button
                    type="button"
                    :class="[
                        'flex items-center gap-1.5 text-body font-semibold transition-colors',
                        billingCycle === 'annual' ? 'text-cream' : 'text-cream-dim',
                    ]"
                    @click="billingCycle = 'annual'"
                >
                    {{ t('pricing.toggleAnnual') }}
                    <SharedPill v-if="premiumPrices.saving.value" tone="plum" class="text-small">{{
                        premiumPrices.saveLabel.value
                    }}</SharedPill>
                </button>
            </div>
        </section>

        <!-- Not configured notice -->
        <section v-if="unavailable" class="mx-auto max-w-[880px] px-6 pb-16 text-center">
            <p
                class="rounded-xl border border-line bg-bg-surface px-6 py-8 text-body text-cream-dim"
            >
                {{ t('pricing.notConfigured') }}
            </p>
        </section>

        <!-- Plan cards -->
        <section v-else class="mx-auto grid max-w-[880px] gap-6 px-6 pb-20 sm:grid-cols-2">
            <div
                v-for="plan in PLANS"
                :key="plan.id"
                class="flex flex-col rounded-2xl bg-bg-surface p-6"
                :class="plan.featured ? 'border-2 border-brand shadow-lg' : 'border border-line'"
            >
                <p
                    class="text-eyebrow"
                    :class="plan.featured ? 'text-brand-bright' : 'text-cream-dim'"
                >
                    {{ t(plan.nameKey) }}
                </p>

                <!-- Price. For paid plans this is Paddle's own formatted total for
                     the visitor's country — never reformatted, never recomputed. -->
                <p class="mt-2 font-display text-h1 text-cream">
                    <template v-if="!plan.priceId">{{ t('pricing.freePrice') }}</template>
                    <span v-else-if="priceFor(plan)">{{ priceFor(plan) }}</span>
                    <span v-else class="text-cream-dim/50">···</span>
                </p>
                <p class="text-small text-cream-dim">
                    <template v-if="plan.priceId">
                        /
                        {{ billingCycle === 'annual' ? t('pricing.annual') : t('pricing.monthly') }}
                    </template>
                    <template v-else>&nbsp;</template>
                </p>

                <ul class="mt-6 flex flex-1 flex-col gap-3">
                    <li
                        v-for="f in plan.features"
                        :key="f.key"
                        class="flex items-center gap-2 text-body"
                        :class="f.included ? 'text-cream' : 'text-cream-dim/60'"
                    >
                        <Check v-if="f.included" class="size-4 shrink-0 text-brand-bright" />
                        <X v-else class="size-4 shrink-0 text-cream-dim/40" />
                        {{ t(f.key) }}
                    </li>
                </ul>

                <!-- CTA -->
                <div class="mt-8">
                    <!-- Free plan: nothing to buy -->
                    <UiButton v-if="!plan.priceId" variant="ghost" class="w-full" disabled>
                        {{ t(plan.nameKey) }}
                    </UiButton>
                    <!-- Already premium -->
                    <UiButton
                        v-else-if="auth.isPremium || hasSubscription"
                        variant="primary"
                        class="w-full"
                        @click="navigateTo('/settings/billing')"
                    >
                        {{ t('pricing.ctaManage') }}
                    </UiButton>
                    <!-- Guest -->
                    <UiButton
                        v-else-if="!auth.isAuthenticated"
                        variant="primary"
                        class="w-full"
                        @click="onUpgrade"
                    >
                        {{ t('pricing.ctaSignIn') }}
                    </UiButton>
                    <!-- Authenticated free user -->
                    <div v-else class="space-y-2">
                        <UiButton
                            variant="primary"
                            class="w-full"
                            :disabled="billing.checkout.loading.value"
                            @click="onUpgrade"
                        >
                            <UiSpinner v-if="billing.checkout.loading.value" size="sm" />
                            {{ t('pricing.ctaUpgrade') }}
                        </UiButton>
                        <p class="text-center text-small text-cream-dim">
                            {{ trialNote }}
                        </p>
                        <p v-if="priceError" class="text-center text-small text-error-soft">
                            {{ t('pricing.priceNotConfigured') }}
                        </p>
                    </div>
                </div>
            </div>
        </section>
        <section class="mx-auto max-w-[880px] px-5 pb-20 md:px-6">
            <h2 class="font-display text-[36px] leading-tight text-cream md:text-[48px]">
                {{ t('pricing.faq.title') }}
            </h2>
            <div class="mt-6">
                <div v-for="n in 7" :key="n" class="border-b border-line py-5">
                    <h3>
                        <button
                            :id="'premium-faq-question-' + n"
                            type="button"
                            class="flex min-h-11 w-full items-center justify-between gap-5 text-left text-[18px] font-bold text-cream"
                            :aria-expanded="faqOpen === n"
                            :aria-controls="'premium-faq-answer-' + n"
                            @click="faqOpen = faqOpen === n ? null : n"
                        >
                            {{ t('pricing.faq.q' + n)
                            }}<Minus v-if="faqOpen === n" class="size-5 shrink-0" /><Plus
                                v-else
                                class="size-5 shrink-0"
                            />
                        </button>
                    </h3>
                    <p
                        v-show="faqOpen === n"
                        :id="'premium-faq-answer-' + n"
                        :aria-labelledby="'premium-faq-question-' + n"
                        class="mt-3 max-w-[62ch] text-body text-cream-dim"
                    >
                        {{ faqAnswer(n) }}
                    </p>
                </div>
            </div>
            <p class="mt-6 text-body text-cream-dim">
                {{ t('pricing.faq.contact') }}
                <a href="mailto:hello@mnemio.xyz" class="font-bold text-cream underline"
                    >hello@mnemio.xyz</a
                >
            </p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { Check, X, Plus, Minus } from 'lucide-vue-next';
import { useHead, useSiteConfig } from '#imports';
import { useAuthStore } from '@/stores/auth';
import { useBilling } from '@/composables/useBilling';
import { useT } from '@/composables/useT';
import { PLANS, TRIAL_DAYS, type Plan } from '@/data/plans';

definePageMeta({ layout: 'default' });

const { t } = useT();
const auth = useAuthStore();
const billing = useBilling();
const premiumPrices = usePremiumPrices();
const hasSubscription = computed(
    () =>
        billing.billingStore.subscription &&
        !['canceled', 'expired'].includes(billing.billingStore.subscription.status),
);
const faqOpen = ref<number | null>(1);
const site = useSiteConfig();

useSeo({ title: t('pricing.seoTitle'), description: t('pricing.seoDesc') });

const prices = premiumPrices.prices;
const pricesError = premiumPrices.error;
const paddleFailed = premiumPrices.failed;
onMounted(() => {
    if (auth.isAuthenticated) {
        void billing.load.execute();
        void billing.usage.execute();
    }
});

// Paid offers are emitted only after a localized Paddle preview exists.
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead(() => ({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-pricing',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mnemio Premium',
                description: t('pricing.seoDesc'),
                url: base + '/pricing',
                offers: (['monthly', 'annual'] as const).flatMap((plan) => {
                    const money = premiumPrices.amount(plan);
                    return money
                        ? [
                              {
                                  '@type': 'Offer',
                                  name:
                                      'Mnemio Premium (' + t('billing.settings.plan.' + plan) + ')',
                                  price: money.amount,
                                  priceCurrency: money.currency,
                                  url: base + '/pricing',
                              },
                          ]
                        : [];
                }),
            }),
        },
    ],
}));

const billingCycle = ref<'monthly' | 'annual'>('monthly');
const priceError = ref(false);

// Both intervals come back in one PricePreview call, so the toggle is a map
// lookup — it never triggers a re-fetch.
const priceFor = (plan: Plan): string | undefined =>
    plan.priceId
        ? prices.value[billingCycle.value === 'annual' ? plan.priceId.year : plan.priceId.month]
        : undefined;

const trialNote = computed(() => t('pricing.trialNote', TRIAL_DAYS));

// Hide the cards only when Paddle itself can't serve prices — it refused to
// initialise (missing/mismatched token or env) or the price IDs don't resolve in
// this environment.
//
// Deliberately NOT gated on `billingStore.notConfigured`. That flag means the
// *backend* has no billing provider configured; checkout is now driven entirely
// client-side by Paddle.js, so the backend's state says nothing about whether we
// can render prices. Conflating the two blanked this page on any backend without
// billing keys.
const unavailable = computed(() => paddleFailed.value || pricesError.value);

const onUpgrade = async () => {
    priceError.value = false;
    await billing.checkout.execute(billingCycle.value);
    if (billing.checkout.error.value?.code === 'BILLING_PRICE_NOT_CONFIGURED') {
        priceError.value = true;
    }
};
const faqAnswer = (n: number) => {
    const cap = billing.billingStore.usage?.freeCaps?.chat;
    if (n === 7)
        return cap === undefined
            ? t('pricing.faq.a7Generic')
            : t('pricing.faq.a7').replace('{cap}', String(cap));
    return t('pricing.faq.a' + n).replace('{days}', String(TRIAL_DAYS));
};
</script>
