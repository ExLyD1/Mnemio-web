import type { SrsRating } from '@/types/srs';

export interface GradeDef {
    key: SrsRating;
    /** English fallback label; the UI renders the localized `i18nKey` instead. */
    label: string;
    /** i18n catalog key for the button label (localized via `useT`). */
    i18nKey: string;
    interval: string;
    tone: 'ghost' | 'dark' | 'good' | 'easy';
    hint: string;
}

/** The four spaced-repetition grades shown in the practice RatingRow. */
export const GRADES: GradeDef[] = [
    {
        key: 'again',
        label: 'Forgot',
        i18nKey: 'study.gradeForgot',
        interval: '10m',
        tone: 'ghost',
        hint: '1',
    },
    {
        key: 'hard',
        label: 'Hard',
        i18nKey: 'study.gradeHard',
        interval: '1d',
        tone: 'dark',
        hint: '2',
    },
    {
        key: 'good',
        label: 'Good',
        i18nKey: 'study.gradeGood',
        interval: '3d',
        tone: 'good',
        hint: '3',
    },
    {
        key: 'easy',
        label: 'Easy',
        i18nKey: 'study.gradeEasy',
        interval: '6d',
        tone: 'easy',
        hint: '4',
    },
];
