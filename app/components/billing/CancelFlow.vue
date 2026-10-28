<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[34px]"
        :model-value="modelValue"
        :title="title"
        :sheet="step === 'pause' ? true : 'full'"
        :busy="busy"
        size="md"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #overline>
            <div v-if="step !== 'pause'" class="mb-5 flex items-center gap-4">
                <button
                    v-if="step !== 3"
                    type="button"
                    class="grid size-11 shrink-0 place-items-center rounded-xl text-cream md:hidden"
                    :disabled="busy"
                    :aria-label="t('billing.checkout.back')"
                    @click="step === 1 ? close() : (step = 1)"
                >
                    <ArrowLeft class="size-5" />
                </button>
                <div class="flex w-[90px] gap-1.5 md:w-[120px]" :aria-label="step + ' / 3'">
                    <span
                        v-for="n in 3"
                        :key="n"
                        :class="[
                            'h-1 flex-1 rounded-full',
                            n <= Number(step) ? 'bg-purple' : 'bg-line',
                        ]"
                    />
                </div>
            </div>
            <p v-if="step === 1" class="mb-2 text-eyebrow uppercase text-cream-faint">
                {{ t('billing.cancel.eyebrow') }}
            </p>
        </template>
        <template #title
            ><span
                :class="[
                    'flex items-end gap-3',
                    step === 3 ? 'flex-col items-center text-center' : '',
                ]"
                ><SharedMimi v-if="step === 3" pose="wave" :size="120" :bob="false" /><SharedMimi
                    v-if="step === 2"
                    pose="sleepy"
                    :size="76"
                    class="shrink-0"
                    :bob="false"
                /><span>{{
                    step === 2 ? text('billing.cancel.changesDate', { date: date(endDate) }) : title
                }}</span></span
            ></template
        >
        <Transition name="step" mode="out-in">
            <div :key="step" class="text-cream">
                <template v-if="step === 1">
                    <p class="mb-5 text-[15px] text-cream-dim">
                        {{ t('billing.cancel.reasonBody') }}
                    </p>
                    <BillingOptionRow
                        :model-value="reason"
                        :options="options"
                        :label="t('billing.cancel.reasonTitle')"
                        @update:model-value="selectReason"
                    />
                    <label class="mt-4 block text-small text-cream-faint"
                        >{{ t('billing.cancel.feedback')
                        }}<textarea
                            v-model="feedback"
                            maxlength="500"
                            rows="3"
                            class="mt-2 w-full resize-y rounded-xl border border-line-strong bg-bg-deep p-3 text-body text-cream focus:outline-none focus:ring-2 focus:ring-purple"
                        />
                    </label>
                    <p class="text-right text-small text-cream-faint">
                        {{ feedback.length }} / 500
                    </p>
                </template>
                <template v-else-if="step === 2">
                    <div class="mt-5 flex flex-col gap-5">
                        <div
                            v-if="!wasTrial"
                            :class="[
                                'rounded-2xl bg-bg-deep p-4',
                                offerFirst ? 'order-first' : 'order-last',
                            ]"
                        >
                            <p class="font-bold">{{ t('billing.cancel.breakTitle') }}</p>
                            <p class="mt-1 text-[14px] text-cream-dim">
                                {{ t('billing.cancel.breakBody') }}
                            </p>
                            <BillingButton
                                kind="ghost"
                                class="mt-3 w-full"
                                @click="step = 'pause'"
                                >{{ t('billing.cancel.pauseInstead') }}</BillingButton
                            >
                        </div>
                        <ul class="space-y-4 text-[15px]">
                            <li class="flex gap-3">
                                <Minus class="size-5 shrink-0 text-error-soft" />
                                <div>
                                    <p>
                                        {{
                                            freeCap === undefined
                                                ? t('billing.cancel.aiGeneric')
                                                : text('billing.cancel.ai', { freeCap })
                                        }}
                                    </p>
                                    <p
                                        v-if="used !== undefined"
                                        class="mt-1 text-[14px] text-cream-faint"
                                    >
                                        {{ text('billing.cancel.used', { n: used }) }}
                                    </p>
                                </div>
                            </li>
                            <li class="flex gap-3">
                                <Minus class="size-5 shrink-0 text-error-soft" />
                                <div>
                                    <p>{{ t('billing.cancel.stats') }}</p>
                                    <p class="mt-1 text-[14px] text-cream-faint">
                                        {{ t('billing.cancel.statsNote') }}
                                    </p>
                                </div>
                            </li>
                            <li class="flex gap-3">
                                <Minus class="size-5 shrink-0 text-error-soft" />
                                <div>
                                    <p>{{ t('billing.cancel.support') }}</p>
                                    <p class="mt-1 text-[14px] text-cream-faint">
                                        {{ t('billing.cancel.supportNote') }}
                                    </p>
                                </div>
                            </li>
                            <li class="flex gap-3">
                                <Check class="size-5 shrink-0 text-success" />{{
                                    t('billing.cancel.decks', decks.total)
                                }}
                            </li>
                        </ul>
                    </div>
                </template>
                <template v-else-if="step === 3">
                    <p class="mt-4 text-center text-[15px] text-cream-dim">
                        {{
                            text(
                                wasTrial ? 'billing.cancel.trialDone' : 'billing.cancel.doneBody',
                                { date: date(endDate), email: auth.user?.email ?? '' },
                            )
                        }}
                    </p>
                </template>
                <BillingPauseOptions v-else v-model="months" :busy="busy" />
            </div>
        </Transition>
        <template #error
            ><p
                v-if="error"
                class="mb-3 w-full text-[14px] text-error-soft"
                role="alert"
                aria-live="polite"
            >
                {{ t('billing.error') }}
            </p></template
        >
        <template #footer>
            <template v-if="step === 1"
                ><BillingButton kind="text" @click="close">{{
                    t('billing.cancel.keep')
                }}</BillingButton
                ><BillingButton :disabled="!reason" @click="advance">{{
                    t('billing.cancel.continue')
                }}</BillingButton></template
            >
            <template v-else-if="step === 2"
                ><BillingButton kind="danger" :busy="busy" @click="cancel">{{
                    t('billing.cancel.action')
                }}</BillingButton
                ><BillingButton :disabled="busy" @click="close">{{
                    t('billing.cancel.keep')
                }}</BillingButton></template
            >
            <template v-else-if="step === 3"
                ><BillingButton kind="text" :busy="busy" @click="resume">{{
                    t('billing.subscription.resume')
                }}</BillingButton
                ><BillingButton :disabled="busy" @click="close">{{
                    t('billing.cancel.done')
                }}</BillingButton></template
            >
            <template v-else
                ><BillingButton kind="text" :disabled="busy" @click="step = 2">{{
                    t('billing.checkout.back')
                }}</BillingButton
                ><BillingButton :busy="busy" @click="pause">{{
                    t('billing.pause.action', months)
                }}</BillingButton></template
            >
        </template>
    </UiModal>
