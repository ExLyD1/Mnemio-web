import { defineStore, ref, computed } from '#imports';

export type ConsentState = 'granted' | 'denied';

/**
 * Analytics consent. Persisted in a first-party cookie so the choice survives
 * reloads and is readable during SSR. Until the user decides, analytics stays
 * opted-out: useAnalytics() is a no-op and nuxt-gtag stays disabled.
 */
export const useConsentStore = defineStore('consent', () => {
    // 1-year cookie; same-site, not HttpOnly (the client needs to read it).
    const cookie = useCookie<ConsentState | null>('mnemio_consent', {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        default: () => null,
    });

    const status = ref<ConsentState | null>(cookie.value ?? null);

    const isDecided = computed(() => status.value !== null);
    const isGranted = computed(() => status.value === 'granted');

    const set = (next: ConsentState) => {
        status.value = next;
        cookie.value = next;
    };

    const accept = () => set('granted');
    const decline = () => set('denied');

    return { status, isDecided, isGranted, accept, decline };
});
