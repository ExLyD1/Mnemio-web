<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[34px]"
        :model-value="modelValue"
        :title="t('billing.resume.title')"
        sheet
        :busy="billing.resume.loading.value"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <p class="text-[15px] text-cream-dim">
            {{ t(sub?.status === 'paused' ? 'billing.resume.pausedBody' : 'billing.resume.body') }}
        </p>
        <div class="mt-5 rounded-2xl bg-bg-deep p-5">
            <BillingSummaryLine
                v-if="sub?.status === 'paused'"
                :label="t('billing.checkout.dueToday')"
                :value="price"
            />
            <BillingSummaryLine
                :label="
                    t(
                        sub?.status === 'paused'
                            ? 'billing.resume.recurring'
                            : 'billing.subscription.nextCharge',
                    )
                "
                :value="
                    sub?.status === 'paused' ? price : `${price} · ${date(sub?.currentPeriodEnd)}`
                "
            /><BillingCardRow :method="sub?.paymentMethod ?? null" />
        </div>
        <template #error
            ><p
                v-if="billing.resume.error.value"
                class="mb-3 w-full text-[14px] text-error-soft"
                role="alert"
            >
                {{ t('billing.error') }}
            </p></template
        >
        <template #footer>
            <BillingButton
                kind="text"
                :disabled="billing.resume.loading.value"
                @click="$emit('update:modelValue', false)"
                >{{ t('billing.resume.notNow') }}</BillingButton
            ><BillingButton :busy="billing.resume.loading.value" @click="submit">{{
                t('billing.resume.action')
            }}</BillingButton></template
        >
    </UiModal>
</template>
<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { billing, sub, price, date } = useSubscriptionView();
const analytics = useAnalytics();
const toast = useToast();
watch(
    () => props.modelValue,
    () => {
        billing.resume.error.value = null;
    },
);
const submit = async () => {
    const from =
        sub.value?.status === 'paused' || sub.value?.scheduledChange?.action === 'pause'
            ? 'paused'
            : 'cancelled';
    if (await billing.resume.execute()) {
        analytics.track('subscription_resumed', { from });
        toast.success(t('billing.resume.toast'));
        emit('update:modelValue', false);
    }
};
</script>
