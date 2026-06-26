import { http, getApiBase, refreshAccessToken } from '@/utils/http';
import { readAccessToken } from '@/utils/authToken';

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

const API_PREFIX = '/api/v1';

const buildInit = (
    token: string | null,
    content: string,
    locale: string,
    signal?: AbortSignal,
): RequestInit => ({
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ content, locale }),
    signal,
});

const parseFrame = (raw: string): { event: string; data: unknown } | null => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) {
            event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
        }
    }
    if (!dataLines.length) {
        return null;
    }
    try {
        return { event, data: JSON.parse(dataLines.join('\n')) };
    } catch {
        return null;
    }
};

const dispatch = (frame: { event: string; data: unknown }, handlers: StreamHandlers): void => {
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
};

/**
 * Stream an assistant reply over SSE. Appends a user message and emits start →
 * token* → done (or error). Retries once on a 401 by refreshing the access token.
 */
export const streamMessage = async (
    conversationId: string,
    content: string,
    handlers: StreamHandlers,
    signal?: AbortSignal,
    locale = 'en',
): Promise<void> => {
    const url = `${getApiBase()}${API_PREFIX}/chat/conversations/${conversationId}/messages?stream=1`;

    let res: Response;
    try {
        res = await fetch(url, buildInit(readAccessToken(), content, locale, signal));
        if (res.status === 401) {
            const fresh = await refreshAccessToken();
            if (!fresh) {
                await navigateTo('/login?reason=session_expired');
                return;
            }
            res = await fetch(url, buildInit(fresh, content, locale, signal));
        }
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            return;
        }
        handlers.onError?.({ code: 'NETWORK_ERROR', message: 'Chat request failed.' });
        return;
    }

    if (!res.ok || !res.body) {
        let err: StreamError = { code: 'NETWORK_ERROR', message: 'Chat request failed.' };
        try {
            const j = (await res.json()) as Partial<StreamError>;
            if (j.code) {
                err = { code: j.code, message: j.message ?? err.message, details: j.details };
            }
        } catch {
            // non-JSON body; keep the default
        }
        handlers.onError?.(err);
        return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const raw = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);
                const frame = parseFrame(raw);
                if (frame) {
                    dispatch(frame, handlers);
                }
            }
        }
    } catch (e) {
        if (!(e instanceof Error) || e.name !== 'AbortError') {
            handlers.onError?.({ code: 'NETWORK_ERROR', message: 'Chat stream interrupted.' });
        }
    }
};
