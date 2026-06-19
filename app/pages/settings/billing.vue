<template>
    <div class="mx-auto max-w-xl px-6 py-12">
        <h1 class="font-display text-h2 text-cream">{{ t('billing.settings.title') }}</h1>

        <div v-if="billingStore.loading" class="mt-8 flex justify-center">
            <UiSpinner />
        </div>

        <div v-else class="mt-8 rounded-2xl border border-line bg-bg-surface p-6">
            <!-- Free plan / no subscription -->
            <template v-if="!sub">
                <p class="text-eyebrow text-cream-dim">{{ t('billing.settings.freePlan') }}</p>
                <p class="mt-2 text-body text-cream-dim">{{ t('billing.settings.freeBody') }}</p>
                <div class="mt-6">
                    <NuxtLink to="/pricing">
                        <UiButton variant="primary">{{
                            t('billing.settings.upgradeCta')
                        }}</UiButton>
                    </NuxtLink>
                </div>
            </template>

            <template v-else>
                <!-- Status badge -->
                <div class="flex items-center gap-3">
                    <span
                        :class="[
                            'rounded-full px-3 py-1 text-small font-semibold',
                            statusBadge.classes,
                        ]"
                    >
                        {{ t(`billing.settings.status.${sub.status}`) }}
                    </span>
                    <span class="text-body text-cream-dim">
                        {{ t(`billing.settings.plan.${sub.plan}`) }}
                    </span>
                </div>

                <!-- Past due warning -->
                <div
                    v-if="sub.status === 'past_due'"
                    class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-small text-red-300"
                >
                    {{ t('billing.settings.pastDueWarning') }}
                </div>

                <!-- Dates -->
                <div class="mt-4 space-y-1 text-body text-cream-dim">
                    <p v-if="sub.status === 'trialing' && sub.trialEnd">
                        {{ t('billing.settings.trialEnds').replace('{date}', fmt(sub.trialEnd)) }}
                    </p>
                    <p v-if="sub.status === 'active' || sub.status === 'trialing'">
                        {{
                            t('billing.settings.renewsOn').replace(
                                '{date}',
                                fmt(sub.currentPeriodEnd),
                            )
                        }}
                    </p>
                    <p v-if="sub.status === 'canceled' || sub.status === 'expired'">
                        {{
                            t('billing.settings.expiresOn').replace(
                                '{date}',
                                fmt(sub.currentPeriodEnd),
                            )
                        }}
                    </p>
                    <p v-if="sub.cancelAtPeriodEnd" class="text-amber-400">
                        {{ t('billing.settings.cancelNote') }}
                    </p>
                </div>

                <!-- Actions -->
                <div class="mt-6 flex flex-wrap gap-3">
                    <!-- Resubscribe for canceled/expired -->
                    <NuxtLink
                        v-if="sub.status === 'canceled' || sub.status === 'expired'"
                        to="/pricing"
                    >
                        <UiButton variant="primary">{{
                            t('billing.settings.upgradeCta')
                        }}</UiButton>
                    </NuxtLink>

                    <!-- Manage billing portal -->
                    <template v-if="billingStore.notConfigured">
                        <p class="text-small text-cream-dim">
                            {{ t('billing.settings.notConfigured') }}
                        </p>
                    </template>
                    <template v-else>
                        <UiButton
                            variant="ghost"
                            :disabled="billing.portal.loading.value"
                            @click="billing.portal.execute()"
                        >
                            <UiSpinner v-if="billing.portal.loading.value" size="sm" />
                            {{ t('billing.settings.manageBilling') }}
                        </UiButton>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useBillingStore } from '@/stores/billing';
import { useBilling } from '@/composables/useBilling';
import { useT } from '@/composables/useT';

definePageMeta({ layout: 'default' });

const { t } = useT();
const billingStore = useBillingStore();
const billing = useBilling();

useSeo({ title: t('billing.settings.seoTitle'), noindex: true });

onMounted(() => billingStore.load());

const sub = computed(() => billingStore.subscription);

const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const statusBadge = computed(() => {
    const status = sub.value?.status;
    if (status === 'active') return { classes: 'bg-green-500/15 text-green-400' };
    if (status === 'trialing') return { classes: 'bg-brand/15 text-brand' };
    if (status === 'past_due') return { classes: 'bg-red-500/15 text-red-400' };
    if (status === 'canceled') return { classes: 'bg-amber-500/15 text-amber-400' };
    return { classes: 'bg-bg-muted text-cream-dim' };
});
</script>
