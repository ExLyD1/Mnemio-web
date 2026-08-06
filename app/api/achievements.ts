import { http } from '@/utils/http';
import type { Achievement } from '@/types/achievement';

export const listAchievements = (): Promise<{ items: Achievement[] }> =>
    http<{ items: Achievement[] }>('/achievements');

/** Earned but not yet acknowledged — backs the notification bell. */
export const getUnseenAchievements = (): Promise<{ items: Achievement[] }> =>
    http<{ items: Achievement[] }>('/achievements/unseen');

/** Marks achievements as seen so they stop surfacing as toasts/in the bell. Omit `keys` to ack everything unseen. */
export const ackAchievements = (keys?: string[]): Promise<{ acknowledged: string[] }> =>
    http<{ acknowledged: string[] }>('/achievements/ack', {
        method: 'POST',
        body: keys ? { keys } : {},
    });
