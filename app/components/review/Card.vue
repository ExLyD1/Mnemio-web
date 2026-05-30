<template>
    <div class="flex flex-col items-center gap-6">
        <p class="text-eyebrow uppercase text-cream-faint">
            {{ deckTitle }}
        </p>

        <div class="w-full" style="perspective: 1400px">
            <div
                tabindex="0"
                role="button"
                :aria-label="flipped ? 'Show front' : 'Show back'"
                class="card relative mx-auto h-[340px] w-full max-w-2xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-lavender"
                :class="{ flipped }"
                @click="$emit('flip')"
                @keydown.space.prevent="$emit('flip')"
            >
                <div class="face front bg-plum-card">
                    <div class="text-eyebrow uppercase text-cream-faint">{{ t('study.front') }}</div>
                    <div class="word">{{ card.word }}</div>
                    <div v-if="card.phonetic" class="text-small text-cream-dim">
                        {{ card.phonetic }}
                    </div>
                </div>
                <div class="face back bg-plum-card-back">
                    <div class="text-eyebrow uppercase text-pink-soft">{{ t('study.back') }}</div>
                    <div class="back-text">{{ card.definition }}</div>
                </div>
            </div>
        </div>

        <div :class="['grid w-full max-w-2xl grid-cols-4 gap-2', { 'pointer-events-none opacity-40': !flipped }]">
            <button
                type="button"
                class="grader bg-error-soft/10 text-error-soft hover:bg-error-soft/20"
                :disabled="!flipped"
                @click="$emit('rate', 'again')"
            >
                <span class="label">{{ t('review.again') }}</span>
                <span class="hint">1 · &lt;10m</span>
            </button>
            <button
                type="button"
                class="grader bg-line/40 text-cream hover:bg-line"
                :disabled="!flipped"
                @click="$emit('rate', 'hard')"
            >
                <span class="label">{{ t('review.hard') }}</span>
                <span class="hint">2 · 1d</span>
            </button>
            <button
                type="button"
                class="grader bg-lavender-soft text-lavender hover:bg-lavender/30"
                :disabled="!flipped"
                @click="$emit('rate', 'good')"
            >
                <span class="label">{{ t('review.good') }}</span>
                <span class="hint">3 · 3d</span>
            </button>
            <button
                type="button"
                class="grader bg-success/10 text-success hover:bg-success/20"
                :disabled="!flipped"
                @click="$emit('rate', 'easy')"
            >
                <span class="label">{{ t('review.easy') }}</span>
                <span class="hint">4 · 6d</span>
            </button>
        </div>

        <p v-if="!flipped" class="text-small text-cream-faint">
            {{ t('review.flipHint') }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/deck';
import type { SrsRating } from '@/types/srs';
import { useT } from '@/composables/useT';

defineProps<{ card: Card; deckTitle: string; flipped: boolean }>();
defineEmits<{ flip: []; rate: [rating: SrsRating] }>();

const { t } = useT();
</script>

<style scoped>
.card {
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(0.6, 0.1, 0.3, 1);
    border-radius: 24px;
}
.card.flipped {
    transform: rotateX(180deg);
}
.face {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 36px 44px;
    backface-visibility: hidden;
    border: 1px solid rgba(227, 210, 200, 0.18);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    gap: 16px;
}
.face.back {
    transform: rotateX(180deg);
}
.word {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    color: #e3d2c8;
    font-size: clamp(36px, 5.5vw, 64px);
    line-height: 1.05;
}
.back-text {
    font-size: clamp(18px, 2.2vw, 26px);
    line-height: 1.4;
    color: #e3d2c8;
    max-width: 40ch;
}
.grader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 12px 8px;
    border-radius: 14px;
    border: 1px solid rgba(227, 210, 200, 0.18);
    font-weight: 600;
    transition: background 0.15s;
}
.grader .label {
    font-size: 14px;
}
.grader .hint {
    font-size: 11px;
    opacity: 0.7;
}
</style>
