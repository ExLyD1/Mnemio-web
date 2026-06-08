import { ref } from 'vue';

export type ToastVariant = 'info' | 'success' | 'error';

export interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
}

const toasts = ref<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 1;
const DEFAULT_TTL = 4000;
const MAX_VISIBLE = 4;

/**
 * Auth-expiry error codes. These are handled centrally by `http.ts` (refresh +
 * retry, then redirect to /login), so call sites should not surface them as
 * toasts — otherwise N parallel requests failing after a dead session each
 * raise an identical toast.
 */
const AUTH_EXPIRY_CODES = new Set([
    'AUTH_INVALID_TOKEN',
    'AUTH_UNAUTHENTICATED',
    'AUTH_INVALID_REFRESH',
]);

export const isAuthExpiry = (code: string | undefined): boolean =>
    !!code && AUTH_EXPIRY_CODES.has(code);

const dismiss = (id: number) => {
    const timer = timers.get(id);
    if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(id);
    }
    toasts.value = toasts.value.filter((t) => t.id !== id);
};

const scheduleDismiss = (id: number, ttl: number) => {
    if (ttl <= 0 || typeof window === 'undefined') {
        return;
    }
    const existing = timers.get(id);
    if (existing !== undefined) {
        clearTimeout(existing);
    }
    timers.set(
        id,
        window.setTimeout(() => dismiss(id), ttl),
    );
};

const push = (message: string, variant: ToastVariant = 'info', ttl = DEFAULT_TTL) => {
    // Dedup: if an identical toast is already visible, just refresh its timer
    // instead of stacking a duplicate.
    const existing = toasts.value.find((t) => t.message === message && t.variant === variant);
    if (existing) {
        scheduleDismiss(existing.id, ttl);
        return existing.id;
    }

    const id = nextId++;
    let next = [...toasts.value, { id, message, variant }];
    // Cap concurrent toasts — drop the oldest beyond the limit.
    if (next.length > MAX_VISIBLE) {
        const overflow = next.slice(0, next.length - MAX_VISIBLE);
        overflow.forEach((t) => {
            const timer = timers.get(t.id);
            if (timer !== undefined) {
                clearTimeout(timer);
                timers.delete(t.id);
            }
        });
        next = next.slice(next.length - MAX_VISIBLE);
    }
    toasts.value = next;
    scheduleDismiss(id, ttl);
    return id;
};

export const useToast = () => ({
    toasts,
    dismiss,
    info: (m: string, ttl?: number) => push(m, 'info', ttl),
    success: (m: string, ttl?: number) => push(m, 'success', ttl),
    error: (m: string, ttl?: number) => push(m, 'error', ttl),
});
