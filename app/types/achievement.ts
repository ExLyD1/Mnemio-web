export interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    iconKey: string;
    earned: boolean;
    earnedAt: string | null;
    progress: number;
}
