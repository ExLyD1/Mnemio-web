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
