<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[36px]"
        v-model="gate.open"
        :title="t('premiumGate.title')"
        sheet
    >
        <p class="text-body text-cream-dim">{{ body }}</p>
        <BillingOptionRow
            v-if="!unavailable"
            v-model="selected"
            :options="options"
            :label="t('billing.subscription.yourPlan')"
            horizontal
            class="mt-5"
        />
        <template #footer>
            <BillingButton kind="text" @click="gate.hide()">{{
                t('premiumGate.dismiss')
            }}</BillingButton>
            <a
                v-if="unavailable"
                href="mailto:hello@mnemio.xyz"
                class="flex min-h-11 items-center justify-center font-bold text-purple"
                >{{ t('premiumGate.ctaContact') }}</a
            >
            <BillingButton v-else @click="onUpgrade(selected)"
                >{{ t(selected === 'annual' ? 'premiumGate.ctaAnnual' : 'premiumGate.ctaMonthly')
                }}{{
                    selected === 'annual' && prices.saveLabel.value
                        ? ' ? ' + prices.saveLabel.value
                        : ''
                }}</BillingButton
            >
        </template>
    </UiModal>
</template>

<script setup lang="ts">
import { usePremiumGateStore } from '@/stores/premiumGate';
import { useBilling } from '@/composables/useBilling';
import { useT } from '@/composables/useT';
import type { BillingPlan } from '@/types/billing';

const gate = usePremiumGateStore();
const billing = useBilling();
const { t } = useT();
const selected = ref<BillingPlan>('annual');
const prices = usePremiumPrices();
const unavailable = computed(() => billing.billingStore.notConfigured || prices.failed.value);
const options = computed(() => [
    {
        value: 'monthly' as const,
        title: t('billing.settings.plan.monthly'),
        price: prices.price('monthly'),
    },
    {
        value: 'annual' as const,
        title: t('billing.settings.plan.annual'),
        price: prices.price('annual'),
        subtitle: prices.saveLabel.value,
    },
]);
watch(
    () => gate.open,
    (value) => {
        if (value) selected.value = 'annual';
    },
);

/**
 * The paywall must never invent a number. It used to default to "10 free AI
 * requests" whenever the cap was missing, while the server's chat cap was 50 —
 * two different limits on screen for one event. With no cap from the server we
 * fall back to wording that carries no number at all.
 */
const KIND_KEY: Record<string, string> = {
    chat: 'premiumGate.bodyAiBudgetChat',
    enrich: 'premiumGate.bodyAiBudgetDecks',
    generate: 'premiumGate.bodyAiBudgetDecks',
    image: 'premiumGate.bodyAiBudgetImage',
};

const body = computed(() => {
    if (gate.context !== 'ai_budget') {
        return t('premiumGate.body');
    }
    const cap = gate.details?.capPerDay;
    if (cap === undefined) {
        return t('premiumGate.bodyAiBudgetGeneric');
    }
    const key = KIND_KEY[gate.details?.kind ?? ''] ?? 'premiumGate.bodyAiBudget';
    return t(key).replace('{cap}', String(cap));
});

const onUpgrade = async (plan: BillingPlan) => {
    await billing.checkout.execute(plan);
    if (!billing.checkout.error.value) {
        gate.hide();
    }
};
</script>
