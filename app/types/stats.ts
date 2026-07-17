export type StatsRange = '7' | '30' | '90' | 'all';

export interface StatsTrend {
    current: number;
    previous: number;
    deltaPct: number;
}

export interface StatsOverview {
    range: StatsRange;
    reviewed: number;
    correct: number;
    retention: number;
    streak: number;
    dueCount: number;
    trends: {
        reviewed: StatsTrend;
        retention: StatsTrend;
    };
}

export interface StatsSeriesPoint {
    label: string;
    value: number;
}

export interface StatsSeries {
    range: StatsRange;
    points: StatsSeriesPoint[];
}

export interface MonthCalendarDay {
    date: string;
    reviews: number;
}

export interface StatsActivity {
    yearHeat: number[][];
    monthCalendar: {
        month: string;
        days: (MonthCalendarDay | null)[];
    };
}

export interface DeckPerformance {
    deckId: string;
    title: string;
    cardCount: number;
    masteryPct: number;
    retention: number;
    reviewed: number;
}

export interface StatsStudyTimeSeries {
    range: StatsRange;
    unit: 'ms';
    points: StatsSeriesPoint[];
}

export interface DeckStudied {
    deckId: string;
    title: string;
    sessionCount: number;
    cardsReviewed: number;
    lastStudiedAt: string;
}

export interface StatsDecksStudied {
    range: StatsRange;
    items: DeckStudied[];
}

export interface StatsCardSeries {
    range: StatsRange;
    pending: boolean;
    metric: string | null;
    points: StatsSeriesPoint[];
}

export interface StatsPerformance {
    range: StatsRange;
    userRecall: number; // 0..100
    percentile: number; // 0..100 — share of peers strictly below the user
    sampleSize: number; // eligible learners compared (incl. the user)
    buckets: number[]; // 10 counts: [0,10) … [90,100]
    enoughData: boolean;
}
