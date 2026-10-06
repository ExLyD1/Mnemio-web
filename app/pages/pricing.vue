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
                    <SharedPill tone="plum" class="text-small">{{
                        t('pricing.saveBadge')
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
                        v-else-if="auth.isPremium"
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
                        @click="navigateTo('/login?redirect=/pricing')"
                    >
                        {{ t('pricing.ctaSignIn') }}
                    </UiButton>
                    <!-- Authenticated free user -->
                    <div v-else class="space-y-2">
                        <UiButton
                            variant="primary"
                            class="w-full"
                            :disabled="billing.checkout.loading.value || !paddle"
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
    </div>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { useHead, useSiteConfig } from '#imports';
import { useBillingStore } from '@/stores/billing';
import { useAuthStore } from '@/stores/auth';
import { useBilling } from '@/composables/useBilling';
import { usePaddle } from '@/composables/usePaddle';
import { usePaddlePrices } from '@/composables/usePaddlePrices';
import { useGeoCountry } from '@/composables/useGeoCountry';
import { useT } from '@/composables/useT';
import { PLANS, TRIAL_DAYS, type Plan } from '@/data/plans';

definePageMeta({ layout: 'default' });

const { t } = useT();
const auth = useAuthStore();
const billingStore = useBillingStore();
const billing = useBilling();
const site = useSiteConfig();

useSeo({ title: t('pricing.seoTitle'), description: t('pricing.seoDesc') });

// Resolved during the SSR pass from the CDN's geo header; `null` means "let
// Paddle geolocate from the visitor's IP", which is also what checkout does — so
// the previewed price and the charged price always agree.
const country = useGeoCountry();

const { paddle, load: loadPaddle, failed: paddleFailed } = usePaddle();
const { prices, error: pricesError } = usePaddlePrices(paddle, country);

onMounted(() => {
    loadPaddle();
});

// Machine-readable pricing so rich results and AI engines can answer "how much is
// Mnemio." These stay in the catalog's base currency (USD) on purpose: the block
// is server-rendered for crawlers, while PricePreview is client-only, so there is
// no localized total available at render time. Keep in sync with app/data/plans.ts.
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-pricing',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mnemio Premium',
                description: t('pricing.seoDesc'),
                brand: { '@type': 'Brand', name: 'Mnemio' },
                url: `${base}/pricing`,
                offers: [
                    {
                        '@type': 'Offer',
                        name: 'Free',
                        price: '0',
                        priceCurrency: 'USD',
                        availability: 'https://schema.org/InStock',
                        url: `${base}/pricing`,
                    },
                    {
                        '@type': 'Offer',
                        name: 'Premium (monthly)',
                        price: '10',
                        priceCurrency: 'USD',
                        availability: 'https://schema.org/InStock',
                        url: `${base}/pricing`,
                    },
                    {
                        '@type': 'Offer',
                        name: 'Premium (annual)',
                        price: '96',
                        priceCurrency: 'USD',
                        availability: 'https://schema.org/InStock',
                        url: `${base}/pricing`,
                    },
                ],
            }),
        },
    ],
});

const billingCycle = ref<'monthly' | 'annual'>('monthly');
const priceError = ref(false);

// Both intervals come back in one PricePreview call, so the toggle is a map
// lookup — it never triggers a re-fetch.
const priceFor = (plan: Plan): string | undefined =>
    plan.priceId
        ? prices.value[billingCycle.value === 'annual' ? plan.priceId.year : plan.priceId.month]
        : undefined;

const trialNote = computed(() => t('pricing.trialNote').replace('{n}', String(TRIAL_DAYS)));

// Hide the cards entirely when billing can't work at all: the backend reports no
// billing provider, Paddle.js refused to initialise (bad token/env), or the
// price IDs don't resolve in this environment.
const unavailable = computed(
    () => billingStore.notConfigured || paddleFailed.value || pricesError.value,
);

const onUpgrade = async () => {
    priceError.value = false;
    await billing.checkout.execute(billingCycle.value);
    if (billing.checkout.error.value?.code === 'BILLING_PRICE_NOT_CONFIGURED') {
        priceError.value = true;
    }
};
</script>
