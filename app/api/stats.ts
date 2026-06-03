import { http } from '@/utils/http';
import type {
    DeckPerformance,
    StatsActivity,
    StatsOverview,
    StatsRange,
    StatsSeries,
} from '@/types/stats';

export const getOverview = (range: StatsRange = '30'): Promise<StatsOverview> =>
    http<StatsOverview>('/stats/overview', { query: { range } });

export const getSeries = (range: StatsRange = '30'): Promise<StatsSeries> =>
    http<StatsSeries>('/stats/series', { query: { range } });

export const getActivity = (): Promise<StatsActivity> => http<StatsActivity>('/stats/activity');

export const getDeckPerformance = (): Promise<{ items: DeckPerformance[] }> =>
    http<{ items: DeckPerformance[] }>('/stats/decks');
