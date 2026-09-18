<template>
    <!-- Client-only: the chosen theme lives in the browser (localStorage), so
         the server can't know which icon to render — a size-matched placeholder
         avoids both a hydration mismatch and a layout shift. -->
    <ClientOnly>
        <button
            type="button"
            class="grid size-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream"
            :aria-label="t('topbar.toggleTheme')"
            :title="t('topbar.toggleTheme')"
            @click="toggleTheme"
        >
            <Moon v-if="colorMode.value === 'dark'" class="size-5" />
            <Sun v-else class="size-5" />
        </button>
        <template #fallback>
            <span class="block size-10" aria-hidden="true" />
        </template>
    </ClientOnly>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
import { useColorMode, useT } from '#imports';

const { t } = useT();
const colorMode = useColorMode();
const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>
