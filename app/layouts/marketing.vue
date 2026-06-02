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
</script>
