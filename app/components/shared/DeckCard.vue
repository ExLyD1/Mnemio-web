<template>
    <NuxtLink :to="to ?? `/decks/${deck.id}`" :class="cardClass">
        <!-- ── Library: book-cover layout ── -->
        <template v-if="variant === 'library'">
            <div class="mb-3 flex items-start">
                <div
                    class="relative flex h-16 w-[50px] shrink-0 items-end rounded-xl p-2"
                    :style="{ background: deck.swatch }"
                >
                    <Layers class="size-5 text-pink-soft/60" />
                    <button
                        v-if="favoritable"
                        type="button"
                        class="absolute -right-1 -top-1 text-pink-soft transition-opacity"
                        :class="deck.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'"
                        :aria-label="
                            deck.favorite ? t('deck.removeFavorite') : t('deck.addFavorite')
                        "
                        @click.prevent.stop="$emit('toggleFav', deck.id)"
                    >
                        <Bookmark
                            class="size-[18px]"
                            :class="
                                deck.favorite
                                    ? 'fill-pink-soft stroke-pink-soft'
                                    : 'fill-none stroke-pink-soft'
                            "
                        />
                    </button>
                </div>
            </div>

            <h3 class="mb-0.5 line-clamp-1 text-base font-bold leading-tight text-cream">
                {{ deck.title }}
            </h3>
            <p class="mb-3.5 text-[12px] text-cream-faint">
                <template v-if="deck.tag">{{ deck.tag }} · </template>{{ cardCountLabel }}
            </p>

            <div class="h-[5px] overflow-hidden rounded-sm bg-white/5">
                <div
                    class="h-full rounded-sm"
                    :style="{
                        width: `${deck.masteredPct}%`,
                        background: 'linear-gradient(90deg, #e3d2c8, #a98ee3)',
                    }"
                />
            </div>
            <div class="mt-2 flex justify-between text-[11px] text-cream-faint">
                <span>{{
                    t('dashboard.mastered').replace('{pct}', String(deck.masteredPct))
                }}</span>
                <span v-if="deck.due > 0" class="text-pink-soft/80">
                    {{ deck.due }} {{ t('dashboard.dueShort') }}
                </span>
            </div>
        </template>

        <!-- ── Recent / Discover: original cover-art layout ── -->
        <template v-else>
            <SharedCoverArt :swatch="deck.swatch" :glyph="deck.glyph" class="aspect-[16/9]">
                <button
                    v-if="favoritable"
                    type="button"
                    class="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-black/30 text-cream backdrop-blur transition-colors hover:bg-black/50"
                    :aria-label="deck.favorite ? t('deck.removeFavorite') : t('deck.addFavorite')"
                    @click.prevent.stop="$emit('toggleFav', deck.id)"
                >
                    <Star
                        class="size-4"
                        :class="deck.favorite ? 'fill-pink-soft text-pink-soft' : ''"
                    />
                </button>
                <span
                    v-if="variant !== 'discover' && deck.due > 0"
                    class="absolute bottom-2.5 left-2.5"
                >
                    <SharedPill tone="due">{{
                        t('dashboard.dueCount').replace('{n}', String(deck.due))
                    }}</SharedPill>
                </span>
            </SharedCoverArt>

            <div class="flex flex-col gap-2 px-2 pb-1">
                <h3 class="line-clamp-1 font-display text-lg text-cream">{{ deck.title }}</h3>
                <p class="flex items-center gap-2 text-small text-brand-muted">
                    <span>{{ cardCountLabel }}</span>
                    <template v-if="deck.tag">
                        <span class="text-brand-muted/60">·</span>
                        <span>{{ deck.tag }}</span>
                    </template>
                </p>

                <template v-if="variant !== 'discover'">
                    <SharedProgressBar :value="deck.masteredPct" class="mt-1" />
                    <p class="text-small text-brand-muted">
                        {{ t('dashboard.mastered').replace('{pct}', String(deck.masteredPct)) }}
                    </p>
                </template>

                <div v-if="variant === 'recent'" class="mt-1 flex gap-2">
                    <UiButton
                        variant="ghost"
                        class="flex-1 !py-2 !text-small"
                        @click.prevent.stop="$emit('addCards', deck.id)"
                    >
                        {{ t('card.addCards') }}
                    </UiButton>
                    <UiButton
                        variant="primary"
                        class="flex-1 !py-2 !text-small"
                        @click.prevent.stop="$emit('practice', deck.id)"
                    >
                        {{ t('dashboard.practice') }}
                    </UiButton>
                </div>

                <div
                    v-else-if="variant === 'discover'"
                    class="mt-1 flex items-center justify-between"
                >
                    <span class="text-small text-brand-muted">{{
                        t('discover.copies').replace('{n}', String(deck.copies ?? 0))
                    }}</span>
                    <span class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <UiButton
                            variant="ghost"
                            class="!px-3 !py-1.5 !text-small"
                            @click.prevent.stop="$emit('preview', deck.id)"
                        >
                            {{ t('discover.preview') }}
                        </UiButton>
                        <UiButton
                            variant="primary"
                            class="!px-3 !py-1.5 !text-small"
                            @click.prevent.stop="$emit('copy', deck.id)"
                        >
                            {{ t('discover.copy') }}
                        </UiButton>
                    </span>
                </div>
            </div>
        </template>
    </NuxtLink>
</template>

<script setup lang="ts">
import { Star, Layers, Bookmark } from 'lucide-vue-next';
import { useT } from '#imports';
import type { DeckCardVM } from '@/types/deck';

const { t } = useT();

const props = withDefaults(
    defineProps<{
        deck: DeckCardVM;
        variant?: 'library' | 'discover' | 'recent';
        favoritable?: boolean;
        to?: string;
    }>(),
    { variant: 'library', favoritable: false },
);

defineEmits<{
    toggleFav: [id: string];
    practice: [id: string];
    addCards: [id: string];
    preview: [id: string];
    copy: [id: string];
}>();

const cardClass = computed(() => [
    'group rounded-[20px] border border-line bg-bg-surface transition-all hover:-translate-y-0.5 hover:border-brand-bright/50',
    props.variant === 'library'
        ? 'flex flex-col p-[22px]'
        : props.variant === 'recent'
          ? 'flex w-[300px] shrink-0 flex-col gap-3 p-3'
          : 'flex flex-col gap-3 p-3',
]);

const cardCountLabel = computed(() => t('deck.cardCount').replace('{n}', String(props.deck.total)));
</script>
