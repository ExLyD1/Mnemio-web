<template>
    <div>
        <div v-if="items.length" class="divide-y divide-line">
            <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-3 py-4 text-[14px]"
            >
                <div
                    :class="[
                        'min-w-0 flex-1',
                        compact ? '' : 'md:grid md:grid-cols-[140px_minmax(0,1fr)] md:gap-4',
                    ]"
                >
                    <p class="text-cream">{{ date(item.billedAt) }}</p>
                    <p class="mt-1 truncate text-cream-faint md:mt-0">
                        {{
                            item.status === 'trial'
                                ? t('billing.invoices.trial')
                                : `${t('billing.subscription.premium')} · ${item.plan ? t(`billing.settings.plan.${item.plan}`) : ''}`
                        }}<span v-if="!compact" class="ml-2 md:hidden">· {{ status(item) }}</span>
                    </p>
                </div>
                <span
                    class="shrink-0 text-right font-bold text-cream"
                    :class="item.status === 'failed' ? 'text-error-soft' : ''"
                    >{{ money(item) }}</span
                >
                <span
                    :class="[
                        compact
                            ? 'w-12 text-right text-small'
                            : 'hidden w-[90px] text-center md:block',
                        item.status === 'failed'
                            ? 'text-error-soft'
                            : item.status === 'refunded'
                              ? 'text-warn'
                              : 'text-cream-faint',
                    ]"
                    >{{ status(item) }}</span
                >
                <button
                    v-if="!compact && item.hasPdf && item.status !== 'trial'"
                    type="button"
                    class="grid size-11 shrink-0 place-items-center rounded-xl text-cream hover:bg-bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="billing.download.loading.value"
                    :aria-label="t('billing.invoices.download')"
                    @click="
                        selected = item.id;
                        billing.download.execute(item.id);
                    "
                >
                    <UiSpinner
                        v-if="billing.download.loading.value && selected === item.id"
                        size="sm"
                    /><Download v-else class="size-5" />
                </button>
                <span v-else-if="!compact" class="w-11 shrink-0" />
            </div>
        </div>
        <p v-else class="py-6 text-[14px] text-cream-faint">{{ t('billing.invoices.empty') }}</p>
        <p v-if="billing.download.error.value" role="alert" class="mt-3 text-small text-error-soft">
            {{ t('billing.error') }}
        </p>
    </div>
</template>
<script setup lang="ts">
import { Download } from 'lucide-vue-next';
import type { Invoice } from '@/types/billing';
defineProps<{ items: Invoice[]; compact?: boolean }>();
const { t } = useT();
const { billing, date, money } = useSubscriptionView();
const selected = ref('');
const status = (item: Invoice) =>
    item.status === 'trial' ? '—' : t(`billing.invoices.status.${item.status}`);
</script>
