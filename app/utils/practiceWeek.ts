import type { StatsSeriesPoint } from '@/types/stats';

/**
 * Single definition of "this week" / "today" for every stats surface
 * (dashboard, statistics, profile). Before this, each page counted
 * "days practiced" over whatever series range it happened to load — 30 days
 * on /statistics (under a "this week" label, so it could read 8), a rolling 7
 * days on /profile — so the same user saw 5 in one place and 8 in another
 * (QA (3) #2/#4, (2) #3).
 *
 * `stats.series` is keyed by the user's LOCAL calendar day (the backend buckets
 * activity by the X-Timezone the client sends — see utils/http.ts), so the
 * week and "today" are anchored to the local calendar too.
 * Any series range the pages load ('7' and up) always covers Monday → today.
 */

export const WEEK_DAY_ABBR = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

export interface WeekDayPoint {
    iso: string;
    label: string;
    value: number;
    isFuture: boolean;
    isToday: boolean;
}

// Local calendar day as a day-counter Date (UTC midnight of the local date),
// so the arithmetic below never trips over DST.
const localToday = (now: Date): Date =>
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

export const todayIso = (now: Date = new Date()): string =>
    localToday(now).toISOString().slice(0, 10);

/** The current ISO week (Monday..Sunday). Days after today render as 0. */
export const currentWeekSeries = (
    series: StatsSeriesPoint[],
    now: Date = new Date(),
): WeekDayPoint[] => {
    const today = localToday(now);
    const utcDow = today.getUTCDay(); // 0=Sun..6=Sat
    const isoDow = utcDow === 0 ? 7 : utcDow; // 1=Mon..7=Sun
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - (isoDow - 1));

    const byIso = new Map(series.map((pt) => [pt.label, pt.value]));
    return WEEK_DAY_ABBR.map((label, i) => {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const isFuture = d > today;
        return {
            iso,
            label,
            value: isFuture ? 0 : (byIso.get(iso) ?? 0),
            isFuture,
            isToday: d.getTime() === today.getTime(),
        };
    });
};

export const daysPracticedThisWeek = (series: StatsSeriesPoint[], now: Date = new Date()): number =>
    currentWeekSeries(series, now).filter((p) => p.value > 0).length;

export const reviewedToday = (series: StatsSeriesPoint[], now: Date = new Date()): number => {
    const iso = todayIso(now);
    return series.find((p) => p.label === iso)?.value ?? 0;
};

/** BCP-47 tag for date formatting in the active UI locale. */
export const dateLocaleFor = (locale: string): string => (locale === 'uk' ? 'uk-UA' : 'en-US');

/**
 * Short weekday name ("Mo" / "пн") for a 'YYYY-MM-DD' day key. The day
 * pips and chart axes used a hardcoded English list, so the Ukrainian UI
 * showed "Tu We Th…" (QA (1) #5 screenshot).
 */
export const weekdayShort = (iso: string, locale: string): string => {
    const d = new Date(`${iso}T00:00:00Z`);
    if (isNaN(d.getTime())) {
        return iso;
    }
    const s = d.toLocaleDateString(dateLocaleFor(locale), { timeZone: 'UTC', weekday: 'short' });
    return s.charAt(0).toUpperCase() + s.slice(1);
};
