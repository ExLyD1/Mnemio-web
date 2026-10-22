<template>
    <UiModal
        heading-class="font-display text-[30px] leading-tight text-cream md:text-[34px]"
        :model-value="modelValue"
        :title="text('billing.switch.title', { plan: t(`billing.settings.plan.${target}`) })"
        sheet
        :busy="billing.changePlan.loading.value"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <p class="mb-5 text-[15px] text-cream-dim">{{ comparison }}</p>
        <BillingOptionRow
            v-model="when"
            :options="options"
            :label="t('billing.switch.when')"
            :disabled="billing.changePlan.loading.value"
        />
        <div class="mt-5 rounded-2xl bg-bg-deep p-5" aria-live="polite">
            <UiSpinner v-if="previewing" class="mx-auto" />
            <template v-else-if="preview"
                ><BillingSummaryLine
                    :label="t(`billing.settings.plan.${target}`)"
                    :value="money(preview.newPrice)"
                /><BillingSummaryLine
                    :label="t('billing.switch.credit')"
                    :value="money({ ...preview.credit, amount: -Math.abs(preview.credit.amount) })"
                />
                <div class="mt-2 border-t border-line pt-2">
                    <BillingSummaryLine
                        :label="t('billing.checkout.dueToday')"
                        :value="money(preview.dueToday)"
                    />
                </div>
                <p class="mt-2 text-[14px] text-cream-faint">
                    {{ text('billing.subscription.renews', { date: date(preview.nextBilledAt) }) }}
                    · {{ card }}
                </p></template
            >
        </div>
        <template #error
            ><p
                v-if="error || billing.changePlan.error.value"
                class="mb-3 w-full text-[14px] text-error-soft"
                role="alert"
            >
                {{ t('billing.error') }}
            </p></template
        >
        <template #footer>
            <BillingButton
                kind="text"
                :disabled="billing.changePlan.loading.value"
                @click="$emit('update:modelValue', false)"
                >{{ t('billing.switch.dismiss') }}</BillingButton
            ><BillingButton
                :disabled="previewing || !preview || !!error"
                :busy="billing.changePlan.loading.value"
                @click="submit"
                >{{
                    when === 'now'
                        ? text('billing.switch.pay', { price: money(preview?.dueToday) })
                        : text('billing.switch.onDate', { date: date(sub?.currentPeriodEnd) })
                }}</BillingButton
            ></template
        >
    </UiModal>
</template>
<script setup lang="ts">
import type { BillingPlan, ChangePreview } from '@/types/billing';
const props = defineProps<{ modelValue: boolean; target: BillingPlan }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { billing, sub, text, date, money, card } = useSubscriptionView();
const analytics = useAnalytics();
const toast = useToast();
const when = ref<'now' | 'renewal'>('now');
const preview = shallowRef<ChangePreview | null>(null);
const previewing = ref(false);
const error = ref(false);
let generation = 0;
const comparison = computed(() => {
    const current = sub.value?.price;
    return props.target === 'annual' &&
        sub.value?.plan === 'monthly' &&
        current &&
        preview.value &&
        current.currency === preview.value.newPrice.currency
        ? text('billing.switch.comparison', {
              price: money(preview.value.newPrice),
              previous: money({ ...current, amount: current.amount * 12 }),
          })
        : t('billing.switch.body');
});
const options = computed(() => [
    ...(props.target === 'annual' && sub.value?.status !== 'trialing'
        ? [
              {
                  value: 'now' as const,
                  title: t('billing.switch.now'),
                  subtitle: t('billing.switch.creditNote'),
              },
          ]
        : []),
    {
        value: 'renewal' as const,
        title: text('billing.switch.onDate', { date: date(sub.value?.currentPeriodEnd) }),
        subtitle: t('billing.switch.noCharge'),
    },
]);
const requestPreview = async () => {
    const id = ++generation;
    preview.value = null;
    error.value = false;
    if (!props.modelValue) {
        previewing.value = false;
        return;
    }
    previewing.value = true;
    const result = await billing.previewChange.execute({ plan: props.target, when: when.value });
    if (id !== generation) return;
    previewing.value = false;
    if (result) {
        preview.value = result;
        analytics.track('plan_change_previewed', { to: props.target, when: when.value });
    } else error.value = true;
};
watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            when.value =
                props.target === 'monthly' || sub.value?.status === 'trialing' ? 'renewal' : 'now';
            billing.changePlan.error.value = null;
        }
    },
);
watch([() => props.modelValue, when, () => props.target], requestPreview, { flush: 'post' });
onScopeDispose(() => {
    generation++;
});
const submit = async () => {
    if (!preview.value || previewing.value || error.value || billing.changePlan.loading.value)
        return;
    const plan = props.target;
    const submittedWhen = when.value;
    const result = await billing.changePlan.execute({ plan, when: submittedWhen });
    if (result) {
        analytics.track('plan_changed', { to: plan, when: submittedWhen });
        toast.success(text('billing.switch.toast', { plan: t(`billing.settings.plan.${plan}`) }));
        emit('update:modelValue', false);
    }
};
</script>
