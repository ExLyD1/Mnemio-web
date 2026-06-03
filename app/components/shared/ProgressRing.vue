<template>
    <div
        class="relative grid place-items-center"
        :style="{ width: `${size}px`, height: `${size}px` }"
    >
        <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
            <circle
                :cx="center"
                :cy="center"
                :r="radius"
                fill="none"
                stroke="currentColor"
                class="text-line"
                :stroke-width="stroke"
            />
            <circle
                :cx="center"
                :cy="center"
                :r="radius"
                fill="none"
                stroke="currentColor"
                class="text-lavender"
                :stroke-width="stroke"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="offset"
            />
        </svg>
        <div class="absolute text-center">
            <p class="font-display text-3xl leading-none text-cream">{{ clamped }}%</p>
            <p v-if="label" class="mt-1 text-small text-brand-muted">{{ label }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{ pct: number; size?: number; stroke?: number; label?: string }>(),
    { size: 156, stroke: 12, label: '' },
);

const clamped = computed(() => Math.max(0, Math.min(100, Math.round(props.pct))));
const center = computed(() => props.size / 2);
const radius = computed(() => props.size / 2 - props.stroke / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const offset = computed(() => circumference.value * (1 - clamped.value / 100));
</script>
