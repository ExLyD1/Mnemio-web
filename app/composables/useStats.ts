import { ref, computed } from 'vue';
import * as statsApi from '@/api/stats';
import type {
    DeckStudied,
    StatsActivity,
    StatsOverview,
    StatsRange,
    StatsSeriesPoint,
} from '@/types/stats';

export interface HeatCell {
    day: number;
    inMonth: boolean;
    level: number;
    today: boolean;
}

interface ActivityVM {
    yearHeat: number[][];
    monthWeeks: HeatCell[][];
    monthLabel: string;
}

/** Map a raw review count to a 0..4 heat level for the calendar/heatmap palettes. */
const toLevel = (reviews: number): number => {
    if (reviews <= 0) {
        return 0;
    }
    if (reviews < 3) {
        return 1;
    }
    if (reviews < 6) {
        return 2;
    }
    if (reviews < 10) {
        return 3;
    }
    return 4;
};

const buildMonth = (mc: StatsActivity['monthCalendar']): { weeks: HeatCell[][]; label: string } => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const cells: HeatCell[] = mc.days.map((d) =>
        d
            ? {
                  day: Number(d.date.slice(8, 10)),
                  inMonth: true,
                  level: toLevel(d.reviews),
                  today: d.date === todayIso,
              }
            : { day: 0, inMonth: false, level: 0, today: false },
    );
    while (cells.length % 7 !== 0) {
        cells.push({ day: 0, inMonth: false, level: 0, today: false });
    }
    const weeks: HeatCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }
    const label = new Date(`${mc.month}-01T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
    return { weeks, label };
};

export const useStats = () => {
    const overview = ref<StatsOverview | null>(null);
    const activity = ref<ActivityVM | null>(null);
    const series = ref<StatsSeriesPoint[]>([]);
    const studyTime = ref<StatsSeriesPoint[]>([]);
    const decksStudied = ref<DeckStudied[]>([]);
    const cardSeries = ref<StatsSeriesPoint[]>([]);
    const cardSeriesPending = ref<boolean>(true);
    const loading = ref(false);

    const reviewed = computed(() => overview.value?.reviewed ?? 0);
    const streak = computed(() => overview.value?.streak ?? 0);
    const retention = computed(() => overview.value?.retention ?? 0);
    const dueCount = computed(() => overview.value?.dueCount ?? 0);
    const yearHeat = computed(() => activity.value?.yearHeat ?? []);
    const monthWeeks = computed(() => activity.value?.monthWeeks ?? []);
    const monthLabel = computed(() => activity.value?.monthLabel ?? '');

    const loadSeries = async (range: StatsRange = '30') => {
        const res = await statsApi.getSeries(range);
        series.value = res.points;
    };

    const loadStudyTime = async (range: StatsRange = '30') => {
        const res = await statsApi.getStudyTime(range);
        studyTime.value = res.points;
    };

    const loadDecksStudied = async (range: StatsRange = '30') => {
        const res = await statsApi.getDecksStudied(range);
        decksStudied.value = res.items;
    };

    const loadCardSeries = async (range: StatsRange = '30') => {
        const res = await statsApi.getCardSeries(range);
        cardSeriesPending.value = res.pending;
        cardSeries.value = res.points;
    };

    const load = async (range: StatsRange = '30') => {
        loading.value = true;
        try {
            const [ov, act] = await Promise.all([
                statsApi.getOverview(range),
                statsApi.getActivity(),
            ]);
            overview.value = ov;
            const month = buildMonth(act.monthCalendar);
            activity.value = {
                yearHeat: act.yearHeat.map((col) => col.map(toLevel)),
                monthWeeks: month.weeks,
                monthLabel: month.label,
            };
        } finally {
            loading.value = false;
        }
    };

    return {
        overview,
        activity,
        series,
        studyTime,
        decksStudied,
        cardSeries,
        cardSeriesPending,
        loading,
        reviewed,
        streak,
        retention,
        dueCount,
        yearHeat,
        monthWeeks,
        monthLabel,
        load,
        loadSeries,
        loadStudyTime,
        loadDecksStudied,
        loadCardSeries,
    };
};
