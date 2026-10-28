import type { Subject } from '@/utils/subjects';

/** A Discover tile: one of the 12 subjects and its public-deck count. */
export interface DiscoverCategory {
    subject: Subject;
    count: number;
}

/** Public language decks per target language (count > 0). */
export interface DiscoverLanguageCount {
    lang: string;
    count: number;
}

/** GET /(public/)discover/categories — all 12 subjects (zeros included), in order. */
export interface DiscoverCategories {
    items: DiscoverCategory[];
    languages: DiscoverLanguageCount[];
}
