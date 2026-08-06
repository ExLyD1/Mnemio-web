import { ref, computed } from 'vue';
import { useDecks, useToast, useT } from '#imports';
import { streamDeckFromImage, type DeckDraftHeader } from '@/api/ai';
import type { StreamError } from '@/utils/sse';
import { bulkAddCards } from '@/api/cards';
import { useAuthStore } from '@/stores/auth';
import { usePremiumGateStore } from '@/stores/premiumGate';
import { useAnalytics } from '@/composables/useAnalytics';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import { normCategory } from '@/utils/deckCategories';
import type { ReviewRow } from '@/composables/useAiImport';
import type { CardInput } from '@/types/deck';

export type ImageDeckStep = 'input' | 'streaming' | 'review';
export type RefineHint = 'more' | 'harder' | 'examples';

/** Accepted image MIME types (mirrors AI_IMAGE_UNSUPPORTED_TYPE on the server). */
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
/** 5 MB — mirrors AI_IMAGE_MAX_BYTES default. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * "Вчися з будь-чого" — drives the create-page image→deck flow: pick an image,
 * stream extracted cards in as they arrive, edit/delete them, then commit a new
 * deck. Modeled on `useAiImport` (review + create) but sourced from the vision
 * endpoint over SSE. One instance per dialog.
 */
export const useImageDeck = (opts: { onCreated?: (deckId: string) => void } = {}) => {
    const { create, store } = useDecks();
    const toast = useToast();
    const { t } = useT();
    const auth = useAuthStore();
    const premiumGate = usePremiumGateStore();
    const analytics = useAnalytics();
    const notifications = useAchievementNotifications();

    const step = ref<ImageDeckStep>('input');
    const file = ref<File | null>(null);
    const previewUrl = ref<string | null>(null);
    const header = ref<DeckDraftHeader | null>(null);
    const rows = ref<ReviewRow[]>([]);
    const count = ref(12);
    const targetLanguage = ref<string>('');
    const note = ref<'no_text' | null>(null);
    const error = ref('');
    const committing = ref(false);

    let controller: AbortController | null = null;

    const committableCount = computed(
        () => rows.value.filter((r) => r.include && r.definition.trim().length > 0).length,
    );
    const unfilledCount = computed(
        () => rows.value.filter((r) => r.include && !r.definition.trim()).length,
    );

    const rowTone = (row: ReviewRow): string => {
        if (!row.include) {
            return 'border-line bg-bg-surface-2 opacity-50';
        }
        return row.definition.trim()
            ? 'border-line bg-bg-surface-2'
            : 'border-error-soft/60 bg-error-soft/5';
    };

    const revokePreview = () => {
        if (previewUrl.value) {
            URL.revokeObjectURL(previewUrl.value);
            previewUrl.value = null;
        }
    };

    const reset = () => {
        controller?.abort();
        controller = null;
        revokePreview();
        step.value = 'input';
        file.value = null;
        header.value = null;
        rows.value = [];
        note.value = null;
        error.value = '';
        committing.value = false;
    };

    /**
     * Validate + stage a chosen file. Returns a friendly error message string on
     * rejection (so callers can toast/inline it), or null on success.
     */
    const setFile = (f: File | null): string | null => {
        if (!f) {
            return null;
        }
        if (!ALLOWED_TYPES.includes(f.type)) {
            return t('image.errUnsupportedType');
        }
        if (f.size > MAX_BYTES) {
            return t('image.errTooLarge');
        }
        revokePreview();
        file.value = f;
        previewUrl.value = URL.createObjectURL(f);
        note.value = null;
        error.value = '';
        return null;
    };

    const handleStreamError = (e: StreamError) => {
        if (e.code === 'AI_BUDGET_EXCEEDED' && !auth.isPremium) {
            const cap = (e.details as { capPerDay?: number } | undefined)?.capPerDay;
            premiumGate.show('ai_budget', cap !== undefined ? { capPerDay: cap } : undefined);
            error.value = '';
        } else {
            // AI_IMAGE_* and provider errors get a friendly, code-keyed message.
            error.value = t(`image.err.${e.code}`, t('image.errGeneric'));
        }
        step.value = 'input';
    };

    const runStream = async (instructions?: string) => {
        const img = file.value;
        if (!img) {
            error.value = t('image.errNoFile');
            return;
        }
        error.value = '';
        note.value = null;
        header.value = null;
        rows.value = [];
        step.value = 'streaming';
        controller = new AbortController();

        const startedAt = Date.now();
        analytics.track('ai_feature_started', {
            ai_feature: 'deck_from_image',
            context: 'deck_create',
        });

        await streamDeckFromImage(
            {
                image: img,
                count: count.value,
                targetLanguage: targetLanguage.value.trim() || undefined,
                instructions,
            },
            {
                onHeader: (deck) => {
                    header.value = deck;
                },
                onCard: ({ card }) => {
                    // Progressive render — push each card as it streams in.
                    rows.value.push({ ...card, include: card.definition.trim().length > 0 });
                },
                onDone: (e) => {
                    note.value = e.note ?? (rows.value.length ? null : 'no_text');
                    step.value = 'review';
                    analytics.track('ai_feature_completed', {
                        ai_feature: 'deck_from_image',
                        context: 'deck_create',
                        result_size: rows.value.length,
                        duration_ms: Date.now() - startedAt,
                    });
                },
                onError: handleStreamError,
            },
            controller.signal,
        );
    };

    const run = () => runStream();

    const REFINE_HINTS: Record<RefineHint, string> = {
        more: 'more words',
        harder: 'harder, less common words',
        examples: 'include an example sentence for every word',
    };
    const refine = (hint: RefineHint) => {
        if (hint === 'more') {
            count.value = Math.min(count.value + 4, 20);
        }
        return runStream(REFINE_HINTS[hint]);
    };

    const toCardInput = (r: ReviewRow): CardInput => ({
        word: r.word,
        definition: r.definition.trim(),
        phonetic: r.phonetic ?? null,
        partOfSpeech: r.partOfSpeech ?? null,
        example: r.example ?? null,
        exampleTranslation: r.exampleTranslation ?? null,
        tags: r.tags,
        difficulty: r.difficulty,
    });

    const commit = async () => {
        const h = header.value;
        if (!h) {
            return;
        }
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
            const created = await create.execute({
                title: h.title,
                description: h.description || null,
                sourceLanguage: h.sourceLanguage,
                targetLanguage: h.targetLanguage,
                subject: normCategory(h.subject),
                glyph: h.glyph ?? null,
            });
            if (!created) {
                error.value = create.error.value?.message ?? t('image.errGeneric');
                return;
            }
            const { newAchievements } = await bulkAddCards(created.id, cards);
            analytics.track('deck_created', {
                deck_id: created.id,
                creation_source: 'ai_from_image',
                card_count: cards.length,
                source_language: h.sourceLanguage,
                target_language: h.targetLanguage,
                is_first_deck: store.summaries.length === 0,
                is_public: false,
            });
            toast.success(t('ai.added').replace('{n}', String(cards.length)));
            notifications.announce(newAchievements);
            const id = created.id;
            reset();
            opts.onCreated?.(id);
        } catch (e) {
            error.value = (e as { message?: string }).message ?? t('image.errGeneric');
        } finally {
            committing.value = false;
        }
    };

    return {
        step,
        file,
        previewUrl,
        header,
        rows,
        count,
        targetLanguage,
        note,
        error,
        committing,
        committableCount,
        unfilledCount,
        rowTone,
        setFile,
        run,
        refine,
        commit,
        reset,
    };
};
