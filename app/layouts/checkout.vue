<template>
    <div class="min-h-screen bg-bg-base bg-page-glow text-cream">
        <header
            class="flex h-[68px] items-center justify-between gap-3 border-b border-line px-5 md:px-8"
        >
            <NuxtLink to="/dashboard" aria-label="Mnemio"><SharedBrandMark /></NuxtLink
            ><span class="flex items-center gap-2 text-[14px] text-cream-faint"
                ><Lock class="size-4" />{{ t('billing.checkout.secure') }}</span
            >
        </header>
        <main><slot /></main>
    </div>
</template>
<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
const { t } = useT();
</script>
