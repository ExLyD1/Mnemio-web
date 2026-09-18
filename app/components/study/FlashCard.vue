<template>
    <div class="w-full max-w-3xl">
        <div
            class="fc relative mx-auto w-full cursor-pointer outline-none"
            :class="{ flipped: revealed }"
            role="button"
            tabindex="0"
            :aria-label="revealed ? t('study.showFront') : t('study.revealAnswer')"
            @click="$emit('flip')"
        >
            <!-- The unrevealed face is `card-dark`, which is a LIGHT lavender
                 gradient in light mode, so its ink stays on the cream ladder. -->
            <div
                class="face front absolute inset-0 rounded-[24px] border border-line-strong bg-plum-card p-6 shadow-flash-card sm:p-10"
            >
                <p class="fc-word break-words font-display text-cream">{{ card.word }}</p>
            </div>

            <!-- The revealed face is the plum card gradient in BOTH themes, so all
                 of its ink comes from the on-plum ladder (cream would be dark ink
                 on plum in light mode). Hairlines are on-plum too, not `line`. -->
            <div
                class="face back relative min-h-[260px] rounded-[24px] border border-on-plum/25 bg-card-plum p-5 text-on-plum shadow-flash-card sm:min-h-[340px] sm:p-8"
            >
                <div class="grid h-full gap-4 sm:gap-6 sm:grid-cols-[42%_1fr]">
                    <div
                        class="flex flex-col gap-2 text-left sm:border-r sm:border-on-plum/20 sm:pr-6"
                    >
                        <div
                            class="flex flex-wrap items-baseline gap-2"
                            :class="reserveTopRight ? 'pr-28 sm:pr-0' : ''"
                        >
                            <p class="break-words font-display text-2xl text-on-plum sm:text-4xl">
                                {{ card.word }}
                            </p>
                            <SharedPill v-if="card.pos" tone="on-plum">
                                {{ card.pos }}
                            </SharedPill>
                        </div>
                        <p v-if="card.reading" class="break-words text-body text-on-plum-dim">
                            {{ card.reading }}
                        </p>
                        <button
                            v-if="card.audioUrl"
                            type="button"
                            class="inline-flex w-fit items-center gap-1.5 rounded-full border border-on-plum/25 px-3 py-1.5 text-small text-on-plum-dim transition-colors hover:border-on-plum/50 hover:text-on-plum"
                        >
                            <Volume2 class="size-4" /> {{ t('study.listen') }}
                        </button>
                    </div>
                    <div
                        class="flex flex-col gap-4 text-left"
                        :class="reserveTopRight ? 'sm:pt-9' : ''"
                    >
                        <div>
                            <p class="text-eyebrow uppercase text-on-plum-faint">
                                {{ t('study.meaning') }}
                            </p>
                            <p class="mt-1 break-words text-lg text-on-plum sm:text-xl">
                                {{ card.meaning }}
                            </p>
                        </div>
                        <div v-if="card.example">
                            <p class="text-eyebrow uppercase text-on-plum-faint">
                                {{ t('study.inContext') }}
                            </p>
                            <p class="mt-1 italic text-on-plum-dim">{{ card.example }}</p>
                            <p class="mt-1 text-small text-on-plum-dim">
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

// reserveTopRight: the parent overlays a button in the card's top-right corner
// (the review page's "Tip" button) — keep the word / part-of-speech pill and
// the meaning column clear of it (QA (1) #1: the "noun" pill sat under it).
defineProps<{ card: StudyCard; revealed: boolean; reserveTopRight?: boolean }>();
defineEmits<{ flip: [] }>();

const { t } = useT();
</script>

<style scoped>
.face {
    display: flex;
    flex-direction: column;
}
/*
 * The back is the in-flow height driver (position: relative) so the card grows
 * to fit its content and never clips on small screens. The front is the absolute
 * overlay that fades out as the back's gradient mask sweeps in.
 */
.front {
    position: absolute;
    inset: 0;
    align-items: center;
    justify-content: center;
    gap: 18px;
    text-align: center;
    /* Front softly dissolves out as the back sweeps in. */
    transition: opacity 0.45s ease 0.1s;
}
.fc.flipped .front {
    opacity: 0;
}

/*
 * The back is unveiled by a soft diagonal gradient mask that sweeps across the
 * card — replacing the old 3D flip with a smooth gradient reveal. The opaque
 * band of the mask slides in from the right; its gentle edge is the "gradient".
 *
 * `#000` here is a MASK channel, not ink — it means "fully opaque" and is
 * theme-independent by definition. Deliberately not tokenised.
 */
.back {
    -webkit-mask-image: linear-gradient(115deg, #000 0 38%, transparent 62% 100%);
    mask-image: linear-gradient(115deg, #000 0 38%, transparent 62% 100%);
    -webkit-mask-size: 300% 100%;
    mask-size: 300% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: 110% 0;
    mask-position: 110% 0;
    transition:
        -webkit-mask-position 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
        mask-position 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fc.flipped .back {
    -webkit-mask-position: 0 0;
    mask-position: 0 0;
}
.fc-word {
    font-size: clamp(26px, 6vw, 64px);
    line-height: 1.05;
    overflow-wrap: anywhere;
    hyphens: auto;
}

@media (prefers-reduced-motion: reduce) {
    /* No sweep — fall back to a plain cross-fade. */
    .front {
        transition: opacity 0.2s ease;
    }
    .back {
        -webkit-mask-image: none;
        mask-image: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .fc.flipped .back {
        opacity: 1;
    }
}
</style>
