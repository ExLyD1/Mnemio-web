<template>
    <div v-if="banner" :class="['flex items-center gap-3 px-4 py-2 text-small', banner.classes]">
        <span class="flex-1">{{ banner.text }}</span>
        <button
            type="button"
            class="shrink-0 font-semibold underline-offset-2 hover:underline"
            @click="banner.action"
        >
            {{ banner.cta }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { useBillingStore } from '@/stores/billing';
import { useBilling } from '@/composables/useBilling';
import { useT } from '@/composables/useT';

const billingStore = useBillingStore();
const billing = useBilling();
const { t } = useT();
const router = useRouter();

const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const banner = computed(() => {
    const sub = billingStore.subscription;
    if (!sub) return null;

    if (sub.status === 'trialing' && sub.trialEnd) {
        return {
            text: t('banner.trialing').replace('{date}', fmt(sub.trialEnd)),
            cta: t('banner.trialCta'),
            classes: 'bg-brand/10 text-cream border-b border-brand/20',
            action: () => router.push('/pricing'),
        };
    }
    if (sub.status === 'past_due') {
        return {
            text: t('banner.pastDue'),
            cta: t('banner.pastDueCta'),
            classes: 'bg-red-500/10 text-red-300 border-b border-red-500/20',
            action: () => billing.portal.execute(),
        };
    }
    if (sub.status === 'canceled') {
        return {
            text: t('banner.canceled').replace('{date}', fmt(sub.currentPeriodEnd)),
            cta: t('banner.canceledCta'),
            classes: 'bg-amber-500/10 text-amber-300 border-b border-amber-500/20',
            action: () => router.push('/pricing'),
        };
    }
    return null;
});
</script>
