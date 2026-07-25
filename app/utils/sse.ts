import { getApiBase, refreshAccessToken } from '@/utils/http';
import { readAccessToken } from '@/utils/authToken';

const API_PREFIX = '/api/v1';

export interface SseFrame {
    event: string;
    data: unknown;
}

/** Parse one raw SSE frame (the text between two blank-line separators). */
export const parseSseFrame = (raw: string): SseFrame | null => {
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

export interface StreamError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Build a request init for an authenticated SSE POST. `body` is passed straight
 * through — a `FormData` sends multipart (no Content-Type header so the browser
 * sets the boundary); anything else is JSON-stringified.
 */
const buildSseInit = (token: string | null, body: BodyInit, signal?: AbortSignal): RequestInit => {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    return {
        method: 'POST',
        headers: {
            Accept: 'text/event-stream',
            ...(isForm ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body,
        signal,
    };
};

export interface RunSseOptions {
    /** Path after `/api/v1` (e.g. `/ai/deck-from-image`) or a full URL. */
    path: string;
    /** Query string appended verbatim, e.g. `?stream=1`. */
    query?: string;
    /** `FormData` → multipart; any other value is JSON-encoded. */
    body: FormData | Record<string, unknown>;
    signal?: AbortSignal;
    /** Called for each parsed SSE frame. */
    onFrame: (frame: SseFrame) => void;
    /** Called on transport/HTTP errors (not for `event: error` frames). */
    onError: (e: StreamError) => void;
}

/**
 * Authenticated SSE POST with a single 401→refresh→retry. Reads `res.body`,
 * splits on blank lines, and dispatches each frame to `onFrame`. Shared by the
 * chat stream and the deck-from-image stream. `event: error` frames are passed
 * through `onFrame` like any other; `onError` is only for transport failures.
 */
export const runSse = async (opts: RunSseOptions): Promise<void> => {
    const url = opts.path.startsWith('http')
        ? opts.path
        : `${getApiBase()}${API_PREFIX}${opts.path}${opts.query ?? ''}`;

    const makeBody = (): BodyInit =>
        opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body);

    let res: Response;
    try {
        res = await fetch(url, buildSseInit(readAccessToken(), makeBody(), opts.signal));
        if (res.status === 401) {
            const fresh = await refreshAccessToken();
            if (!fresh) {
                await navigateTo('/login?reason=session_expired');
                return;
            }
            res = await fetch(url, buildSseInit(fresh, makeBody(), opts.signal));
        }
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            return;
        }
        opts.onError({ code: 'NETWORK_ERROR', message: 'Request failed.' });
        return;
    }

    if (!res.ok || !res.body) {
        let err: StreamError = { code: 'NETWORK_ERROR', message: 'Request failed.' };
        try {
            const j = (await res.json()) as Partial<StreamError>;
            if (j.code) {
                err = { code: j.code, message: j.message ?? err.message, details: j.details };
            }
        } catch {
            // non-JSON body; keep the default
        }
        opts.onError(err);
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
                const frame = parseSseFrame(raw);
                if (frame) {
                    opts.onFrame(frame);
                }
            }
        }
    } catch (e) {
        if (!(e instanceof Error) || e.name !== 'AbortError') {
            opts.onError({ code: 'NETWORK_ERROR', message: 'Stream interrupted.' });
        }
    }
};
