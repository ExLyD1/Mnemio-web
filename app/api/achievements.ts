import { http } from '@/utils/http';
import type { Achievement } from '@/types/achievement';

export const listAchievements = (): Promise<{ items: Achievement[] }> =>
    http<{ items: Achievement[] }>('/achievements');
