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

    return { reviewedToday, streak, retention, monthCalendar };
};
