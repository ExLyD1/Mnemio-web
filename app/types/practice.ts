import type { SrsRating } from '@/types/srs';

export interface RevisitWord {
    word: string;
    reading: string | null;
    meaning: string;
}

export interface PracticeResult {
    deckId: string;
    deckTitle: string;
    reviewed: number;
    correct: number;
    streak: number;
    timeMs: number;
    counts: Record<SrsRating, number>;
    revisit: RevisitWord[];
}
