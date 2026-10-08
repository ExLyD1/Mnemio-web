export type DurationUnit = 'min' | 'hour' | 'day' | 'month' | 'year';

const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Pure: ms -> the largest sensible whole unit. No i18n, no side effects.
 * Used by useDuration to label SRS rating buttons / "next review" copy.
 * Always returns at least 1 in the chosen unit so nothing renders as "0".
 */
export const splitDuration = (ms: number): { value: number; unit: DurationUnit } => {
    const abs = Math.max(0, ms);
    if (abs < HOUR_MS) {
        return { value: Math.max(1, Math.round(abs / MIN_MS)), unit: 'min' };
    }
    if (abs < DAY_MS) {
        return { value: Math.max(1, Math.round(abs / HOUR_MS)), unit: 'hour' };
    }
    if (abs < MONTH_MS) {
        return { value: Math.max(1, Math.round(abs / DAY_MS)), unit: 'day' };
    }
    if (abs < YEAR_MS) {
        return { value: Math.max(1, Math.round(abs / MONTH_MS)), unit: 'month' };
    }
    return { value: Math.max(1, Math.round(abs / YEAR_MS)), unit: 'year' };
};

/** Same split, but starting from a whole number of days (server's unit). */
export const splitDurationDays = (days: number): { value: number; unit: DurationUnit } =>
    splitDuration(Math.max(0, days) * DAY_MS);
