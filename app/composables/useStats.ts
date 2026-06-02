import { computed } from 'vue';
import { useSrsStore } from '@/stores/srs';

export interface HeatCell {
    day: number;
    inMonth: boolean;
    level: number;
    today: boolean;
}

/** Deterministic pseudo-random in [0, 1) for stable mock heatmaps. */
const seeded = (n: number): number => {
    const x = Math.sin(n) * 10000;
    return x - Math.floor(x);
};

/**
 * Slim stats source. Derives what it can from SRS; mocks streak/retention and
 * calendar heat until the backend exposes them (plan §5.2). Extended in Phase F.
 */
export const useStats = () => {
    const srs = useSrsStore();

    const reviewedToday = computed<number>(() => {
        const today = new Date().toDateString();
        return Object.values(srs.progress).filter(
            (p) => p.lastReviewedAt !== null && new Date(p.lastReviewedAt).toDateString() === today,
        ).length;
    });

    const streak = computed<number>(() => 7);
    const retention = computed<number>(() => 92);

    const monthCalendar = (year: number, month: number): HeatCell[][] => {
        const today = new Date();
        const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: HeatCell[] = [];

        for (let i = 0; i < firstWeekday; i += 1) {
            cells.push({ day: 0, inMonth: false, level: 0, today: false });
        }
        for (let d = 1; d <= daysInMonth; d += 1) {
            const isToday =
                d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const future =
                year > today.getFullYear() ||
                (year === today.getFullYear() &&
                    (month > today.getMonth() ||
                        (month === today.getMonth() && d > today.getDate())));
            const level = future ? 0 : Math.floor(seeded(year * 372 + month * 31 + d) * 5);
            cells.push({ day: d, inMonth: true, level, today: isToday });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ day: 0, inMonth: false, level: 0, today: false });
        }

        const weeks: HeatCell[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
        }
        return weeks;
    };

    const yearHeat = (): number[][] => {
        const weeks: number[][] = [];
        const todayDow = new Date().getDay();
        for (let w = 0; w < 53; w += 1) {
            const days: number[] = [];
            for (let d = 0; d < 7; d += 1) {
                const future = w === 52 && d > todayDow;
                days.push(future ? 0 : Math.floor(seeded(w * 7 + d + 1) * 5));
            }
            weeks.push(days);
        }
        return weeks;
    };

    const dailySeries = (days: number): { label: string; value: number }[] => {
        const out: { label: string; value: number }[] = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i -= 1) {
            const date = new Date(today.getTime() - i * 86400000);
            out.push({
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                value: Math.floor(seeded(Math.floor(date.getTime() / 86400000)) * 55) + 5,
            });
        }
        return out;
    };

    const achievements: { id: string; name: string; note: string; earned: boolean }[] = [
        { id: 'first-deck', name: 'First steps', note: 'Created your first deck', earned: true },
        { id: 'streak-7', name: 'Week warrior', note: 'Kept a 7-day streak', earned: true },
        { id: 'cards-100', name: 'Century', note: 'Reviewed 100 cards', earned: true },
        { id: 'mastered-50', name: 'Half-mast', note: 'Master 50 cards', earned: false },
        { id: 'streak-30', name: 'Unstoppable', note: 'Keep a 30-day streak', earned: false },
        { id: 'night-owl', name: 'Night owl', note: 'Study after midnight', earned: false },
        { id: 'polyglot', name: 'Polyglot', note: 'Study three languages', earned: false },
        { id: 'perfect', name: 'Flawless', note: 'A perfect session', earned: true },
    ];

    return {
        reviewedToday,
        streak,
        retention,
        monthCalendar,
        yearHeat,
        dailySeries,
        achievements,
    };
};
