<template>
    <div class="flex flex-col items-center gap-6">
        <div class="w-full" style="perspective: 1400px">
            <div
                ref="cardEl"
                tabindex="0"
                role="button"
                :aria-label="flipped ? t('study.showFront') : t('study.showBack')"
                class="card relative mx-auto h-[360px] w-full max-w-2xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-lavender"
                :class="{ flipped }"
                @click="$emit('flip')"
                @keydown.space.prevent="$emit('flip')"
                @keydown.enter.prevent="$emit('flip')"
            >
                <div class="face front bg-plum-card">
                    <div class="text-eyebrow uppercase text-cream-faint">{{ t('study.front') }}</div>
                    <div class="word">{{ card.word }}</div>
                    <div v-if="card.phonetic" class="text-small text-cream-dim">
                        {{ card.phonetic }}
                    </div>
                    <div class="text-small text-cream-faint">
                        {{ t('study.tapToFlip') }}
                    </div>
                </div>
                <div class="face back bg-plum-card-back">
                    <div class="text-eyebrow uppercase text-pink-soft">{{ t('study.back') }}</div>
                    <div class="back-text">{{ card.definition }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/deck';
import { useT } from '@/composables/useT';

defineProps<{ card: Card; flipped: boolean }>();
defineEmits<{ flip: [] }>();

const cardEl = ref<HTMLElement | null>(null);
const { t } = useT();

onMounted(() => {
    cardEl.value?.focus();
});
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
    padding: 40px 48px;
    backface-visibility: hidden;
    border: 1px solid rgba(227, 210, 200, 0.18);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4);
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
    font-size: clamp(40px, 6vw, 72px);
    line-height: 1.05;
}
.back-text {
    font-size: clamp(20px, 2.4vw, 28px);
    line-height: 1.4;
    color: #e3d2c8;
    max-width: 40ch;
}
</style>
