<template>
    <div
        v-if="!store.notConfigured"
        class="mx-auto max-w-[960px] px-5 py-8 text-cream md:px-12 md:py-12"
    >
        <NuxtLink
            to="/settings/billing"
            class="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-cream-dim"
            ><ChevronLeft class="size-4" />{{ t('billing.subscription.nav') }}</NuxtLink
        >
        <h1 class="mt-5 font-display text-[40px] leading-none md:text-[56px]">
            {{ t('billing.invoices.title') }}
        </h1>
        <div class="mt-8 rounded-[24px] border border-line bg-bg-surface px-5 md:px-8">
            <div
                class="hidden grid-cols-[140px_minmax(0,1fr)_110px_90px_44px] gap-4 border-b border-line py-5 text-[11px] font-extrabold uppercase tracking-[.16em] text-cream-faint md:grid"
            >
                <span>{{ t('billing.invoices.date') }}</span
                ><span>{{ t('billing.invoices.item') }}</span
                ><span class="text-right">{{ t('billing.invoices.amount') }}</span
                ><span class="text-center">{{ t('billing.invoices.statusLabel') }}</span
                ><span />
            </div>
            <UiSpinner v-if="billing.invoices.loading.value" class="mx-auto my-8" />
            <BillingInvoiceList v-else :items="store.invoices" />
            <p v-if="billing.invoices.error.value" class="py-4 text-error-soft" role="alert">
                {{ t('billing.error') }}
                <button class="min-h-11 underline" @click="billing.invoices.execute()">
                    {{ t('billing.card.retry') }}
                </button>
            </p>
        </div>
        <p class="mt-6 max-w-[70ch] text-[14px] leading-relaxed text-cream-faint">
            {{ t('billing.invoices.note') }}
            <a href="mailto:hello@mnemio.xyz" class="underline">hello@mnemio.xyz</a>.
        </p>
    </div>
</template>
<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
definePageMeta({ layout: 'default' });
const { t } = useT();
const { billingStore: store, ...billing } = useBilling();
onMounted(async () => {
    await billing.load.execute();
    if (!store.notConfigured) await billing.invoices.execute();
});
useSeo({ title: t('billing.invoices.title'), description: t('seo.appDesc'), noindex: true });
</script>
