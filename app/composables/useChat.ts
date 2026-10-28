import { computed, ref, useI18n, onBeforeUnmount } from '#imports';
import * as chatApi from '@/api/chat';
import type { AiUsage, Conversation, ChatMessage, StreamError } from '@/api/chat';
import type { ApiError } from '@/composables/useAsync';

let tempSeq = 0;
const tempId = (p: string) => `tmp-${p}-${++tempSeq}`;

/** Server-enforced message length (docs/api-contract.md §Chat). */
export const MAX_MESSAGE_CHARS = 4000;

/**
 * Errors where retrying the exact same request cannot possibly work: a cap that
 * resets tomorrow, a message the server rejected, an image it can't read. These
 * render as an explanation with no Retry button — offering one produced a loop
 * of identical failures.
 */
const TERMINAL_ERROR_CODES = new Set([
    'AI_BUDGET_EXCEEDED',
    'VALIDATION_ERROR',
    'CHAT_EMPTY_MESSAGE',
    'CHAT_NOT_FOUND',
    'CHAT_BUSY',
    'CHAT_RETRY_UNAVAILABLE',
    'AI_IMAGE_TOO_LARGE',
    'AI_IMAGE_UNSUPPORTED_TYPE',
    'AI_IMAGE_MISSING',
]);

export const isTerminalChatError = (code?: string): boolean =>
    !!code && TERMINAL_ERROR_CODES.has(code);

/**
 * Client-only cache of attached-image previews, keyed by server message id. The
 * backend never persists the image, so this is how a thumbnail survives switching
 * conversations or leaving and returning to the page within the same session.
 * Module-level (not per-instance) so it outlives the page's mount. Lost on a full
 * reload — the object URLs die with the document.
 */
const imagePreviewCache = new Map<string, string>();

/**
 * The deck a conversation is working on, remembered per conversation so it
 * survives switching chats and reloading. Only the id is stored; the title and
 * languages are re-read from the API, so a renamed or deleted deck can't leave
 * a stale label on screen.
 */
const DECK_CTX_KEY = (convId: string) => `mnemio.chat.deck.${convId}`;

const readStoredDeckId = (convId: string): string | null => {
    try {
        return localStorage.getItem(DECK_CTX_KEY(convId));
    } catch {
        return null;
    }
};

const writeStoredDeckId = (convId: string, deckId: string | null): void => {
    try {
        if (deckId) {
            localStorage.setItem(DECK_CTX_KEY(convId), deckId);
        } else {
            localStorage.removeItem(DECK_CTX_KEY(convId));
        }
    } catch {
        // Private mode / storage disabled — the context just won't persist.
    }
};

/** The deck currently attached to the chat, as the chip renders it. */
export interface ChatDeckContext {
    id: string;
    title: string;
    sourceLanguage?: string;
    targetLanguage?: string;
}

/** How often we re-check a reply that was still generating when we loaded. */
const STREAM_POLL_MS = 2000;
const STREAM_POLL_MAX = 100; // ~3m20s, allowing the backend's 3-minute stale reap

/**
 * Chat state + actions for the AI assistant page: a conversation sidebar, the
 * active thread, and an optimistic streaming `send`. One instance per page.
 */
