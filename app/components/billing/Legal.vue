<template>
    <p class="text-[13px] leading-relaxed text-cream-faint">
        {{ t('billing.checkout.legal') }}
        <NuxtLink to="/terms" class="underline">{{ t('billing.checkout.terms') }}</NuxtLink
        >. <NuxtLink to="/refunds" class="underline">{{ t('billing.checkout.refunds') }}</NuxtLink
        >: {{ t('billing.checkout.refundNote') }}
    </p>
</template>
<script setup lang="ts">
const { t } = useT();
</script>
