import { defineStore, ref, unref, useCookie, useNuxtApp, watch } from '#imports';
import * as preferencesApi from '@/api/preferences';
import { useAnalytics } from '@/composables/useAnalytics';
import { useToast } from '@/composables/useToast';
import en from '@/i18n/en.json';
import uk from '@/i18n/uk.json';
import { isMascot, isPalette } from '@/utils/appearance';
import type { Mascot, Palette } from '@/types/mimi';
import type { Preference } from '@/types/user';

export const useAppearanceStore = defineStore('appearance', () => {
    const nuxtApp = useNuxtApp();
    const cookieOptions = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const };
    const mascotCookie = useCookie<string>('mnemio-mascot', cookieOptions);
    const paletteCookie = useCookie<string>('mnemio-palette', cookieOptions);
    const mascot = ref<Mascot>(isMascot(mascotCookie.value) ? mascotCookie.value : 'panda');
    const palette = ref<Palette>(isPalette(paletteCookie.value) ? paletteCookie.value : 'green');
    if (import.meta.client) {
        try {
            const local: unknown = JSON.parse(localStorage.getItem('mnemio-appearance') ?? '{}');
            if (local && typeof local === 'object') {
                if (!mascotCookie.value && 'mascot' in local && isMascot(local.mascot)) {
                    mascot.value = local.mascot;
                }
                if (!paletteCookie.value && 'palette' in local && isPalette(local.palette)) {
                    palette.value = local.palette;
                }
            }
        } catch {
            // Storage may be disabled or contain an invalid value.
        }
    }

    const mirror = () => {
        mascotCookie.value = mascot.value;
        paletteCookie.value = palette.value;
        if (import.meta.client) {
            document.documentElement.classList.remove('pal-violet', 'pal-pink');
            if (palette.value !== 'green') {
                document.documentElement.classList.add(`pal-${palette.value}`);
            }
            try {
                localStorage.setItem(
                    'mnemio-appearance',
                    JSON.stringify({
                        mascot: mascot.value,
                        palette: palette.value,
                    }),
                );
            } catch {
                // In-memory settings still work when storage is unavailable.
            }
        }
    };
    watch([mascot, palette], mirror, { flush: 'sync' });

    let generation = 0;
    const revisions = { mascot: 0, palette: 0 };
    const confirmed = { mascot: mascot.value, palette: palette.value };
    let saves = Promise.resolve();
    const hydrate = (p: Pick<Preference, 'mascot' | 'palette'>) => {
        mascot.value = confirmed.mascot = isMascot(p.mascot) ? p.mascot : 'panda';
        palette.value = confirmed.palette = isPalette(p.palette) ? p.palette : 'green';
        mirror();
    };
    const reset = () => {
        generation += 1;
        revisions.mascot += 1;
        revisions.palette += 1;
        hydrate({ mascot: 'panda', palette: 'green' });
    };

    // Serialize PATCHes so rapid keyboard selections reach the server in order.
    // Per-setting revisions stop an older failure rolling back a newer choice.
    const save = (setting: 'mascot' | 'palette', value: Mascot | Palette) => {
        const state = setting === 'mascot' ? mascot : palette;
        if (state.value === value) {
            return Promise.resolve();
        }
        state.value = value;
        const revision = ++revisions[setting];
        const session = generation;
        const request = saves.then(async () => {
            if (session !== generation) {
                return;
            }
            try {
                if (setting === 'mascot' && isMascot(value)) {
                    await preferencesApi.updatePreferences({ mascot: value });
                } else if (setting === 'palette' && isPalette(value)) {
                    await preferencesApi.updatePreferences({ palette: value });
                }
                if (session !== generation) {
                    return;
                }
                if (setting === 'mascot' && isMascot(value)) {
                    confirmed.mascot = value;
                }
                if (setting === 'palette' && isPalette(value)) {
                    confirmed.palette = value;
                }
                useAnalytics().track('appearance_changed', { setting, value });
            } catch {
                if (session !== generation) {
                    return;
                }
                if (revision === revisions[setting]) {
                    state.value = confirmed[setting];
                }
                // The Vue i18n catalog contains only plural messages; the rest
                // of the UI copy lives in the custom useT catalogs.
                const messages = unref(nuxtApp.$i18n.locale) === 'uk' ? uk : en;
                useToast().error(messages.profile.appearance.saveError);
            }
        });
        saves = request;
        return request;
    };

    return {
        mascot,
        palette,
        hydrate,
        reset,
        setMascot: (value: Mascot) => save('mascot', value),
        setPalette: (value: Palette) => save('palette', value),
    };
});
