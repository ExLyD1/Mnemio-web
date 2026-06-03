<template>
    <div class="flex max-w-[40vw] items-center gap-1 overflow-hidden">
        <span
            v-for="i in total"
            :key="i"
            :class="[
                'h-1.5 shrink-0 rounded-full transition-all',
                i - 1 < index
                    ? 'w-4 bg-lavender'
                    : i - 1 === index
                      ? 'w-4 bg-brand-bright'
                      : 'w-2 bg-line',
            ]"
        />
    </div>
</template>

<script setup lang="ts">
defineProps<{ index: number; total: number }>();
</script>
