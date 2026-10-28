<template>
    <div v-if="method" class="flex min-w-0 items-center gap-3">
        <span
            class="grid h-8 min-w-12 shrink-0 place-items-center rounded-md bg-bg-surface-2 px-1 text-[11px] font-extrabold text-cream"
            >{{ brand }}</span
        >
        <div class="min-w-0 flex-1">
            <p class="text-[15px] font-bold text-cream">•••• {{ method.last4 }}</p>
            <p
                :class="[
                    'text-small',
                    method.declineReason ? 'text-error-soft' : 'text-cream-faint',
                ]"
            >
                {{
                    method.declineReason
                        ? t(`billing.card.decline.${declineKey(method.declineReason)}`)
                        : expiry
                }}
            </p>
        </div>
        <button
            v-if="editable"
            type="button"
            class="min-h-11 font-bold text-cream underline-offset-4 hover:underline"
            @click="$emit('update')"
        >
            {{ t('billing.card.update') }}
        </button>
    </div>
</template>
<script setup lang="ts">
import type { Subscription } from '@/types/billing';
import { declineKey } from '@/utils/subscriptionState';
const props = defineProps<{ method: Subscription['paymentMethod']; editable?: boolean }>();
defineEmits<{ update: [] }>();
const { t } = useT();
const brand = computed(
    () =>
        ({ mastercard: 'MC', american_express: 'AMEX' })[props.method?.brand.toLowerCase() ?? ''] ??
        props.method?.brand.toUpperCase(),
);
const expiry = computed(() =>
    props.method?.expMonth && props.method.expYear
        ? t('billing.card.expires').replace(
              '{date}',
              `${String(props.method.expMonth).padStart(2, '0')} / ${props.method.expYear}`,
          )
        : '—',
);
</script>
