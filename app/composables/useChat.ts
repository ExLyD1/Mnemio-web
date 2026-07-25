import { ref, useI18n } from '#imports';
import * as chatApi from '@/api/chat';
import type { Conversation, ChatMessage, StreamError } from '@/api/chat';
import type { ApiError } from '@/composables/useAsync';

let tempSeq = 0;
const tempId = (p: string) => `tmp-${p}-${++tempSeq}`;

/**
 * Client-only cache of attached-image previews, keyed by server message id. The
 * backend never persists the image, so this is how a thumbnail survives switching
 * conversations or leaving and returning to the page within the same session.
 * Module-level (not per-instance) so it outlives the page's mount. Lost on a full
 * reload — the object URLs die with the document.
 */
const imagePreviewCache = new Map<string, string>();

/**
 * Chat state + actions for the AI assistant page: a conversation sidebar, the
 * active thread, and an optimistic streaming `send`. One instance per page.
 */
export const useChat = () => {
    const { locale } = useI18n();
    const conversations = ref<Conversation[]>([]);
    const activeId = ref<string | null>(null);
    const messages = ref<ChatMessage[]>([]);
    const streaming = ref(false);
    const loadingList = ref(false);
    const loadingThread = ref(false);
    const streamError = ref<StreamError | null>(null);

    let controller: AbortController | null = null;
    let lastContent = '';
    let lastImage: File | null = null;

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

    const loadConversations = async () => {
        loadingList.value = true;
        try {
            const page = await chatApi.listConversations();
            conversations.value = page.items;
        } catch {
            // sidebar stays empty; surfaced by an empty state
        } finally {
            loadingList.value = false;
        }
    };

    const openConversation = async (id: string) => {
        if (activeId.value === id) {
            return;
        }
        controller?.abort();
        activeId.value = id;
        messages.value = [];
        loadingThread.value = true;
        try {
            const res = await chatApi.getConversation(id);
            // Re-attach any client-only image previews we still hold for this session.
            messages.value = res.messages.map((m) =>
                imagePreviewCache.has(m.id)
                    ? { ...m, localImageUrl: imagePreviewCache.get(m.id) }
                    : m,
            );
        } catch (e) {
            const err = e as Partial<ApiError>;
            streamError.value = { code: err.code ?? 'NETWORK_ERROR', message: err.message ?? '' };
        } finally {
            loadingThread.value = false;
        }
    };

    const newConversation = () => {
        controller?.abort();
        activeId.value = null;
        messages.value = [];
        streamError.value = null;
    };

    const send = async (content: string, image?: File | null) => {
        const text = content.trim();
        // An image-only turn is valid — the model reads the image itself.
        if ((!text && !image) || streaming.value) {
            return;
        }
        lastContent = text;
        lastImage = image ?? null;
        streamError.value = null;

        // First message in a brand-new chat → create the conversation first.
        let convId = activeId.value;
        if (!convId) {
            try {
                const conv = await chatApi.createConversation();
                conversations.value.unshift(conv);
                activeId.value = conv.id;
                convId = conv.id;
            } catch (e) {
                const err = e as Partial<ApiError>;
                streamError.value = {
                    code: err.code ?? 'NETWORK_ERROR',
                    message: err.message ?? '',
                };
                return;
            }
        }
        if (!convId) {
            return;
        }

        const userTmp = tempId('user');
        const asstTmp = tempId('asst');
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

        streaming.value = true;
        controller = new AbortController();
        await chatApi.streamMessage(
            convId,
            text,
            {
                onStart: (e) => {
                    // Keep the client-only preview and remember it under the real
                    // server id so it re-renders when the thread is refetched later.
                    patch(userTmp, { ...e.userMessage, localImageUrl });
                    if (localImageUrl) {
                        imagePreviewCache.set(e.userMessage.id, localImageUrl);
                    }
                },
                onToken: (delta) => {
                    const i = messages.value.findIndex((m) => m.id === asstTmp);
                    const cur = messages.value[i];
                    if (cur) {
                        messages.value[i] = { ...cur, content: cur.content + delta };
                    }
                },
                onDone: (e) => {
                    patch(asstTmp, { ...e.assistantMessage });
                    touchConversation(convId, e.conversationTitle);
                },
                onError: (e) => {
                    streamError.value = e;
                    patch(asstTmp, { status: 'partial' });
                },
            },
            controller.signal,
            locale.value,
            image,
        );
        streaming.value = false;
    };

    const retry = () => send(lastContent, lastImage);

    const rename = async (id: string, title: string) => {
        const trimmed = title.trim();
        if (!trimmed) {
            return;
        }
        try {
            const conv = await chatApi.renameConversation(id, trimmed);
            const i = conversations.value.findIndex((c) => c.id === id);
            if (i !== -1) {
                conversations.value[i] = conv;
            }
        } catch {
            // keep the old title on failure
        }
    };

    const remove = async (id: string) => {
        try {
            await chatApi.deleteConversation(id);
        } catch {
            return;
        }
        conversations.value = conversations.value.filter((c) => c.id !== id);
        if (activeId.value === id) {
            newConversation();
        }
    };

    return {
        conversations,
        activeId,
        messages,
        streaming,
        loadingList,
        loadingThread,
        streamError,
        loadConversations,
        openConversation,
        newConversation,
        send,
        retry,
        rename,
        remove,
    };
};
