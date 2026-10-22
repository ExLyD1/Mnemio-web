<template>
    <div
        v-if="!store.notConfigured"
        class="mx-auto max-w-[1160px] px-5 py-8 text-cream md:px-12 md:pb-16 md:pt-[120px]"
    >
        <UiSpinner v-if="billing.load.loading.value && !sub" class="mx-auto" />
        <div v-else-if="billing.load.error.value" role="alert" class="rounded-2xl bg-error/10 p-6">
            {{ t('billing.error')
            }}<BillingButton kind="ghost" class="mt-4" @click="billing.load.execute()">{{
                t('billing.card.retry')
            }}</BillingButton>
        </div>
        <BillingPlanBlock v-else-if="state === 'free'" class="mx-auto max-w-md" />
        <div
            v-else
            class="grid items-start gap-x-12 gap-y-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_500px]"
        >
            <div class="md:pt-6">
                <div class="flex items-end gap-4">
                    <SharedMimi :pose="pose" :size="84" :bob="false" class="md:hidden" />
                    <div>
                        <p
                            :class="[
                                'text-[11px] font-extrabold uppercase tracking-[.16em] md:text-[12px]',
                                state === 'past_due'
                                    ? 'text-error-soft'
                                    : state === 'trial_ending' || state === 'cancelled'
                                      ? 'text-warn'
                                      : 'text-cream-faint',
                            ]"
                        >
                            {{ stateLabel }}
                        </p>
                        <h1
                            class="mt-2 font-display text-[44px] leading-[.95] md:text-[56px] xl:text-[76px]"
                        >
                            {{ t('billing.subscription.premium') }}
                        </h1>
                    </div>
                </div>
                <p
                    class="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-cream-dim md:mt-4 md:text-[17px]"
                >
                    {{ lead }}
                </p>
                <p v-if="sub?.scheduledPlanChange" class="mt-3 text-[14px] text-cream-faint">
                    {{
                        text('billing.switch.scheduled', {
                            plan: t(`billing.settings.plan.${sub.scheduledPlanChange}`),
                            date: date(sub.currentPeriodEnd),
                        })
                    }}
                </p>
            </div>
            <div
                class="relative row-span-3 rounded-[22px] border border-line bg-bg-surface p-4 md:rounded-[24px] md:p-5 xl:p-8"
            >
                <SharedMimi
                    pose="peek-paws"
                    :size="150"
                    :bob="false"
                    class="pointer-events-none absolute bottom-full left-1/2 hidden -translate-x-1/2 translate-y-[14px] md:flex"
                />
                <div class="grid grid-cols-2 gap-2.5 md:gap-3.5">
                    <BillingPlanTile
                        v-for="(tile, index) in tiles"
                        :key="tile.label"
                        v-bind="tile"
                        :class="index > 1 ? 'hidden md:block' : ''"
                    />
                </div>
                <div v-if="sub?.paymentMethod" class="mt-6 border-t border-line pt-6">
                    <BillingCardRow
                        :method="sub.paymentMethod"
                        editable
                        @update="cardOpen = true"
                    />
                </div>
                <div class="mt-5 hidden md:block">
                    <div class="flex items-center justify-between gap-3">
                        <h2
                            class="text-[11px] font-extrabold uppercase tracking-[.16em] text-cream-faint"
                        >
                            {{ t('billing.subscription.history') }}
                        </h2>
                        <NuxtLink
                            to="/settings/billing/invoices"
                            class="inline-flex min-h-11 items-center text-[14px] font-bold"
                            >{{ t('billing.invoices.title') }}</NuxtLink
                        >
                    </div>
                    <BillingInvoiceList :items="store.invoices.slice(0, 3)" compact />
                    <p
                        v-if="billing.invoices.error.value"
                        role="alert"
                        class="text-small text-error-soft"
                    >
                        {{ t('billing.error') }}
                    </p>
                </div>
            </div>
            <div class="flex flex-col gap-3 md:mt-0 md:flex-row md:flex-wrap">
                <template
                    v-if="
                        state === 'cancelled' || state === 'paused' || state === 'pause_scheduled'
                    "
                    ><BillingButton @click="resumeOpen = true">{{
                        t(
                            state === 'cancelled'
                                ? 'billing.subscription.resume'
                                : 'billing.subscription.resumeNow',
                        )
                    }}</BillingButton
                    ><BillingButton
                        v-if="state !== 'cancelled'"
                        kind="ghost"
                        @click="pauseOpen = true"
                        >{{ t('billing.pause.change') }}</BillingButton
                    ><NuxtLink
                        v-else
                        to="/settings/billing/invoices"
                        class="flex min-h-11 items-center justify-center rounded-[14px] border border-line-strong px-6 py-3.5 font-bold"
                        >{{ t('billing.invoices.title') }}</NuxtLink
                    ></template
                >
                <template v-else
                    ><BillingButton v-if="state === 'past_due'" @click="cardOpen = true">{{
                        t('billing.card.title')
                    }}</BillingButton
                    ><BillingButton v-else-if="state === 'trial_ending'" @click="keepPremium">{{
                        t('billing.cancel.keep')
                    }}</BillingButton
                    ><BillingButton v-else-if="state === 'active'" @click="switchOpen = true">{{
                        switchLabel
                    }}</BillingButton
                    ><BillingButton
                        v-if="state === 'trial_ending' && sub?.plan === 'annual'"
                        kind="ghost"
                        @click="switchOpen = true"
                        >{{ t('billing.switch.monthly') }}</BillingButton
                    ><BillingButton
                        kind="ghost"
                        :busy="billing.portal.loading.value"
                        @click="billing.portal.execute()"
                        >{{ t('billing.settings.manageBilling') }}</BillingButton
                    ></template
                >
                <p
                    v-if="billing.portal.error.value"
                    class="w-full text-small text-error-soft"
                    role="alert"
                >
                    {{ t('billing.error') }}
                </p>
            </div>
            <div class="md:hidden">
                <NuxtLink
                    to="/settings/billing/invoices"
                    class="flex min-h-11 items-center justify-between text-[11px] font-extrabold uppercase tracking-[.16em] text-cream-faint"
                    >{{ t('billing.subscription.history') }}<ArrowRight class="size-4" /></NuxtLink
                ><BillingInvoiceList :items="store.invoices.slice(0, 3)" compact />
            </div>
            <div v-if="canCancel" class="md:mt-4">
                <button
                    type="button"
                    class="min-h-11 text-[15px] font-bold underline underline-offset-4"
                    @click="cancelOpen = true"
                >
                    {{ t('billing.cancel.action') }}
                </button>
                <p class="mt-1 text-[14px] text-cream-faint">
                    {{
                        text(
                            sub?.status === 'trialing'
                                ? 'billing.cancel.trialCaption'
                                : 'billing.cancel.caption',
                            { date: date(boundary) },
                        )
                    }}
                </p>
            </div>
        </div>
        <BillingCancelFlow v-model="cancelOpen" /><BillingPauseModal
            v-model="pauseOpen"
        /><BillingResumeModal v-model="resumeOpen" /><BillingSwitchPlanModal
            v-model="switchOpen"
            :target="sub?.plan === 'annual' ? 'monthly' : 'annual'"
        /><BillingUpdateCardModal v-model="cardOpen" />
    </div>
