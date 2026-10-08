<template>
    <div
        v-if="suggest.open.value && definitionEmpty"
        class="mt-2 flex flex-wrap items-center gap-2"
    >
        <span class="text-[12px] text-cream-faint">{{ t('card.suggestTranslation') }}:</span>
        <button
            v-for="item in suggest.items.value"
            :key="item"
            type="button"
            class="rounded-full border border-line-strong px-3 py-1.5 text-[13px] text-cream-dim transition-colors hover:border-brand-muted hover:text-cream"
            @click="accept(item)"
        >
            {{ item }}
        </button>
        <button
            type="button"
            class="text-[12px] text-cream-faint underline-offset-2 hover:underline"
            @click="suggest.dismiss()"
        >
            {{ t('card.suggestDismiss') }}
        </button>
    </div>
    <p
        v-else-if="suggest.loading.value && definitionEmpty"
        class="mt-2 text-[12px] text-cream-faint"
    >
        {{ t('card.mimiThinking') }}
    </p>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useT } from '@/composables/useT';
import { useWordSuggest } from '@/composables/useWordSuggest';
import { translateTerm } from '@/api/lexicon';
import { useAnalytics } from '@/composables/useAnalytics';

/**
 * Suggested translation for a card's definition field while it's still
 * empty (#7). Never overwrites what the user already typed — the host must
 * pass `definitionEmpty`, and this stays silent the moment it's false.
 */
const props = withDefaults(
    defineProps<{
        /** The term just typed — what to translate. */
        term: string;
        /** Deck's target language (the term's own language). */
        from: string;
        /** Deck's source language (the definition's language). */
        to: string;
        definitionEmpty: boolean;
        source?: string;
    }>(),
    { source: 'card_editor' },
);

const emit = defineEmits<{ accept: [value: string] }>();

const { t } = useT();
const analytics = useAnalytics();

// Translation suggestions are coarser-grained than word completion — wait
// for the term to settle rather than firing on every keystroke.
const suggest = useWordSuggest((q, signal) => translateTerm(props.from, props.to, q, signal), {
    minLength: 2,
    debounceMs: 400,
});

watch(
    () => props.term,
    (term) => {
        if (!props.definitionEmpty) {
            suggest.dismiss();
            return;
        }
        suggest.search(term);
    },
);

watch(
    () => props.definitionEmpty,
    (empty) => {
        if (!empty) {
            suggest.dismiss();
        }
    },
);

const accept = (value: string) => {
    emit('accept', value);
    analytics.track('card_suggestion_accepted', { kind: 'translation', source: props.source });
    suggest.dismiss();
};
</script>
