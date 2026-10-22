<template>
    <div class="rounded-2xl bg-bg-deep px-[22px] py-5">
        <p class="text-[11px] font-extrabold uppercase tracking-[.16em] text-cream-faint">
            {{ label }}
        </p>
        <p
            :class="[
                'mt-2 break-words font-display text-[32px] leading-tight tabular-nums md:text-[40px]',
                tone === 'bad' ? 'text-error-soft' : tone === 'warn' ? 'text-warn' : 'text-cream',
            ]"
        >
            {{ value }}
        </p>
        <p v-if="caption" class="mt-1 text-[14px] text-cream-faint">{{ caption }}</p>
    </div>
</template>
<script setup lang="ts">
defineProps<{ label: string; value: string | number; caption?: string; tone?: 'bad' | 'warn' }>();
</script>
