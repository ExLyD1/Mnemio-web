import { http } from '@/utils/http';
import { runSse } from '@/utils/sse';

// ─── Wire types (docs/api-contract.md §Chat) ──────────────────────────────────

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
}

export type ChatMessageRole = 'user' | 'assistant' | 'system';
export type ChatMessageStatus = 'complete' | 'partial';

/**
 * Structured side-effect an assistant message performed. Currently only decks —
 * populated once the backend ships chat tool-use (see plan). Optional: chat works
 * without it; the FE just won't render deck-link cards until then.
 */
export interface DeckAttachment {
    type: 'deck';
    deckId: string;
    title: string;
    cardCount: number;
}
export type ChatAttachment = DeckAttachment;

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: ChatMessageRole;
    content: string;
    status: ChatMessageStatus;
    tokensInput?: number | null;
    tokensOutput?: number | null;
    createdAt: string;
    attachments?: ChatAttachment[];
    /** Client-only object URL for an attached image (never persisted; lost on reload). */
    localImageUrl?: string;
}

export interface ConversationsPage {
    items: Conversation[];
    nextCursor: string | null;
}

// ─── Conversation CRUD (plain JSON over `http`) ───────────────────────────────

export const listConversations = (
    params: { cursor?: string | null; limit?: number } = {},
): Promise<ConversationsPage> =>
    http<ConversationsPage>('/chat/conversations', {
        query: { cursor: params.cursor ?? undefined, limit: params.limit ?? 30 },
    });

export const createConversation = (title?: string): Promise<Conversation> =>
    http<Conversation>('/chat/conversations', {
        method: 'POST',
        body: title ? { title } : {},
    });

export const getConversation = (
    id: string,
): Promise<{ conversation: Conversation; messages: ChatMessage[] }> =>
    http(`/chat/conversations/${id}`);

export const renameConversation = (id: string, title: string): Promise<Conversation> =>
    http<Conversation>(`/chat/conversations/${id}`, { method: 'PATCH', body: { title } });

export const deleteConversation = async (id: string): Promise<void> => {
    await http<void>(`/chat/conversations/${id}`, { method: 'DELETE' });
};

// ─── Streaming send (native fetch + SSE; `http`/$fetch can't stream) ───────────

export interface StreamStart {
    userMessage: ChatMessage;
    assistantMessageId: string;
}
export interface StreamDone {
    assistantMessage: ChatMessage;
    conversationTitle: string;
    tokensInput?: number;
    tokensOutput?: number;
}
export interface StreamError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface StreamHandlers {
    onStart?: (e: StreamStart) => void;
    onToken?: (delta: string) => void;
    onDone?: (e: StreamDone) => void;
    onError?: (e: StreamError) => void;
}

/**
 * Stream an assistant reply over SSE. Appends a user message and emits start →
 * token* → done (or error). When `image` is supplied the request is sent as
 * multipart/form-data ("Вчися з будь-чого" from the chat surface) — the model
 * reads the image and may call the create_deck tool; otherwise it's plain JSON.
 * Retries once on a 401 by refreshing the access token (handled by `runSse`).
 */
export const streamMessage = (
    conversationId: string,
    content: string,
    handlers: StreamHandlers,
    signal?: AbortSignal,
    locale = 'en',
    image?: File | null,
): Promise<void> => {
    let body: FormData | Record<string, unknown>;
    if (image) {
        const form = new FormData();
        form.append('image', image);
        if (content) {
            form.append('content', content);
        }
        form.append('locale', locale);
        body = form;
    } else {
        body = { content, locale };
    }

    return runSse({
        path: `/chat/conversations/${conversationId}/messages`,
        query: '?stream=1',
        body,
        signal,
        onError: (e) => handlers.onError?.(e),
        onFrame: (frame) => {
            switch (frame.event) {
                case 'start':
                    handlers.onStart?.(frame.data as StreamStart);
                    break;
                case 'token':
                    handlers.onToken?.((frame.data as { delta?: string }).delta ?? '');
                    break;
                case 'done':
                    handlers.onDone?.(frame.data as StreamDone);
                    break;
                case 'error':
                    handlers.onError?.(frame.data as StreamError);
                    break;
            }
        },
    });
};