export const useChat = () => {
    const { locale } = useI18n();
    const conversations = ref<Conversation[]>([]);
    const nextCursor = ref<string | null>(null);
    const activeId = ref<string | null>(null);
    const messages = ref<ChatMessage[]>([]);
    const streaming = ref(false);
    const loadingList = ref(false);
    const loadingMore = ref(false);
    const loadingThread = ref(false);
    const earlierCursor = ref<string | null>(null);
    const loadingEarlier = ref(false);
    const earlierError = ref(false);
    /** False until the first conversation load settles — the composer stays disabled. */
    const initialized = ref(false);
    const streamError = ref<StreamError | null>(null);
    /** Set while a tool runs, so the bubble can say what's happening. */
    const toolRunning = ref<string | null>(null);
    const pendingReply = computed(
        () =>
            streaming.value &&
            (!!toolRunning.value ||
                messages.value.at(-1)?.role !== 'assistant' ||
                !messages.value.at(-1)?.content),
    );
    const contextDeck = ref<ChatDeckContext | null>(null);
    const usage = ref<AiUsage | null>(null);

    let controller: AbortController | null = null;
    // Guards against a slow thread load landing after the user moved on.
    let openSeq = 0;
    let deckSeq = 0;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const canSend = computed(() => initialized.value && !streaming.value && !loadingThread.value);

    const patch = (id: string, fields: Partial<ChatMessage>) => {
        const i = messages.value.findIndex((m) => m.id === id);
        const cur = messages.value[i];
        if (cur) {
            messages.value[i] = { ...cur, ...fields };
        }
    };

    const touchConversation = (id: string, title?: string) => {
        const i = conversations.value.findIndex((c) => c.id === id);
        const existing = conversations.value[i];
        if (!existing) {
            return;
        }
        const conv = { ...existing, lastMessageAt: new Date().toISOString() };
        if (title) {
            conv.title = title;
        }
        conversations.value.splice(i, 1);
        conversations.value.unshift(conv);
    };

    const refreshUsage = async () => {
        try {
            usage.value = await chatApi.getAiUsage();
        } catch {
            // The indicator is a nicety; the caps are still enforced server-side.
        }
    };

    /**
     * Merge rather than replace: a conversation the user created a moment ago
     * (optimistically unshifted) must not vanish because the server page was
     * already in flight when they sent.
     */
    const mergeConversations = (incoming: Conversation[], append: boolean) => {
        const seen = new Map<string, Conversation>();
        const order = append ? [...conversations.value, ...incoming] : [...incoming];
        if (!append) {
            for (const c of conversations.value) {
                if (!incoming.some((i) => i.id === c.id)) {
                    order.unshift(c);
                }
            }
        }
        for (const c of order) {
            seen.set(c.id, c);
        }
        conversations.value = [...seen.values()];
    };

    const loadConversations = async () => {
        loadingList.value = true;
        try {
            const page = await chatApi.listConversations();
            mergeConversations(page.items, false);
            nextCursor.value = page.nextCursor;
        } catch {
            // sidebar stays empty; surfaced by an empty state
        } finally {
            loadingList.value = false;
            initialized.value = true;
        }
    };

    /** Next page of the sidebar. Without it everything past the first page was unreachable. */
    const loadMoreConversations = async () => {
        if (!nextCursor.value || loadingMore.value) {
            return;
        }
        loadingMore.value = true;
        try {
            const page = await chatApi.listConversations({ cursor: nextCursor.value });
            mergeConversations(page.items, true);
            nextCursor.value = page.nextCursor;
        } catch {
            // keep what we have; the sentinel will retry on the next scroll
        } finally {
            loadingMore.value = false;
        }
    };

    const stopPolling = () => {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    };

    const withPreviews = (list: ChatMessage[]): ChatMessage[] =>
        list.map((m) =>
            imagePreviewCache.has(m.id) ? { ...m, localImageUrl: imagePreviewCache.get(m.id) } : m,
        );

    /**
     * A reply that was still generating when this client loaded the thread
     * (reload mid-stream, or a second tab). The tokens are gone — this client
     * never subscribed to that stream — so we wait for the server to finish and
     * then show the finished message, instead of rendering an empty bubble as
     * "Reply was interrupted" for an answer that completed and was charged.
     */
    const pollStreamingReply = (convId: string, attempt = 0) => {
        stopPolling();
        if (attempt >= STREAM_POLL_MAX) {
            messages.value = messages.value.map((m) =>
                m.status === 'streaming' ? { ...m, status: 'partial' } : m,
            );
            streaming.value = false;
            return;
        }
        const tick = async () => {
            if (activeId.value !== convId) {
                return;
            }
            try {
                const res = await chatApi.getConversation(convId);
                if (activeId.value !== convId) {
                    return;
                }
                const ids = new Set(res.messages.map((m) => m.id));
                messages.value = [
                    ...messages.value.filter((m) => !ids.has(m.id)),
                    ...withPreviews(res.messages),
                ];
                if (res.messages.at(-1)?.status === 'streaming') {
                    pollStreamingReply(convId, attempt + 1);
                    return;
                }
                streaming.value = false;
                void refreshUsage();
            } catch {
                streaming.value = false;
            }
        };
        // `void tick()` rather than an async callback: setTimeout discards the
        // returned promise, so an async callback here would silently swallow a
        // rejection instead of hitting the catch above.
        pollTimer = setTimeout(() => void tick(), STREAM_POLL_MS);
    };

    /** Resolve a deck id into the chip's label; unknown/deleted decks detach. */
    const setContextDeck = async (deckId: string | null) => {
        const seq = ++deckSeq;
        const convId = activeId.value;
        if (activeId.value) {
            writeStoredDeckId(activeId.value, deckId);
        }
        if (!deckId) {
            contextDeck.value = null;
            return;
        }
        if (contextDeck.value?.id === deckId) {
            return;
        }
        try {
            const { getDeck } = await import('@/api/decks');
            const deck = await getDeck(deckId);
            if (seq !== deckSeq || convId !== activeId.value) {
                return;
            }
            contextDeck.value = {
                id: deck.id,
                title: deck.title,
                ...(deck.sourceLanguage ? { sourceLanguage: deck.sourceLanguage } : {}),
                ...(deck.targetLanguage ? { targetLanguage: deck.targetLanguage } : {}),
            };
        } catch {
            if (seq !== deckSeq || convId !== activeId.value) {
                return;
            }
            contextDeck.value = null;
            if (activeId.value) {
                writeStoredDeckId(activeId.value, null);
            }
        }
    };

    const openConversation = async (id: string) => {
        if (activeId.value === id) {
            return;
        }
        controller?.abort();
        stopPolling();
        const seq = ++openSeq;
        activeId.value = id;
        messages.value = [];
        streamError.value = null;
        toolRunning.value = null;
        streaming.value = false;
        loadingThread.value = true;
        earlierCursor.value = null;
        earlierError.value = false;
        loadingEarlier.value = false;
        void setContextDeck(readStoredDeckId(id));
        try {
            const res = await chatApi.getConversation(id);
            // A newer open (or a send) happened while this was in flight.
            if (seq !== openSeq) {
                return;
            }
            messages.value = withPreviews(res.messages);
            earlierCursor.value = res.hasMore ? res.before : null;
            if (res.messages.at(-1)?.status === 'streaming') {
                streaming.value = true;
                pollStreamingReply(id);
            }
        } catch (e) {
            if (seq !== openSeq) {
                return;
            }
            const err = e as Partial<ApiError>;
            streamError.value = { code: err.code ?? 'NETWORK_ERROR', message: err.message ?? '' };
        } finally {
            if (seq === openSeq) {
                loadingThread.value = false;
            }
        }
    };

    const loadEarlierMessages = async () => {
        if (!activeId.value || !earlierCursor.value || loadingEarlier.value) {
            return;
        }
        const id = activeId.value;
        const seq = openSeq;
        loadingEarlier.value = true;
        earlierError.value = false;
        try {
            const page = await chatApi.getConversation(id, earlierCursor.value);
            if (seq !== openSeq || activeId.value !== id) {
                return;
            }
            const ids = new Set(messages.value.map((m) => m.id));
            messages.value = [
                ...withPreviews(page.messages).filter((m) => !ids.has(m.id)),
                ...messages.value,
            ];
            earlierCursor.value = page.hasMore ? page.before : null;
        } catch {
            if (seq === openSeq) {
                earlierError.value = true;
            }
        } finally {
            if (seq === openSeq) {
                loadingEarlier.value = false;
            }
        }
    };

    const newConversation = () => {
        controller?.abort();
        stopPolling();
        openSeq += 1;
        deckSeq += 1;
        loadingThread.value = false;
        activeId.value = null;
        earlierCursor.value = null;
        earlierError.value = false;
        loadingEarlier.value = false;
        messages.value = [];
        streamError.value = null;
        toolRunning.value = null;
        streaming.value = false;
        contextDeck.value = null;
    };

    /**
     * Send a message and stream the reply.
     *
     * `retryOf` is the id of a failed assistant message being retried: the
     * backend deletes that message and the user message before it, so a retry
     * replaces the failed turn instead of appending a second copy.
     */
    const send = async (content: string, image?: File | null, opts: { retryOf?: string } = {}) => {
        const text = content.trim();
        // An image-only turn is valid — the model reads the image itself.
        if ((!text && !image) || streaming.value) {
            return;
        }
        // Validate BEFORE creating anything: an over-length message used to be
        // POSTed, rejected with a 400, and lost — the composer had already been
        // cleared and an empty conversation was left behind.
        if (text.length > MAX_MESSAGE_CHARS) {
            streamError.value = {
                code: 'VALIDATION_ERROR',
                message: '',
                details: { max: MAX_MESSAGE_CHARS, length: text.length },
            };
            return;
        }
        streamError.value = null;
        toolRunning.value = null;

        // First message in a brand-new chat → create the conversation first.
        const seq = ++openSeq;
        const current = () => seq === openSeq;
        const deckId = contextDeck.value?.id ?? null;
        streaming.value = true;
        controller = new AbortController();
        try {
            let convId = activeId.value;
            let createdConversation = false;
            if (!convId) {
                try {
                    const conv = await chatApi.createConversation();
                    if (!current()) {
                        return true;
                    }
                    if (controller.signal.aborted) {
                        void chatApi.deleteConversation(conv.id).catch(() => undefined);
                        return false;
                    }
                    conversations.value.unshift(conv);
                    activeId.value = conv.id;
                    convId = conv.id;
                    createdConversation = true;
                    if (contextDeck.value) {
                        writeStoredDeckId(conv.id, contextDeck.value.id);
                    }
                } catch (e) {
                    if (!current()) {
                        return true;
                    }
                    const err = e as Partial<ApiError>;
                    streamError.value = {
                        code: err.code ?? 'NETWORK_ERROR',
                        message: err.message ?? '',
                    };
                    return false;
                }
            }
            if (!convId) {
                return false;
            }

            // A conversation that never received a message is invisible in the
            // sidebar (server-side), but drop ours too so the list matches.
            const discardEmptyConversation = () => {
                if (!createdConversation || !convId) {
                    return;
                }
                conversations.value = conversations.value.filter((c) => c.id !== convId);
                activeId.value = null;
                messages.value = [];
                void chatApi.deleteConversation(convId).catch(() => undefined);
            };

            const previousMessages = [...messages.value];
            if (opts.retryOf) {
                // Drop the failed pair locally; the server does the same.
                const i = messages.value.findIndex((m) => m.id === opts.retryOf);
                if (i !== -1) {
                    const from = i > 0 && messages.value[i - 1]?.role === 'user' ? i - 1 : i;
                    messages.value.splice(from, i - from + 1);
                }
            }

            const userTmp = tempId('user');
            let asstTmp = tempId('asst');
            const now = new Date().toISOString();
            const localImageUrl = image ? URL.createObjectURL(image) : undefined;
            messages.value.push({
                id: userTmp,
                conversationId: convId,
                role: 'user',
                content: text,
                status: 'complete',
                createdAt: now,
                localImageUrl,
            });
            messages.value.push({
                id: asstTmp,
                conversationId: convId,
                role: 'assistant',
                content: '',
                status: 'complete',
                createdAt: now,
            });

            const outcome = { started: false, failed: false };
            streaming.value = true;
            await chatApi.streamMessage(
                convId,
                text,
                {
                    onStart: (e) => {
                        if (!current()) {
                            return;
                        }
                        outcome.started = true;
                        patch(asstTmp, { id: e.assistantMessageId, status: 'streaming' });
                        asstTmp = e.assistantMessageId;
                        // Keep the client-only preview and remember it under the real
                        // server id so it re-renders when the thread is refetched later.
                        patch(userTmp, { ...e.userMessage, localImageUrl });
                        if (localImageUrl) {
                            imagePreviewCache.set(e.userMessage.id, localImageUrl);
                        }
                    },
                    onToken: (delta) => {
                        if (!current()) {
                            return;
                        }
                        const i = messages.value.findIndex((m) => m.id === asstTmp);
                        const cur = messages.value[i];
                        if (cur) {
                            messages.value[i] = { ...cur, content: cur.content + delta };
                        }
                    },
                    onToolUse: (e) => {
                        if (!current()) {
                            return;
                        }
                        // Anything streamed before a tool ran is a throwaway
                        // preamble ("On it…") that the final message replaces.
                        // Clear it now so the two don't appear stacked.
                        toolRunning.value = e.name;
                        patch(asstTmp, { content: '' });
                    },
                    onToolResult: (e) => {
                        if (!current()) {
                            return;
                        }
                        if (e.ok && e.data) {
                            patch(asstTmp, { attachments: [e.data as chatApi.DeckAttachment] });
                        }
                        toolRunning.value = null;
                    },
                    onDone: (e) => {
                        if (!current()) {
                            return;
                        }
                        patch(asstTmp, { ...e.assistantMessage });
                        touchConversation(convId, e.conversationTitle);
                        void refreshUsage();
                    },
                    onError: (e) => {
                        if (!current()) {
                            return;
                        }
                        outcome.failed = true;
                        streamError.value = e;
                        toolRunning.value = null;
                        if (e.code === 'AUTH_INVALID_REFRESH') {
                            messages.value = previousMessages;
                            return;
                        }
                        if (isTerminalChatError(e.code)) {
                            // Nothing to retry: drop the empty assistant bubble and
                            // let the page explain what happened instead.
                            messages.value = messages.value.filter((m) => m.id !== asstTmp);
                            if (!outcome.started) {
                                messages.value = messages.value.filter((m) => m.id !== userTmp);
                                discardEmptyConversation();
                                if (opts.retryOf) {
                                    messages.value = previousMessages;
                                }
                            }
                            void refreshUsage();
                            return;
                        }
                        if (!outcome.started) {
                            // The turn never reached the server: keep neither bubble,
                            // so the user can edit and resend what they typed.
                            messages.value = messages.value.filter(
                                (m) => m.id !== asstTmp && m.id !== userTmp,
                            );
                            discardEmptyConversation();
                            if (opts.retryOf) {
                                messages.value = previousMessages;
                            }
                            return;
                        }
                        patch(asstTmp, { status: 'partial' });
                    },
                },
                controller.signal,
                locale.value,
                image,
                {
                    deckId,
                    ...(opts.retryOf ? { retryOf: opts.retryOf } : {}),
                },
            );
            if (current() && controller.signal.aborted && !outcome.started) {
                messages.value = previousMessages;
                return false;
            }
            if (current() && controller.signal.aborted && outcome.started) {
                patch(asstTmp, { status: 'partial' });
            }
            return outcome.started || !outcome.failed;
        } finally {
            if (current()) {
                streaming.value = false;
                toolRunning.value = null;
                controller = null;
            }
        }
    };

    /**
     * Retry a specific failed reply. The text comes from the user message that
     * produced it, not from a remembered "last send" — that leaked the previous
     * conversation's message into this one and did nothing at all after a reload.
     */
    const canRetry = (m: ChatMessage): boolean =>
        m.role === 'assistant' &&
        m.status === 'partial' &&
        !m.attachments?.length &&
        !m.id.startsWith('tmp-') &&
        m.id === messages.value.at(-1)?.id;

    const retry = async (assistantId: string) => {
        const i = messages.value.findIndex((m) => m.id === assistantId);
        const userMsg = i > 0 ? messages.value[i - 1] : undefined;
        if (userMsg?.role !== 'user') {
            return;
        }
        const message = messages.value[i];
        if (!message || !canRetry(message) || streaming.value) {
            return;
        }
        await send(userMsg.content, null, { retryOf: assistantId });
    };

    const rename = async (id: string, title: string) => {
        const trimmed = title.trim();
        if (!trimmed) {
            return;
        }
        const i = conversations.value.findIndex((c) => c.id === id);
        const prev = conversations.value[i];
        try {
            const conv = await chatApi.renameConversation(id, trimmed);
            if (i !== -1) {
                conversations.value[i] = conv;
            }
        } catch (e) {
            if (i !== -1 && prev) {
                conversations.value[i] = prev;
            }
            throw e;
        }
    };

    /**
     * Delete a conversation, optimistically. The row used to be removed only on
     * success and failures were swallowed entirely, so a failing DELETE looked
     * like a dead button.
     */
    const remove = async (id: string) => {
        const prev = conversations.value;
        const wasActive = activeId.value === id;
        conversations.value = conversations.value.filter((c) => c.id !== id);
        if (wasActive) {
            newConversation();
        }
        try {
            await chatApi.deleteConversation(id);
            writeStoredDeckId(id, null);
        } catch (e) {
            conversations.value = prev;
            if (wasActive) {
                await openConversation(id);
            }
            throw e;
        }
    };

    const stop = () => {
        const id = activeId.value;
        const seq = openSeq;
        if (id) {
            void chatApi.cancelReply(id).catch(() => {
                if (seq !== openSeq || activeId.value !== id) {
                    return;
                }
                streamError.value = { code: 'NETWORK_ERROR', message: '' };
            });
        }
        controller?.abort();
    };

    onBeforeUnmount(() => {
        openSeq += 1;
        deckSeq += 1;
        controller?.abort();
        stopPolling();
    });

    return {
        stop,
        conversations,
        nextCursor,
        activeId,
        messages,
        streaming,
        loadingList,
        loadingMore,
        loadingThread,
        earlierCursor,
        loadingEarlier,
        earlierError,
        loadEarlierMessages,
        initialized,
        canSend,
        streamError,
        toolRunning,
        pendingReply,
        contextDeck,
        usage,
        loadConversations,
        loadMoreConversations,
        refreshUsage,
        openConversation,
        newConversation,
        setContextDeck,
        send,
        retry,
        canRetry,
        rename,
        remove,
    };
};
