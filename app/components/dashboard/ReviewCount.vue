<template>
    <div
        class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg-surface p-5"
    >
        <div class="flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl bg-pink-soft/20 text-pink-soft">
                <Flame class="size-5" />
            </div>
            <div>
                <p class="text-small text-cream-dim">{{ t('dashboard.dueLabel') }}</p>
                <p class="font-display text-h1 text-cream">{{ dueCount }}</p>
            </div>
        </div>
        <UiButton variant="ghost" @click="navigateTo('/review')">
            {{ dueCount > 0 ? t('dashboard.reviewNow') : t('dashboard.reviewOpen') }}
        </UiButton>
    </div>
</template>

<script setup lang="ts">
import { Flame } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

defineProps<{ dueCount: number }>();

const { t } = useT();
</script>
