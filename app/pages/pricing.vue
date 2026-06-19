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
                    aria-label="Toggle billing cycle"
                    @click="billingCycle = billingCycle === 'monthly' ? 'annual' : 'monthly'"
                >
                    <span
                        class="inline-block size-4 rounded-full bg-white shadow transition-transform"
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
        <section
            v-if="billingStore.notConfigured"
            class="mx-auto max-w-[880px] px-6 pb-16 text-center"
        >
            <p
                class="rounded-xl border border-line bg-bg-surface px-6 py-8 text-body text-cream-dim"
            >
                {{ t('pricing.notConfigured') }}
            </p>
        </section>

        <!-- Plan cards -->
        <section v-else class="mx-auto grid max-w-[880px] gap-6 px-6 pb-20 sm:grid-cols-2">
            <!-- Free plan -->
            <div class="flex flex-col rounded-2xl border border-line bg-bg-surface p-6">
                <p class="text-eyebrow text-cream-dim">{{ t('pricing.freePlanName') }}</p>
                <p class="mt-2 font-display text-h1 text-cream">$0</p>
                <p class="text-small text-cream-dim">/ {{ t('pricing.monthly') }}</p>

                <ul class="mt-6 flex flex-1 flex-col gap-3">
                    <li
                        v-for="f in freeFeatures"
                        :key="f.label"
                        class="flex items-center gap-2 text-body"
                        :class="f.included ? 'text-cream' : 'text-cream-dim/60'"
                    >
                        <Check v-if="f.included" class="size-4 shrink-0 text-brand" />
                        <X v-else class="size-4 shrink-0 text-cream-dim/40" />
                        {{ f.label }}
                    </li>
                </ul>

                <div class="mt-8">
                    <UiButton variant="ghost" class="w-full" disabled>
                        {{ t('pricing.freePlanName') }}
                    </UiButton>
                </div>
            </div>

            <!-- Premium plan -->
            <div
                class="flex flex-col rounded-2xl border-2 border-brand bg-bg-surface p-6 shadow-lg"
            >
                <p class="text-eyebrow text-brand">{{ t('pricing.premiumPlanName') }}</p>
                <p class="mt-2 font-display text-h1 text-cream">
                    {{ billingCycle === 'annual' ? '$8' : '$10' }}
                </p>
                <p class="text-small text-cream-dim">
                    / {{ t('pricing.monthly') }}
                    <span v-if="billingCycle === 'annual'"
                        >— {{ t('pricing.billedAnnually') }}</span
                    >
                </p>

                <ul class="mt-6 flex flex-1 flex-col gap-3">
                    <li
                        v-for="f in premiumFeatures"
                        :key="f.label"
                        class="flex items-center gap-2 text-body text-cream"
                    >
                        <Check class="size-4 shrink-0 text-brand" />
                        {{ f.label }}
                    </li>
                </ul>

                <div class="mt-8">
                    <!-- Already premium -->
                    <UiButton
                        v-if="auth.isPremium"
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
                            :disabled="billing.checkout.loading.value"
                            @click="onUpgrade"
                        >
                            <UiSpinner v-if="billing.checkout.loading.value" size="sm" />
                            {{ t('pricing.ctaUpgrade') }}
                        </UiButton>
                        <p v-if="priceError" class="text-center text-small text-red-400">
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
import { useBillingStore } from '@/stores/billing';
import { useAuthStore } from '@/stores/auth';
import { useBilling } from '@/composables/useBilling';
import { useT } from '@/composables/useT';

definePageMeta({ layout: 'default' });

const { t } = useT();
const auth = useAuthStore();
const billingStore = useBillingStore();
const billing = useBilling();

useSeo({ title: t('pricing.seoTitle'), description: t('pricing.seoDesc') });

const billingCycle = ref<'monthly' | 'annual'>('monthly');
const priceError = ref(false);

const freeFeatures = computed(() => [
    { label: t('pricing.features.srs'), included: true },
    { label: t('pricing.features.decksUnlimited'), included: true },
    { label: t('pricing.features.aiLimited'), included: true },
    { label: t('pricing.features.aiUnlimited'), included: false },
    { label: t('pricing.features.advancedStats'), included: false },
    { label: t('pricing.features.prioritySupport'), included: false },
]);

const premiumFeatures = computed(() => [
    { label: t('pricing.features.srs') },
    { label: t('pricing.features.decksUnlimited') },
    { label: t('pricing.features.aiUnlimited') },
    { label: t('pricing.features.advancedStats') },
    { label: t('pricing.features.prioritySupport') },
]);

const onUpgrade = async () => {
    priceError.value = false;
    await billing.checkout.execute(billingCycle.value);
    if (billing.checkout.error.value?.code === 'BILLING_PRICE_NOT_CONFIGURED') {
        priceError.value = true;
    }
};
</script>
