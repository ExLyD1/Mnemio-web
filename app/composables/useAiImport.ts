import { ref, computed } from 'vue';
import { useDecks, useToast, useT } from '#imports';
import { enrichWords, type AiDraftCard, type EnrichWordsResult } from '@/api/ai';
import { bulkAddCards } from '@/api/cards';
import type { CardInput } from '@/types/deck';

/** A draft card plus a per-row include toggle for the review step. */
export type ReviewRow = AiDraftCard & { include: boolean };

export interface AiImportTarget {
    id: string;
    sourceLanguage: string;
    targetLanguage: string;
}

export interface UseAiImportOptions {
    /** Reactive getter for the target deck (append mode) or null/undefined (create mode). */
    deck: () => AiImportTarget | null | undefined;
    /** Called after cards are appended to an existing deck. */
    onAppended?: () => void;
    /** Called after a brand-new deck is created. */
    onCreated?: (deckId: string) => void;
}

/**
 * Shared AI word-import flow (paste → enrich → review → commit), used by both the
 * modal (`AiImportDialog`) and the docked deck-page panel (`AiImportPanel`).
 */
export const useAiImport = (opts: UseAiImportOptions) => {
    const { create } = useDecks();
    const toast = useToast();
    const { t } = useT();

    const step = ref<'input' | 'review'>('input');
    const rawWords = ref('');
    const newTitle = ref('');
    const newSrc = ref('en');
    const newTgt = ref('en');
    const context = ref('');
    const rows = ref<ReviewRow[]>([]);
    const meta = ref<EnrichWordsResult['meta'] | null>(null);
    const loading = ref(false);
    const committing = ref(false);
    const error = ref('');

    const rowTone = (row: ReviewRow): string => {
        if (!row.include) {
            return 'border-line bg-bg-surface-2 opacity-50';
        }
        return row.definition.trim()
            ? 'border-line bg-bg-surface-2'
            : 'border-error-soft/60 bg-error-soft/5';
    };

    const parseWords = (): string[] => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const raw of rawWords.value.split(/[\n,]+/)) {
            const w = raw.trim();
            if (!w) {
                continue;
            }
            const key = w.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            out.push(w);
            if (out.length >= 100) {
                break;
            }
        }
        return out;
    };

    const parsedCount = computed(() => parseWords().length);
    const committableCount = computed(
        () => rows.value.filter((r) => r.include && r.definition.trim().length > 0).length,
    );
    const unfilledCount = computed(
        () => rows.value.filter((r) => r.include && !r.definition.trim()).length,
    );

    const reset = () => {
        step.value = 'input';
        rawWords.value = '';
        newTitle.value = '';
        context.value = '';
        rows.value = [];
        meta.value = null;
        loading.value = false;
        committing.value = false;
        error.value = '';
    };

    const effectiveLangs = () => {
        const deck = opts.deck();
        return {
            source: deck?.sourceLanguage ?? newSrc.value,
            target: deck?.targetLanguage ?? newTgt.value,
        };
    };

    const onEnrich = async () => {
        const words = parseWords();
        if (!words.length) {
            error.value = t('ai.emptyWords');
            return;
        }
        error.value = '';
        loading.value = true;
        try {
            const { source, target } = effectiveLangs();
            const res = await enrichWords({
                words,
                sourceLanguage: source,
                targetLanguage: target,
                context: context.value.trim() || undefined,
            });
            rows.value = res.cards.map((c) => ({ ...c, include: c.definition.trim().length > 0 }));
            meta.value = res.meta;
            step.value = 'review';
        } catch (e) {
            error.value = (e as { message?: string }).message ?? t('ai.enrichError');
        } finally {
            loading.value = false;
        }
    };

    const toCardInput = (r: AiDraftCard): CardInput => ({
        word: r.word,
        definition: r.definition.trim(),
        phonetic: r.phonetic ?? null,
        partOfSpeech: r.partOfSpeech ?? null,
        example: r.example ?? null,
        exampleTranslation: r.exampleTranslation ?? null,
        tags: r.tags,
        difficulty: r.difficulty,
    });

    const onCommit = async () => {
        const cards = rows.value
            .filter((r) => r.include && r.definition.trim().length > 0)
            .map(toCardInput);
        if (!cards.length) {
            error.value = t('ai.noCommittable');
            return;
        }
        error.value = '';
        committing.value = true;
        try {
            const deck = opts.deck();
            if (deck) {
                await bulkAddCards(deck.id, cards);
                toast.success(t('ai.added').replace('{n}', String(cards.length)));
                opts.onAppended?.();
                reset();
                return;
            }
            const title = newTitle.value.trim();
            if (!title) {
                error.value = t('ai.needTitle');
                return;
            }
            const created = await create.execute({
                title,
                description: null,
                sourceLanguage: newSrc.value,
                targetLanguage: newTgt.value,
            });
            if (!created) {
                error.value = create.error.value?.message ?? t('ai.enrichError');
                return;
            }
            await bulkAddCards(created.id, cards);
            toast.success(t('ai.added').replace('{n}', String(cards.length)));
            reset();
            opts.onCreated?.(created.id);
        } catch (e) {
            error.value = (e as { message?: string }).message ?? t('ai.enrichError');
        } finally {
            committing.value = false;
        }
    };

    return {
        step,
        rawWords,
        newTitle,
        newSrc,
        newTgt,
        context,
        rows,
        meta,
        loading,
        committing,
        error,
        parsedCount,
        committableCount,
        unfilledCount,
        rowTone,
        reset,
        onEnrich,
        onCommit,
    };
};
