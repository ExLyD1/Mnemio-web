<template>
    <div class="w-full max-w-3xl" style="perspective: 1600px">
        <div
            class="fc relative mx-auto min-h-[380px] w-full cursor-pointer outline-none"
            :class="{ flipped: revealed }"
            role="button"
            tabindex="0"
            :aria-label="revealed ? t('study.showFront') : t('study.revealAnswer')"
            @click="$emit('flip')"
        >
            <div
                class="face front rounded-[24px] border border-line-strong bg-plum-card p-10 shadow-flash-card"
            >
                <StudyLangPill :lang="card.lang" :region="card.region" />
                <p class="fc-word font-display text-cream">{{ card.word }}</p>
                <span class="flex items-center gap-2 text-small text-brand-muted">
                    <StudyKeycap label="Space" /> {{ t('study.toReveal') }}
                </span>
            </div>

            <div
                class="face back rounded-[24px] border border-brand-bright bg-plum-card-back p-8 shadow-flash-card"
            >
                <div class="grid h-full gap-6 sm:grid-cols-[42%_1fr]">
                    <div class="flex flex-col gap-3 text-left sm:border-r sm:border-line sm:pr-6">
                        <StudyLangPill :lang="card.lang" :region="card.region" />
                        <p class="font-display text-4xl text-cream">{{ card.word }}</p>
                        <p v-if="card.reading" class="text-body text-brand-pale">
                            {{ card.reading }}
                        </p>
                        <UiTooltip :content="t('study.audioComingSoon')" side="top">
                            <button
                                type="button"
                                disabled
                                class="inline-flex w-fit items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-small text-brand-muted opacity-60"
                            >
                                <Volume2 class="size-4" /> {{ t('study.listen') }}
                            </button>
                        </UiTooltip>
                        <SharedPill v-if="card.pos" tone="muted" class="w-fit">
                            {{ card.pos }}
                        </SharedPill>
                    </div>
                    <div class="flex flex-col gap-4 text-left">
                        <div>
                            <p class="text-eyebrow uppercase text-brand-muted">
                                {{ t('study.meaning') }}
                            </p>
                            <p class="mt-1 text-xl text-cream">{{ card.meaning }}</p>
                        </div>
                        <div v-if="card.example">
                            <p class="text-eyebrow uppercase text-brand-muted">
                                {{ t('study.inContext') }}
                            </p>
                            <p class="mt-1 italic text-cream/90">{{ card.example }}</p>
                            <p class="mt-1 text-small text-brand-muted">
                                {{ card.exampleTranslation }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Volume2 } from 'lucide-vue-next';
import { useT } from '@/composables/useT';
import type { StudyCard } from '@/utils/studyCard';

defineProps<{ card: StudyCard; revealed: boolean }>();
defineEmits<{ flip: [] }>();

const { t } = useT();
</script>

<style scoped>
.fc {
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fc.flipped {
    transform: rotateY(180deg);
}
.face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    backface-visibility: hidden;
}
.front {
    align-items: center;
    justify-content: center;
    gap: 18px;
    text-align: center;
}
.back {
    transform: rotateY(180deg);
}
.fc-word {
    font-size: clamp(40px, 7vw, 88px);
    line-height: 1.02;
}
</style>
