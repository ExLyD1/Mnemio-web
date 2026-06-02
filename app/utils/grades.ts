import type { SrsRating } from '@/types/srs';

export interface GradeDef {
    key: SrsRating;
    label: string;
    interval: string;
    tone: 'ghost' | 'dark' | 'good' | 'easy';
    hint: string;
}

/** The four spaced-repetition grades shown in the practice RatingRow. */
export const GRADES: GradeDef[] = [
    { key: 'again', label: 'Forgot', interval: '10m', tone: 'ghost', hint: '1' },
    { key: 'hard', label: 'Hard', interval: '1d', tone: 'dark', hint: '2' },
    { key: 'good', label: 'Good', interval: '3d', tone: 'good', hint: '3' },
    { key: 'easy', label: 'Easy', interval: '6d', tone: 'easy', hint: '4' },
];
