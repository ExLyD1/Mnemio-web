<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[34px]"
        :model-value="modelValue"
        :title="t('billing.card.title')"
        sheet
        :busy="busy"
        @update:model-value="close"
    >
        <div class="rounded-2xl bg-bg-deep p-4">
            <BillingCardRow :method="sub?.paymentMethod ?? null" />
        </div>
        <p v-if="sub?.pastDue" class="my-5 text-[15px] text-cream-dim">
            {{
                text('billing.card.payNote', {
                    price: money(sub.pastDue),
                    date: date(sub.pastDue.failedAt),
                })
            }}
        </p>
        <p class="mt-4 text-[14px] text-cream-dim">
            {{
                sub?.pastDue
                    ? text('billing.card.savePay', { price: money(sub.pastDue) })
                    : t('billing.card.save')
            }}
        </p>
        <UiSpinner
            v-if="
                billing.paymentMethodTxn.loading.value ||
                billing.inlineCheckout.loading.value ||
                refreshing
            "
            class="mx-auto my-8"
        />
        <div v-if="unavailable" class="mt-4 rounded-2xl bg-error/10 p-4" role="alert">
            <p>{{ t('billing.checkout.unavailable') }}</p>
            <a href="mailto:hello@mnemio.xyz" class="inline-flex min-h-11 items-center underline">{{
                t('premiumGate.ctaContact')
            }}</a>
        </div>
        <div :class="frameTarget" />
        <template #error
            ><p v-if="error" class="mb-3 w-full text-[14px] text-error-soft" role="alert">
                {{ t('billing.error') }}
            </p></template
        >
        <template #footer>
            <BillingButton kind="text" :disabled="busy" @click="close(false)">{{
                t('billing.switch.dismiss')
            }}</BillingButton
            ><BillingButton v-if="error && !unavailable" @click="open">{{
                t('billing.card.retry')
            }}</BillingButton></template
        >
    </UiModal>
</template>
<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { billing, sub, money, date, text, store } = useSubscriptionView();
const analytics = useAnalytics();
const toast = useToast();
const frameTarget = `payment-frame-${useId().replaceAll(':', '')}`;
const refreshing = ref(false);
const busy = computed(
    () =>
        refreshing.value ||
        billing.paymentProcessing.value ||
        billing.paymentMethodTxn.loading.value ||
        billing.inlineCheckout.loading.value,
);
const refreshError = ref(false);
let generation = 0;
const unavailable = computed(
    () => billing.paddleFailed.value || !!billing.inlineCheckout.error.value,
);
const error = computed(
    () =>
        refreshError.value ||
        !!billing.paymentMethodTxn.error.value ||
        !!billing.paymentError.value,
);
const close = (value: boolean) => {
    if (!busy.value) emit('update:modelValue', value);
};
const open = async () => {
    const id = ++generation;
    refreshError.value = false;
    const context = sub.value?.status ?? 'subscription';
    const transaction = await billing.paymentMethodTxn.execute();
    if (!transaction || id !== generation || !props.modelValue) return;
    await nextTick();
    await billing.inlineCheckout.execute({
        transactionId: transaction.transactionId,
        frameTarget,
        onComplete: async () => {
            const before = JSON.stringify([sub.value?.paymentMethod, sub.value?.pastDue]);
            refreshing.value = true;
            let changed = false;
            const deadline = Date.now() + 15000;
            while (id === generation && Date.now() < deadline) {
                store.invalidate();
                await billing.load.execute();
                if (id !== generation) return;
                if (
                    !billing.load.error.value &&
                    JSON.stringify([sub.value?.paymentMethod, sub.value?.pastDue]) !== before
                ) {
                    changed = true;
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 1500));
            }
            if (id !== generation) return;
            refreshing.value = false;
            if (!changed) store.invalidate();
            analytics.track('payment_method_updated', { context });
            if (changed) toast.success(t('billing.card.toast'));
            else toast.info(t('billing.card.pending'));
            emit('update:modelValue', false);
        },
    });
};
watch(
    () => props.modelValue,
    async (value) => {
        if (value) {
            await nextTick();
            await open();
        } else {
            generation++;
            billing.closeCheckout();
        }
    },
);
onScopeDispose(() => {
    generation++;
});
</script>
