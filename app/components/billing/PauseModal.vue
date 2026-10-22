<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[34px]"
        :model-value="modelValue"
        :title="t('billing.pause.title')"
        sheet
        :busy="billing.pause.loading.value"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <BillingPauseOptions v-model="months" :busy="billing.pause.loading.value" />
        <template #error
            ><p
                v-if="billing.pause.error.value"
                class="mb-3 w-full text-[14px] text-error-soft"
                role="alert"
            >
                {{ t('billing.error') }}
            </p></template
        >
        <template #footer>
            <BillingButton
                kind="text"
                :disabled="billing.pause.loading.value"
                @click="$emit('update:modelValue', false)"
                >{{ t('billing.checkout.back') }}</BillingButton
            ><BillingButton :busy="billing.pause.loading.value" @click="submit">{{
                t('billing.pause.action', months)
            }}</BillingButton></template
        >
    </UiModal>
</template>
<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { billing, date, text } = useSubscriptionView();
const analytics = useAnalytics();
const toast = useToast();
const months = ref<1 | 2 | 3>(2);
watch(
    () => props.modelValue,
    () => {
        months.value = 2;
        billing.pause.error.value = null;
    },
);
const submit = async () => {
    const result = await billing.pause.execute(months.value);
    if (result) {
        analytics.track('subscription_paused', { months: months.value });
        toast.success(
            text('billing.pause.toast', {
                date: date(result.scheduledChange?.resumeAt ?? result.scheduledChange?.effectiveAt),
            }),
        );
        emit('update:modelValue', false);
    }
};
</script>
