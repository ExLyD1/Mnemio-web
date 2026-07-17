import { http } from '@/utils/http';
import type {
    DeckPerformance,
    StatsActivity,
    StatsCardSeries,
    StatsDecksStudied,
    StatsOverview,
    StatsPerformance,
    StatsRange,
    StatsSeries,
    StatsStudyTimeSeries,
} from '@/types/stats';

export const getOverview = (range: StatsRange = '30'): Promise<StatsOverview> =>
    http<StatsOverview>('/stats/overview', { query: { range } });

export const getSeries = (range: StatsRange = '30'): Promise<StatsSeries> =>
    http<StatsSeries>('/stats/series', { query: { range } });

export const getActivity = (): Promise<StatsActivity> => http<StatsActivity>('/stats/activity');

export const getDeckPerformance = (): Promise<{ items: DeckPerformance[] }> =>
    http<{ items: DeckPerformance[] }>('/stats/decks');

const clientTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getStudyTime = (range: StatsRange = '30'): Promise<StatsStudyTimeSeries> =>
    http<StatsStudyTimeSeries>('/stats/study-time', { query: { range, tz: clientTz() } });

export const getDecksStudied = (range: StatsRange = '30'): Promise<StatsDecksStudied> =>
    http<StatsDecksStudied>('/stats/decks-studied', { query: { range, tz: clientTz() } });

export const getCardSeries = (range: StatsRange = '30'): Promise<StatsCardSeries> =>
    http<StatsCardSeries>('/stats/card-series', { query: { range, tz: clientTz() } });

export const getPerformance = (range: StatsRange = '30'): Promise<StatsPerformance> =>
    http<StatsPerformance>('/stats/performance', { query: { range } });