</template>
<script setup lang="ts">
import { ArrowLeft, Check, Minus } from 'lucide-vue-next';
import type { CancelReason } from '@/types/billing';
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { billing, sub, date, text, used, freeCap } = useSubscriptionView();
const analytics = useAnalytics();
const toast = useToast();
const auth = useAuthStore();
const decks = useDecksStore();
const step = ref<1 | 2 | 3 | 'pause'>(1);
const reason = ref<CancelReason | null>(null);
const feedback = ref('');
const months = ref<1 | 2 | 3>(2);
const wasTrial = ref(false);
const endDate = ref<string | null>(null);
const error = ref(false);
const finished = ref(false);
const busy = computed(
    () =>
        billing.cancel.loading.value || billing.pause.loading.value || billing.resume.loading.value,
);
const title = computed(() =>
    t(
        step.value === 1
            ? 'billing.cancel.reasonTitle'
            : step.value === 2
              ? 'billing.cancel.changesTitle'
              : step.value === 3
                ? wasTrial.value
                    ? 'billing.cancel.trialTitle'
                    : 'billing.cancel.doneTitle'
                : 'billing.pause.title',
    ),
);
const offerFirst = computed(() => reason.value === 'too_expensive' || reason.value === 'not_using');
const options = computed(() =>
    (
        [
            'too_expensive',
            'not_using',
            'free_enough',
            'missing_feature',
            'not_working',
            'other',
        ] as const
    ).map((value) => ({ value, title: t(`billing.cancel.reasons.${value}`) })),
);
const selectReason = (value: CancelReason) => {
    reason.value = value;
    analytics.track('cancel_reason_selected', { reason: value });
};
const advance = () => {
    step.value = 2;
    if (!wasTrial.value) analytics.track('pause_offered', {});
};
const close = () => {
    if (!busy.value) emit('update:modelValue', false);
};
const cancel = async () => {
    if (!reason.value || busy.value) return;
    error.value = false;
    const result = await billing.cancel.execute({
        reason: reason.value,
        ...(feedback.value.trim() ? { feedback: feedback.value.trim() } : {}),
    });
    if (result) {
        finished.value = true;
        step.value = 3;
    } else error.value = true;
};
const pause = async () => {
    error.value = false;
    const result = await billing.pause.execute(months.value);
    if (result) {
        finished.value = true;
        analytics.track('subscription_paused', { months: months.value });
        toast.success(
            text('billing.pause.toast', { date: date(result.scheduledChange?.resumeAt) }),
        );
        close();
    } else error.value = true;
};
const resume = async () => {
    error.value = false;
    if (await billing.resume.execute()) {
        analytics.track('subscription_resumed', { from: 'cancelled' });
        toast.success(t('billing.resume.toast'));
        close();
    } else error.value = true;
};
watch(
    () => props.modelValue,
    (open, previous) => {
        if (open) {
            step.value = 1;
            reason.value = null;
            feedback.value = '';
            error.value = false;
            finished.value = false;
            wasTrial.value = sub.value?.status === 'trialing';
            endDate.value =
                (wasTrial.value ? sub.value?.trialEnd : sub.value?.currentPeriodEnd) ?? null;
            analytics.track('cancel_flow_started', {});
        } else if (previous && !finished.value)
            analytics.track('cancel_flow_abandoned', {
                step: step.value === 'pause' ? 2 : step.value,
            });
    },
);
</script>
<style scoped>
.step-enter-active,
.step-leave-active {
    transition: opacity 150ms ease;
}
.step-enter-from,
.step-leave-to {
    opacity: 0;
}
</style>