</template>
<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import type { MimiPose } from '@/types/mimi';
import { daysUntil } from '@/utils/subscriptionState';
definePageMeta({ layout: 'default' });
const { t } = useT();
const view = useSubscriptionView();
const {
    billing,
    store,
    sub,
    state,
    stateLabel,
    price,
    plan,
    date,
    money,
    text,
    boundary,
    days,
    used,
    premium,
    now,
    card,
} = view;
const prices = usePremiumPrices();
const decks = useDecks();
const route = useRoute();
const cancelOpen = ref(false);
const pauseOpen = ref(false);
const resumeOpen = ref(false);
const switchOpen = ref(false);
const cardOpen = ref(false);
const pose = computed<MimiPose>(() =>
    state.value === 'past_due' || state.value === 'trial_ending'
        ? 'point'
        : state.value === 'cancelled'
          ? 'wave'
          : ['paused', 'pause_scheduled'].includes(state.value)
            ? 'sleepy'
            : 'cheer',
);
const canCancel = computed(() => ['active', 'trialing', 'trial_ending'].includes(state.value));
const keepPremium = () =>
    useToast().success(text('billing.subscription.keepToast', { date: date(boundary.value) }));
const switchLabel = computed(() =>
    sub.value?.plan === 'annual'
        ? t('billing.switch.monthly')
        : [t('billing.switch.annual'), prices.saveLabel.value].filter(Boolean).join(' · '),
);
const lead = computed(() => {
    const s = sub.value;
    const values = {
        plan: plan.value,
        price: price.value,
        date: date(boundary.value),
        grace: date(s?.pastDue?.graceEndsAt),
        retry: date(s?.pastDue?.nextRetryAt),
        resume: date(view.resumeAt.value),
        months: view.pauseMonths.value ?? '—',
        card: card.value,
    };
    const key =
        state.value === 'trialing'
            ? 'trialing'
            : state.value === 'trial_ending'
              ? 'trialEnding'
              : state.value === 'past_due'
                ? 'pastDue'
                : state.value === 'cancelled'
                  ? 'cancelled'
                  : state.value === 'paused'
                    ? 'paused'
                    : state.value === 'pause_scheduled'
                      ? view.pauseMonths.value
                          ? 'pauseScheduledMonths'
                          : 'pauseScheduled'
                      : 'active';
    if (state.value === 'past_due') values.date = date(s?.pastDue?.failedAt);
    return (
        text(`billing.subscription.lead.${key}`, values) +
        (state.value === 'past_due' && s?.pastDue?.nextRetryAt
            ? ` ${text('billing.subscription.retryNote', values)}`
            : '')
    );
});
const tiles = computed(() => {
    const s = sub.value;
    const charge = {
        label: t('billing.subscription.nextCharge'),
        value: price.value,
        caption: date(s?.currentPeriodEnd),
    };
    const deck = {
        label: t('billing.subscription.decks'),
        value: decks.store.total,
        caption: t('billing.subscription.decksStay'),
    };
    const ai = {
        label: t('billing.subscription.ai'),
        value: premium.value ? t('billing.subscription.noLimit') : (view.cap.value ?? '—'),
        caption:
            used.value === undefined ? '' : text('billing.subscription.today', { n: used.value }),
    };
    if (state.value === 'past_due')
        return [
            {
                label: t('billing.subscription.amountDue'),
                value: money(s?.pastDue),
                tone: 'bad' as const,
                caption: date(s?.pastDue?.failedAt),
            },
            {
                label: t('billing.subscription.premiumEnds'),
                value: text('billing.subscription.days', {
                    n: daysUntil(s?.pastDue?.graceEndsAt, now.value),
                }),
                caption: date(s?.pastDue?.graceEndsAt),
            },
            { label: t('billing.subscription.nextRetry'), value: date(s?.pastDue?.nextRetryAt) },
            deck,
        ];
    if (state.value === 'cancelled')
        return [
            {
                label: t('billing.subscription.premiumEnds'),
                value: text('billing.subscription.days', { n: days.value }),
                caption: date(boundary.value),
                tone: 'warn' as const,
            },
            { ...charge, value: t('billing.subscription.none'), caption: '' },
            ai,
            deck,
        ];
    if (state.value === 'paused' || state.value === 'pause_scheduled')
        return [
            {
                label: t('billing.subscription.pauseStarts'),
                value: date(s?.scheduledChange?.effectiveAt ?? s?.currentPeriodEnd),
            },
            {
                label: t('billing.subscription.billingRestarts'),
                value: date(view.resumeAt.value),
            },
            { ...charge, caption: date(view.resumeAt.value) },
            deck,
        ];
    if (s?.status === 'trialing')
        return [
            {
                label: t('billing.subscription.trialEndsIn'),
                value: text('billing.subscription.days', { n: days.value }),
                caption: date(boundary.value),
                tone: state.value === 'trial_ending' ? ('warn' as const) : undefined,
            },
            {
                ...charge,
                label: t('billing.subscription.firstCharge'),
                caption: date(boundary.value),
            },
            ai,
            deck,
        ];
    return [
        charge,
        {
            label: t('billing.subscription.daysLeft'),
            value: days.value,
            caption: text('billing.subscription.periodDays', {
                n: s
                    ? Math.max(
                          0,
                          Math.round(
                              (Date.parse(s.currentPeriodEnd) - Date.parse(s.currentPeriodStart)) /
                                  86400000,
                          ),
                      )
                    : 0,
            }),
        },
        ai,
        deck,
    ];
});
watch(
    () => route.query.action,
    (action) => {
        if (
            action === 'update-card' &&
            store.loaded &&
            !store.notConfigured &&
            sub.value &&
            state.value !== 'free'
        )
            cardOpen.value = true;
    },
    { immediate: true },
);
onMounted(async () => {
    await billing.load.execute();
    if (store.notConfigured) return;
    if (route.query.action === 'update-card' && sub.value && state.value !== 'free')
        cardOpen.value = true;
    await Promise.all([
        billing.usage.execute(),
        billing.invoices.execute(),
        decks.fetchList.execute({ cursor: null, append: false }),
    ]);
});
useSeo({ title: t('billing.subscription.nav'), description: t('seo.appDesc'), noindex: true });
</script>
