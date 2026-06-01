<template>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
            class="h-full rounded-full transition-[width] duration-500 ease-out"
            :class="gradient ? 'bg-progress-cream-lavender' : 'bg-lavender'"
            :style="{ width: `${clamped}%` }"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ value: number; gradient?: boolean }>(), {
    gradient: true,
});

const clamped = computed(() => Math.max(0, Math.min(100, Math.round(props.value))));
</script>
