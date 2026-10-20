import { clientTimeZone, getApiBase, refreshAccessToken } from '@/utils/http';
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
    const tz = clientTimeZone();
    return {
        method: 'POST',
        headers: {
            Accept: 'text/event-stream',
            ...(isForm ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(tz ? { 'X-Timezone': tz } : {}),
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

    const timeout = AbortSignal.timeout(150_000);
    const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
    let res: Response;
    try {
        res = await fetch(url, buildSseInit(readAccessToken(), makeBody(), signal));
        if (res.status === 401) {
            const { token: fresh, wasInvalid } = await refreshAccessToken();
            if (!fresh) {
                // Only a confirmed-dead refresh token forces a re-login. A
                // transient refresh failure (network blip, backend booting)
                // must not log the user out of a session that may still be
                // valid — surface it as a normal stream error instead.
                if (wasInvalid) {
                    opts.onError({ code: 'AUTH_INVALID_REFRESH', message: 'Session expired.' });
                    // A full navigation also clears the in-memory auth store.
                    window.location.assign('/login?reason=session_expired');
                    return;
                }
                opts.onError({ code: 'NETWORK_ERROR', message: 'Request failed.' });
                return;
            }
            res = await fetch(url, buildSseInit(fresh, makeBody(), signal));
        }
    } catch {
        if (opts.signal?.aborted) {
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
    const state = { terminal: false };
    const dispatch = (raw: string) => {
        const frame = parseSseFrame(raw);
        if (frame) {
            state.terminal ||= frame.event === 'done' || frame.event === 'error';
            opts.onFrame(frame);
        }
    };
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
            let idx: number;
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const raw = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);
                dispatch(raw);
            }
        }
        if (buffer.trim()) {
            dispatch(buffer);
        }
        if (!state.terminal && !opts.signal?.aborted) {
            opts.onError({ code: 'NETWORK_ERROR', message: 'Stream interrupted.' });
        }
    } catch {
        if (!opts.signal?.aborted) {
            opts.onError({ code: 'NETWORK_ERROR', message: 'Stream interrupted.' });
        }
    } finally {
        reader.releaseLock();
    }
};
