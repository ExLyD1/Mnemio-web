<template>
    <div class="flex h-screen overflow-hidden bg-bg-base bg-page-glow text-cream">
        <AppRail />
        <div class="flex flex-1 flex-col overflow-hidden">
            <AppTopbar />
            <SharedSubscriptionBanner />
            <main class="flex-1 overflow-y-auto">
                <slot />
            </main>
        </div>
        <SharedPremiumGate />
    </div>
</template>

<script setup lang="ts">
import { useBillingStore } from '@/stores/billing';

const billingStore = useBillingStore();
onMounted(() => billingStore.load());
</script>
