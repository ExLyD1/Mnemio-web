<template>
    <div class="mx-auto max-w-md">
        <div class="mb-4 flex items-center justify-between text-small text-brand-muted">
            <span>Card {{ Math.min(index + 1, deck.length) }} of {{ deck.length }}</span>
            <button type="button" class="transition-colors hover:text-cream" @click="restart">
                Restart
            </button>
        </div>

        <div v-if="!done" class="w-full" style="perspective: 1400px">
            <div
                class="demo relative aspect-[3/2] w-full cursor-pointer"
                :class="{ flipped }"
                role="button"
                tabindex="0"
                @click="flipped = !flipped"
                @keydown.space.prevent="flipped = !flipped"
            >
                <div class="face front rounded-2xl border border-line-strong bg-plum-card p-7">
                    <SharedPill tone="plum">{{ current.lang }}</SharedPill>
                    <p class="font-display text-4xl text-cream">{{ current.front }}</p>
                    <span class="text-small text-brand-muted">Tap to flip</span>
                </div>
                <div class="face back rounded-2xl border border-brand-bright bg-plum-card-back p-7">
                    <SharedPill tone="muted">{{ current.tag }}</SharedPill>
                    <p class="text-xl leading-snug text-cream">{{ current.back }}</p>
                </div>
            </div>

            <div class="mt-5 grid grid-cols-3 gap-2">
                <button
                    type="button"
                    class="rounded-xl border border-error-soft/40 py-2.5 text-small font-semibold text-error-soft transition-colors hover:bg-error-soft/10"
                    @click="rate(false)"
                >
                    Forgot
                </button>
                <button
                    type="button"
                    class="rounded-xl border border-line-strong py-2.5 text-small font-semibold text-brand-pale transition-colors hover:bg-white/[0.04]"
                    @click="rate(false)"
                >
                    Hard
                </button>
                <button
                    type="button"
                    class="rounded-xl border border-success/50 py-2.5 text-small font-semibold text-success-bright transition-colors hover:bg-success/10"
                    @click="rate(true)"
                >
                    Easy
                </button>
            </div>
        </div>

        <div
            v-else
            class="flex flex-col items-center gap-4 rounded-2xl border border-line bg-bg-surface p-8 text-center"
        >
            <SharedMimi :size="96" />
            <p class="font-display text-h2 text-cream">{{ score }}% recalled</p>
            <p class="text-body text-cream-dim">
                That’s how a real session feels — calm and quick.
            </p>
            <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                Start for real
            </UiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { SAMPLE_DECK } from '@/composables/useSampleDeck';

const deck = SAMPLE_DECK;
const index = ref(0);
const flipped = ref(false);
const correct = ref(0);
const done = ref(false);

const current = computed(() => deck[index.value] ?? deck[0]!);
const score = computed(() => Math.round((correct.value / deck.length) * 100));

const rate = (good: boolean) => {
    if (good) {
        correct.value += 1;
    }
    flipped.value = false;
    if (index.value >= deck.length - 1) {
        done.value = true;
    } else {
        index.value += 1;
    }
};

const restart = () => {
    index.value = 0;
    flipped.value = false;
    correct.value = 0;
    done.value = false;
};
</script>

<style scoped>
.demo {
    transform-style: preserve-3d;
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.demo.flipped {
    transform: rotateY(180deg);
}
.face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
    backface-visibility: hidden;
}
.back {
    transform: rotateY(180deg);
}
</style>
