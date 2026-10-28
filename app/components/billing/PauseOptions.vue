<template>
    <div>
        <BillingOptionRow
            :model-value="modelValue"
            :options="options"
            :label="t('billing.pause.title')"
            :disabled="busy"
            @update:model-value="$emit('update:modelValue', $event)"
        />
        <p class="mt-4 text-[14px] text-cream-faint">
            {{ text('billing.pause.note', { date: date(sub?.currentPeriodEnd) }) }}
        </p>
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{ modelValue: 1 | 2 | 3; busy?: boolean }>();
defineEmits<{ 'update:modelValue': [value: 1 | 2 | 3] }>();
const { t } = useT();
const { sub, date, text } = useSubscriptionView();
const options = computed(() =>
    ([1, 2, 3] as const).map((months) => {
        const end = sub.value?.currentPeriodEnd;
        const restart = end ? new Date(end) : null;
        if (restart && Number.isFinite(restart.getTime())) {
            const day = restart.getUTCDate();
            restart.setUTCDate(1);
            restart.setUTCMonth(restart.getUTCMonth() + months);
            const last = new Date(
                Date.UTC(restart.getUTCFullYear(), restart.getUTCMonth() + 1, 0),
            ).getUTCDate();
            restart.setUTCDate(Math.min(day, last));
        }
        return {
            value: months,
            title: text(`billing.pause.months${months}`),
            subtitle: text('billing.pause.restarts', {
                date: date(
                    restart && Number.isFinite(restart.getTime()) ? restart.toISOString() : null,
                ),
            }),
        };
    }),
);
</script>
