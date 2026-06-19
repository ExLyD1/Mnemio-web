<template>
    <UiModal v-model="gate.open" :title="t('premiumGate.title')" size="sm">
        <p class="text-body text-cream-dim">
            {{
                gate.context === 'ai_budget'
                    ? t('premiumGate.bodyAiBudget').replace('{cap}', String(aiCap))
                    : t('premiumGate.body')
            }}
        </p>

        <template #footer>
            <template v-if="billing.billingStore.notConfigured">
                <a
                    href="mailto:hello@mnemio.xyz"
                    class="text-body font-semibold text-brand hover:underline"
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

const aiCap = computed(() => gate.details?.capPerDay ?? 10);

const onUpgrade = async (plan: BillingPlan) => {
    await billing.checkout.execute(plan);
    if (!billing.checkout.error.value) {
        gate.hide();
    }
};
</script>
