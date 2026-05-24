import { ref } from 'vue';

export type ToastVariant = 'info' | 'success' | 'error';

export interface Toast {
    id: number;
    message: string;
    variant: ToastVariant;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;
const DEFAULT_TTL = 4000;

const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
};

const push = (message: string, variant: ToastVariant = 'info', ttl = DEFAULT_TTL) => {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, message, variant }];
    if (ttl > 0 && typeof window !== 'undefined') {
        window.setTimeout(() => dismiss(id), ttl);
    }
    return id;
};

export const useToast = () => ({
    toasts,
    dismiss,
    info: (m: string, ttl?: number) => push(m, 'info', ttl),
    success: (m: string, ttl?: number) => push(m, 'success', ttl),
    error: (m: string, ttl?: number) => push(m, 'error', ttl),
});
