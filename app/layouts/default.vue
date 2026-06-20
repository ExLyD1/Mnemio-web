<template>
    <div class="flex h-screen overflow-hidden bg-bg-base bg-page-glow text-cream">
        <AppRail class="hidden md:flex" />
        <div class="flex flex-1 flex-col overflow-hidden">
            <AppTopbar />
            <SharedSubscriptionBanner />
            <main class="flex-1 overflow-y-auto pb-16 md:pb-0">
                <slot />
                <!-- SEO footer on public, crawlable routes only (the app shell otherwise
                     gives /discover + /pricing no site-wide internal links for crawlers). -->
                <MarketingFooter v-if="showSeoFooter" />
            </main>
        </div>
        <AppBottomTabBar />
        <SharedPremiumGate />
    </div>
</template>

<script setup lang="ts">
import { useBillingStore } from '@/stores/billing';

const billingStore = useBillingStore();
onMounted(() => billingStore.load());

// Public, indexable routes that render in this app-shell layout. They need the
// marketing footer for crawler-facing internal links + crawl equity.
const route = useRoute();
const showSeoFooter = computed(
    () => route.path === '/pricing' || route.path.startsWith('/discover'),
);
</script>
