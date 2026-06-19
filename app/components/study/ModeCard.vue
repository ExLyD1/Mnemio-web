<template>
    <button
        type="button"
        class="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-bg-surface p-6 text-left transition-all hover:border-line-strong hover:shadow-lg hover:shadow-brand/10"
        @click="$emit('select')"
    >
        <div class="grid size-10 place-items-center rounded-xl bg-lavender-soft text-lavender">
            <component :is="icon" class="size-5" />
        </div>
        <h3 class="text-h3 font-semibold text-cream">{{ title }}</h3>
        <p class="text-small text-cream-dim">{{ description }}</p>
        <p v-if="meta" class="text-small text-brand-muted">{{ meta }}</p>
        <span class="mt-auto text-eyebrow uppercase text-lavender">{{ t('study.start') }} →</span>
    </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { useT } from '@/composables/useT';

defineProps<{
    icon: Component;
    title: string;
    description: string;
    meta?: string;
}>();
defineEmits<{ select: [] }>();

const { t } = useT();
</script>
