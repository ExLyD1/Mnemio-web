<template>
    <section
        class="mx-auto flex max-w-2xl flex-col items-center gap-8 rounded-3xl border border-line bg-bg-surface p-10 text-center shadow-soft-elevation"
    >
        <div
            class="grid size-16 place-items-center rounded-2xl bg-lavender-soft text-lavender"
        >
            <Trophy class="size-8" />
        </div>

        <div>
            <div class="text-eyebrow uppercase text-cream-faint">{{ t('study.results') }}</div>
            <h1 class="mt-2 font-display text-display-sm text-cream">
                {{ t('study.greatWork') }}
            </h1>
        </div>

        <div class="grid w-full grid-cols-3 gap-3">
            <div class="rounded-2xl bg-bg-surface-2 p-4">
                <p class="text-small text-cream-faint">{{ t('study.accuracy') }}</p>
                <p class="mt-1 font-display text-h1 text-cream">{{ accuracy }}%</p>
            </div>
            <div class="rounded-2xl bg-bg-surface-2 p-4">
                <p class="text-small text-cream-faint">{{ t('study.cardsStudied') }}</p>
                <p class="mt-1 font-display text-h1 text-cream">
                    {{ correct }}<span class="text-small text-cream-faint">/{{ total }}</span>
                </p>
            </div>
            <div class="rounded-2xl bg-bg-surface-2 p-4">
                <p class="text-small text-cream-faint">{{ t('study.xpEarned') }}</p>
                <p class="mt-1 font-display text-h1 text-lavender">+{{ xp }}</p>
            </div>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
            <UiButton variant="primary" @click="$emit('studyAgain')">
                {{ t('study.studyAgain') }}
            </UiButton>
            <UiButton variant="ghost" @click="$emit('backToDeck')">
                {{ t('study.backToDeck') }}
            </UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Trophy } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

const props = defineProps<{
    correct: number;
    total: number;
    xp: number;
}>();
defineEmits<{ studyAgain: []; backToDeck: [] }>();

const { t } = useT();

const accuracy = computed(() => (props.total ? Math.round((props.correct / props.total) * 100) : 0));
</script>
