<template>
    <div>
        <div class="mb-3">
            <h2 class="font-display text-h2 text-cream">{{ t('dashboard.mostPracticed') }}</h2>
            <p class="mt-0.5 text-small text-brand-muted">{{ t('dashboard.mostPracticedHint') }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="deck in decks"
                :key="deck.id"
                class="group flex flex-col gap-3 rounded-[20px] border border-line bg-bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-brand-bright/50"
            >
                <NuxtLink :to="`/decks/${deck.id}`" class="block">
                    <SharedCoverArt :swatch="deck.swatch" :glyph="deck.glyph" class="aspect-[16/9]">
                        <span v-if="deck.reviewed" class="absolute bottom-2.5 left-2.5">
                            <SharedPill tone="plum">
                                {{
                                    t('dashboard.reviewsCount').replace(
                                        '{n}',
                                        String(deck.reviewed),
                                    )
                                }}
                            </SharedPill>
                        </span>
                    </SharedCoverArt>
                </NuxtLink>

                <div class="flex flex-1 flex-col gap-2 px-2 pb-1">
                    <NuxtLink :to="`/decks/${deck.id}`">
                        <h3 class="line-clamp-1 font-display text-lg text-cream">
                            {{ deck.title }}
                        </h3>
                    </NuxtLink>
                    <p class="text-small text-brand-muted">
                        {{ t('deck.cardCount').replace('{n}', String(deck.total)) }}
                    </p>
                    <SharedProgressBar :value="deck.masteredPct" class="mt-1" />
                    <p class="text-small text-brand-muted">
                        {{ t('dashboard.mastered').replace('{pct}', String(deck.masteredPct)) }}
                    </p>
                    <UiButton
                        variant="primary"
                        class="mt-auto !py-2 !text-small"
                        @click="$emit('practice', deck.id)"
                    >
                        {{ t('dashboard.practice') }}
                    </UiButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DeckCardVM } from '@/types/deck';
import { useT } from '@/composables/useT';

defineProps<{ decks: DeckCardVM[] }>();
defineEmits<{ practice: [id: string] }>();

const { t } = useT();
</script>
