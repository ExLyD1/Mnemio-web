export const DECK_CATEGORIES = ['languages', 'tech', 'other'] as const;
export type DeckCategory = (typeof DECK_CATEGORIES)[number];

/**
 * Maps a free-form subject string (from old decks) to the nearest fixed category.
 * New decks always send one of the three enum values directly.
 */
export const normCategory = (subject: string | null | undefined): DeckCategory => {
    if (!subject) {
        return 'other';
    }
    const s = subject.toLowerCase();
    if (
        s === 'languages' ||
        s.includes('lang') ||
        s.includes('мова') ||
        s.includes('english') ||
        s.includes('ukrainian') ||
        s.includes('spanish') ||
        s.includes('french') ||
        s.includes('german') ||
        s.includes('italian') ||
        s.includes('japanese') ||
        s.includes('chinese') ||
        s.includes('korean') ||
        s.includes('portuguese')
    ) {
        return 'languages';
    }
    if (
        s === 'tech' ||
        s.includes('tech') ||
        s.includes('programming') ||
        s.includes('code') ||
        s.includes('git') ||
        s.includes('computer') ||
        s.includes('software') ||
        s.includes('developer') ||
        s.includes('engineering')
    ) {
        return 'tech';
    }
    return 'other';
};
