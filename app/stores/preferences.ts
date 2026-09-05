import { defineStore, ref } from '#imports';
import * as prefsApi from '@/api/preferences';
import type { Preference, PreferenceInput } from '@/types/user';

export const usePreferencesStore = defineStore('preferences', () => {
    const interests = ref<string[]>([]);
    const goal = ref<string | null>(null);
    const nativeLanguage = ref<string | null>(null);
    const learningLanguages = ref<string[]>([]);
    const avatarHue = ref<number | null>(null);
    const mimiPlacement = ref<'left' | 'right' | null>(null);
    const favorites = ref<string[]>([]);
    const loaded = ref(false);

    const apply = (p: Preference) => {
        interests.value = p.interests;
        goal.value = p.goal;
        nativeLanguage.value = p.nativeLanguage;
        learningLanguages.value = p.learningLanguages;
        avatarHue.value = p.avatarHue;
        mimiPlacement.value = p.mimiPlacement;
        favorites.value = p.favorites;
    };

    const hydrate = async () => {
        const p = await prefsApi.getPreferences();
        apply(p);
        loaded.value = true;
    };

    const update = async (patch: PreferenceInput) => {
        const p = await prefsApi.updatePreferences(patch);
        apply(p);
        return p;
    };

    // Clears everything back to defaults, including `loaded`. Call this on
    // logout - without it, a stale user's preferences (native/learning
    // languages especially) stay in this store's memory across an in-app
    // account switch (logout -> login as someone else, no full page reload)
    // and get treated as if they were the new user's already-loaded real data.
    const reset = () => {
        interests.value = [];
        goal.value = null;
        nativeLanguage.value = null;
        learningLanguages.value = [];
        avatarHue.value = null;
        mimiPlacement.value = null;
        favorites.value = [];
        loaded.value = false;
    };

    const isFavorite = (deckId: string): boolean => favorites.value.includes(deckId);

    const toggleFavorite = async (deckId: string): Promise<void> => {
        const prev = favorites.value;
        favorites.value = prev.includes(deckId)
            ? prev.filter((id) => id !== deckId)
            : [...prev, deckId];
        try {
            await prefsApi.updatePreferences({ favorites: favorites.value });
        } catch {
            favorites.value = prev; // revert on failure
        }
    };

    return {
        interests,
        goal,
        nativeLanguage,
        learningLanguages,
        avatarHue,
        mimiPlacement,
        favorites,
        loaded,
        hydrate,
        update,
        reset,
        isFavorite,
        toggleFavorite,
    };
});
