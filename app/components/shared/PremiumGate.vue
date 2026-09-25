<template>
    <UiModal v-model="gate.open" :title="t('premiumGate.title')" size="sm">
        <p class="text-body text-cream-dim">
            {{ body }}
        </p>

        <template #footer>
            <template v-if="billing.billingStore.notConfigured">
                <a
                    href="mailto:hello@mnemio.xyz"
                    class="text-body font-semibold text-brand-bright hover:underline"
                >
                    {{ t('premiumGate.ctaContact') }}
                </a>
            </template>
            <template v-else>
                <UiButton
                    variant="ghost"
                    :disabled="billing.checkout.loading.value"
                    @click="gate.hide()"
                >
                    {{ t('premiumGate.dismiss') }}
                </UiButton>
                <UiButton
                    variant="light"
                    :disabled="billing.checkout.loading.value"
                    @click="onUpgrade('monthly')"
                >
                    <UiSpinner v-if="billing.checkout.loading.value" size="sm" />
                    {{ t('premiumGate.ctaMonthly') }}
                </UiButton>
                <UiButton
                    variant="primary"
                    :disabled="billing.checkout.loading.value"
                    @click="onUpgrade('annual')"
                >
                    <UiSpinner v-if="billing.checkout.loading.value" size="sm" />
                    {{ t('premiumGate.ctaAnnual') }}
                </UiButton>
            </template>
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
