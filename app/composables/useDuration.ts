import { useT } from '@/composables/useT';
import { splitDuration, splitDurationDays, type DurationUnit } from '@/utils/duration';

const UNIT_KEY: Record<DurationUnit, string> = {
    min: 'study.unitMin',
    hour: 'study.unitHour',
    day: 'study.unitDay',
    month: 'study.unitMonth',
    year: 'study.unitYear',
};

/**
 * Localized duration labels for SRS scheduling ("next review in ...").
 * Single formatter shared by RatingRow previews and the review "next due"
 * copy -- previously review/index.vue had its own ad-hoc hours/days-only
 * formatNext() with no minutes unit at all.
 */
export const useDuration = () => {
    const { t } = useT();

    const formatDuration = (ms: number): string => {
        const { value, unit } = splitDuration(ms);
        return t(UNIT_KEY[unit]).replace('{n}', String(value));
    };

    const formatDays = (days: number): string => {
        const { value, unit } = splitDurationDays(days);
        return t(UNIT_KEY[unit]).replace('{n}', String(value));
    };

    return { formatDuration, formatDays };
};
