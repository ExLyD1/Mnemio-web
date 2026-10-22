<template>
    <div
        v-if="!store.notConfigured"
        :class="[
            'text-cream',
            compact
                ? 'rounded-2xl bg-bg-deep p-3.5'
                : 'rounded-[24px] border border-line bg-bg-surface p-6',
            state === 'past_due' ? 'bg-error/10' : '',
        ]"
    >
        <template v-if="state === 'free'">
            <div class="flex flex-wrap items-center justify-between gap-1">
                <p
                    :class="
                        compact
                            ? 'text-[14px] font-bold'
                            : 'text-eyebrow uppercase text-cream-faint'
                    "
                >
                    {{ t(compact ? 'billing.settings.freePlan' : 'billing.subscription.yourPlan') }}
                </p>
                <span v-if="compact" class="text-small text-cream-faint">{{
                    t('billing.subscription.resets')
                }}</span>
            </div>
            <p v-if="!compact" :class="['mt-2 font-display', menu ? 'text-[26px]' : 'text-[36px]']">
                {{ t('billing.subscription.free') }}
            </p>
            <p v-if="sub" class="text-small text-cream-faint">
                {{ t('billing.subscription.ended') }}
            </p>
            <div v-if="used !== undefined && cap !== undefined" class="mt-4">
                <p class="flex flex-wrap justify-between gap-1 text-small">
                    <span>{{ t('billing.subscription.aiToday') }}</span
                    ><span>{{ used }} / {{ cap }}</span>
                </p>
                <div
                    class="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
                    role="meter"
                    :aria-label="t('billing.subscription.aiToday')"
                    :aria-valuenow="used"
                    :aria-valuemin="0"
                    :aria-valuemax="cap"
                >
                    <div
                        class="h-full rounded-full bg-purple"
                        :style="{ width: `${cap > 0 ? Math.min(100, (used / cap) * 100) : 0}%` }"
                    />
                </div>
            </div>
            <BillingButton
                class="mt-4 w-full px-2 text-[14px]"
                @click="billing.checkout.execute('annual')"
                >{{
                    t(
                        compact
                            ? 'billing.subscription.upgradeShort'
                            : 'billing.subscription.upgrade',
                    )
                }}</BillingButton
            >
            <p
                v-if="!compact && prices.amount('monthly') && prices.amount('annual')"
                class="mt-3 text-small text-cream-faint"
            >
                {{
                    text('billing.subscription.prices', {
                        monthly: prices.price('monthly'),
                        annual: prices.price('annual'),
                    })
                }}
            </p>
        </template>
        <template v-else>
            <NuxtLink
                to="/settings/billing"
                class="flex min-h-11 items-center gap-3"
                @click="$emit('navigate')"
            >
                <SharedMimi
                    :pose="
                        state === 'past_due' || state === 'trial_ending'
                            ? 'point'
                            : state === 'paused' || state === 'pause_scheduled'
                              ? 'sleepy'
                              : state === 'cancelled'
                                ? 'wave'
                                : 'neutral'
                    "
                    :size="compact ? (state === 'past_due' ? 44 : 48) : 56"
                    :bob="false"
                />
                <div class="min-w-0">
                    <p v-if="!compact" class="text-eyebrow uppercase text-cream-faint">
                        {{ t('billing.subscription.yourPlan') }}
                    </p>
                    <p
                        :class="[
                            'font-display',
                            compact ? 'text-[18px]' : menu ? 'text-[26px]' : 'text-[36px]',
                            state === 'past_due' ? 'text-error-soft' : '',
                        ]"
                    >
                        {{ state === 'past_due' ? stateLabel : t('billing.subscription.premium') }}
                    </p>
                    <p class="text-small text-cream-faint">
                        {{ !compact && state === 'active' ? plan + ' · ' : '' }}{{ subline }}
                    </p>
                    <p
                        v-if="state !== 'active' && state !== 'past_due'"
                        class="text-small text-cream-faint"
                    >
                        {{ stateLabel }}
                    </p>
                </div>
            </NuxtLink>
            <NuxtLink
                v-if="state === 'past_due'"
                to="/settings/billing?action=update-card"
                class="mt-2 flex min-h-11 items-center justify-center rounded-[14px] border border-line-strong px-3 text-[14px] font-bold"
                @click="$emit('navigate')"
                >{{ t('billing.card.title') }}</NuxtLink
            >
            <NuxtLink
                v-else-if="!compact"
                to="/settings/billing"
                class="mt-4 flex min-h-11 items-center justify-between border-t border-line pt-3 text-[14px] font-bold"
                @click="$emit('navigate')"
                >{{ t('billing.subscription.manage') }} <ArrowRight class="size-4"
            /></NuxtLink>
        </template>
    </div>
</template>
<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
defineProps<{ compact?: boolean; menu?: boolean }>();
defineEmits<{ navigate: [] }>();
const { billing, store, state, sub, stateLabel, subline, plan, used, cap, text } =
    useSubscriptionView();
const { t } = useT();
const prices = usePremiumPrices();
const auth = useAuthStore();
onMounted(() => {
    if (auth.isAuthenticated) {
        void billing.load.execute();
        void billing.usage.execute();
    }
});
</script>
