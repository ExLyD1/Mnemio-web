<template>
    <div class="app-shell flex h-screen overflow-hidden bg-bg-base bg-page-glow text-cream">
        <AppRail class="app-rail hidden md:flex" />
        <div class="app-main flex flex-1 flex-col overflow-hidden">
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
import { useAuthStore } from '@/stores/auth';
import { useBillingStore } from '@/stores/billing';

const billingStore = useBillingStore();
onMounted(() => billingStore.load());

// Public, indexable routes that render in this app-shell layout get the marketing
// footer for crawler-facing internal links — but only for logged-out visitors.
// Authed users keep the clean app shell with no links back to marketing/blog/landing.
const route = useRoute();
const auth = useAuthStore();
const showSeoFooter = computed(
    () =>
        !auth.isAuthenticated && (route.path === '/pricing' || route.path.startsWith('/discover')),
);
</script>
