<template>
    <div ref="root" class="relative w-full">
        <slot
            :value="modelValue"
            :on-input="onInput"
            :on-keydown="onKeydown"
            :on-blur="onBlur"
            :aria-expanded="suggest.open.value"
        />

        <!-- Inline below the field, never teleported -- on mobile this sits
             above the keyboard instead of being hidden behind it. -->
        <div
            v-if="suggest.open.value"
            class="absolute left-0 top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line-strong bg-bg-surface p-1.5 shadow-soft-elevation"
            role="listbox"
            :aria-label="t('card.suggestionsLabel')"
        >
            <button
                v-for="(item, i) in suggest.items.value"
                :key="item"
                type="button"
                role="option"
                :aria-selected="suggest.highlighted.value === i"
                class="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[14px] transition-colors"
                :class="
                    suggest.highlighted.value === i
                        ? 'bg-brand/20 text-cream'
                        : 'text-cream-dim hover:bg-brand/10'
                "
                @mouseenter="suggest.highlighted.value = i"
                @click="accept(item)"
            >
                <span class="truncate">{{ item }}</span>
                <SharedPill v-if="isInDeck(item)" tone="muted" class="shrink-0">
                    {{ t('card.alreadyInDeck') }}
                </SharedPill>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useT } from '@/composables/useT';
import { useWordSuggest } from '@/composables/useWordSuggest';
import { completeWord } from '@/api/lexicon';
import { useAnalytics } from '@/composables/useAnalytics';

const props = withDefaults(
    defineProps<{
        modelValue: string;
        /** Deck's target language (the word being typed) — ISO code, e.g. 'de'. */
        lang: string;
        /** Words already in this deck, for the "already in deck" badge. */
        existingWords?: string[];
        /** Free-form label for analytics' `source` prop (e.g. "card_add"). */
        source?: string;
    }>(),
    { existingWords: () => [], source: 'card_editor' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useT();
const analytics = useAnalytics();
const root = ref<HTMLElement | null>(null);

const suggest = useWordSuggest((q, signal) => completeWord(props.lang, q, signal));

const existingLower = computed(() => new Set(props.existingWords.map((w) => w.toLowerCase())));
const isInDeck = (word: string) => existingLower.value.has(word.toLowerCase());

const onInput = (e: Event) => {
    const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    emit('update:modelValue', value);
    suggest.search(value);
};

const accept = (value: string) => {
    emit('update:modelValue', value);
    analytics.track('card_suggestion_accepted', { kind: 'completion', source: props.source });
    suggest.dismiss();
};

const onKeydown = (e: KeyboardEvent) => {
    const accepted = suggest.onKeydown(e);
    if (accepted) {
        accept(accepted);
    }
};

const onBlur = () => {
    // Let a click on a suggestion register before closing — onClickOutside
    // (below) is the real dismiss path for anything outside this component;
    // this just closes when focus leaves to somewhere else entirely.
    setTimeout(() => suggest.dismiss(), 0);
};

onClickOutside(root, () => suggest.dismiss());
</script>
