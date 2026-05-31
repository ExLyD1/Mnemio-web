<template>
    <div class="mx-auto max-w-[1240px] px-8">
        <div
            class="flex flex-wrap items-center justify-center gap-x-11 gap-y-3 border-y border-line py-9 opacity-85"
        >
            <span class="text-eyebrow uppercase text-cream-faint">Made for ·</span>
            <div class="flex flex-wrap items-center gap-7 font-display text-[22px] text-cream-dim">
                <template v-for="(item, i) in items" :key="item">
                    <span class="transition-opacity hover:text-cream">{{ item }}</span>
                    <span v-if="i < items.length - 1" class="opacity-70">·</span>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const items = ['Languages', 'Medicine', 'Law', 'Engineering', 'History', 'Music theory'];
</script>
