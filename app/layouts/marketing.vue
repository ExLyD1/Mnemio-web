<template>
    <div class="min-h-screen bg-bg-base bg-page-glow text-cream">
        <MarketingNav :current="current" />
        <main>
            <slot />
        </main>
        <MarketingFooter />
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const current = computed(() => route.path.replace('/', ''));

// The Organization + WebSite JSON-LD graph and `<html lang>`/`og:locale` are emitted
// site-wide by app/plugins/02.schema.ts so they also cover the indexable pages that
// render in the `default` (app-shell) layout — not just marketing pages.
</script>
