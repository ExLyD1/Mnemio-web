<template>
    <div class="relative overflow-hidden rounded-2xl" :style="{ background: swatch }">
        <div
            class="absolute inset-0 bg-[radial-gradient(120%_90%_at_22%_8%,rgba(255,255,255,0.07),transparent_60%)] dark:bg-[radial-gradient(120%_90%_at_22%_8%,rgba(255,255,255,0.12),transparent_60%)]"
        />
        <span
            v-if="glyph"
            class="absolute inset-0 grid select-none place-items-center font-display text-5xl text-on-color/80"
        >
            {{ glyph }}
        </span>
        <slot />
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ swatch: string; glyph?: string }>(), { glyph: '' });
</script>
