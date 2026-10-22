<template>
    <div
        v-if="banner && !store.notConfigured"
        :class="[
            'flex items-center gap-3 border-b px-5 py-3 text-[14px] md:px-8 md:text-[15px]',
            banner.bad
                ? 'border-error/20 bg-error/10 text-error-soft'
                : 'border-line bg-bg-surface-2 text-warn',
        ]"
    >
        <TriangleAlert v-if="banner.bad" class="size-5 shrink-0" /><Clock
            v-else
            class="size-5 shrink-0"
        />
        <span class="flex-1">{{ banner.text }}</span
        ><NuxtLink
            :to="banner.to"
            class="inline-flex min-h-11 shrink-0 items-center font-bold underline underline-offset-4"
            >{{ banner.cta }}</NuxtLink
        >
    </div>
</template>
<script setup lang="ts">
import { Clock, TriangleAlert } from 'lucide-vue-next';
const { t } = useT();
const { store, sub, state, date, text } = useSubscriptionView();
const banner = computed(() => {
    if (state.value === 'trial_ending')
        return {
            bad: false,
            text: text('banner.trialing', { date: date(sub.value?.trialEnd) }),
            cta: t('banner.trialCta'),
            to: '/settings/billing',
        };
    if (state.value === 'past_due')
        return {
            bad: true,
            text: text('billing.subscription.paymentBanner', {
                card: sub.value?.paymentMethod
                    ? `${sub.value.paymentMethod.brand} •••• ${sub.value.paymentMethod.last4}`
                    : '',
                date: date(sub.value?.pastDue?.failedAt),
                grace: date(sub.value?.pastDue?.graceEndsAt),
            }),
            cta: t('billing.card.title'),
            to: '/settings/billing?action=update-card',
        };
    return null;
});
</script>
