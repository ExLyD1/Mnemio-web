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
/**
 * 'streaming' = the backend is generating this reply right now (e.g. we
 * reloaded mid-answer). Render the typing indicator and poll — rendering it as
 * "interrupted" told users a completed, already-charged reply had failed.
 */
export type ChatMessageStatus = 'complete' | 'partial' | 'streaming';

/**
 * Structured side-effect an assistant message performed. Currently only decks —
 * populated once the backend ships chat tool-use (see plan). Optional: chat works
 * without it; the FE just won't render deck-link cards until then.
 */
export interface DeckAttachment {
    type: 'deck';
    deckId: string;
    title: string;
    /** The deck's total AFTER the tool ran. */
    cardCount: number;
    action?: 'created' | 'appended';
    /** Cards just appended (only on action: 'appended'). */
    addedCount?: number;
    /** Requested words already in the deck, so not duplicated. */
    skippedCount?: number;
    /** The deck's definitions language (ISO 639-1). */
    sourceLanguage?: string;
    /** The deck's words language (ISO 639-1). */
    targetLanguage?: string;
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

/** Today's AI allowance, so the composer can show a limit before it's hit. */
export interface AiUsage {
    plan: 'free' | 'premium';
    /** ISO — next UTC midnight. */
    resetsAt: string;
    kinds: Record<
        'enrich' | 'generate' | 'suggest' | 'import' | 'chat' | 'image',
        { used: number; cap: number; remaining: number }
    >;
}

export const getAiUsage = (): Promise<AiUsage> => http<AiUsage>('/ai/usage');

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
/** A tool the assistant invoked mid-turn (e.g. create_deck). */
export interface StreamToolUse {
    name: string;
    input?: Record<string, unknown>;
}
export interface StreamToolResult {
    name: string;
    ok: boolean;
    data?: unknown;
}
export interface StreamHandlers {
    onStart?: (e: StreamStart) => void;
    onToken?: (delta: string) => void;
    onToolUse?: (e: StreamToolUse) => void;
    onToolResult?: (e: StreamToolResult) => void;
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
    // `deckId` is the deck the user has open/attached: it is the ONLY way the
    // add_cards tool becomes available, and the backend takes the target from
    // it rather than from the model. `retryOf` replaces a failed turn instead
    // of appending a second copy of it.
    opts: { deckId?: string | null; retryOf?: string | null } = {},
): Promise<void> => {
    let body: FormData | Record<string, unknown>;
    if (image) {
        const form = new FormData();
        form.append('image', image);
        if (content) {
            form.append('content', content);
        }
        form.append('locale', locale);
        if (opts.deckId) {
            form.append('deckId', opts.deckId);
        }
        if (opts.retryOf) {
            form.append('retryOf', opts.retryOf);
        }
        body = form;
    } else {
        body = {
            content,
            locale,
            ...(opts.deckId ? { deckId: opts.deckId } : {}),
            ...(opts.retryOf ? { retryOf: opts.retryOf } : {}),
        };
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
                case 'tool_use':
                    handlers.onToolUse?.(frame.data as StreamToolUse);
                    break;
                case 'tool_result':
                    handlers.onToolResult?.(frame.data as StreamToolResult);
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
