import type { SrsRating } from '@/types/srs';

export interface GradeDef {
    key: SrsRating;
    /** English fallback label; the UI renders the localized `i18nKey` instead. */
    label: string;
    /** i18n catalog key for the button label (localized via `useT`). */
    i18nKey: string;
    tone: 'ghost' | 'dark' | 'good' | 'easy';
    hint: string;
}

/**
 * The four spaced-repetition grades shown in the practice RatingRow.
 *
 * These used to advertise a fixed next interval per grade (10m / 1d / 3d / 6d).
 * Verified against the server's SM-2 (backend src/services/sm2.ts): on a first
 * review EVERY grade schedules 1 day, and thereafter the interval depends on
 * the card's own repetition count and ease factor. Only `hard` ever matched.
 * A fixed label cannot be correct here, so the promise is gone rather than
 * replaced with a different wrong number.
 */
export const GRADES: GradeDef[] = [
    {
        key: 'again',
        label: 'Forgot',
        i18nKey: 'study.gradeForgot',
        tone: 'ghost',
        hint: '1',
    },
    {
        key: 'hard',
        label: 'Hard',
        i18nKey: 'study.gradeHard',
        tone: 'dark',
        hint: '2',
    },
    {
        key: 'good',
        label: 'Good',
        i18nKey: 'study.gradeGood',
        tone: 'good',
        hint: '3',
    },
    {
        key: 'easy',
        label: 'Easy',
        i18nKey: 'study.gradeEasy',
        tone: 'easy',
        hint: '4',
    },
];
