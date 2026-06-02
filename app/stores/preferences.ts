import { defineStore } from '#imports';
import { useStorage } from '@vueuse/core';

/**
 * Client-only preferences persisted to localStorage until a backend
 * `/preferences` endpoint exists (see plan §5.6).
 */
export const usePreferencesStore = defineStore('preferences', () => {
    const favorites = useStorage<string[]>('mnemio:favorites', []);
    const interests = useStorage<string[]>('mnemio:interests', []);
    const goal = useStorage<string>('mnemio:goal', 'steady');
    const nativeLanguage = useStorage<string>('mnemio:native-language', 'en');
    const learningLanguages = useStorage<string[]>('mnemio:learning-languages', []);

    const isFavorite = (deckId: string): boolean => favorites.value.includes(deckId);

    const toggleFavorite = (deckId: string): void => {
        favorites.value = isFavorite(deckId)
            ? favorites.value.filter((id) => id !== deckId)
            : [...favorites.value, deckId];
    };

    return {
        favorites,
        interests,
        goal,
        nativeLanguage,
        learningLanguages,
        isFavorite,
        toggleFavorite,
    };
});
