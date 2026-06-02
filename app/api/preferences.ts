import { http } from '@/utils/http';
import type { Preference, PreferenceInput } from '@/types/user';

export const getPreferences = (): Promise<Preference> => http<Preference>('/users/me/preferences');

export const updatePreferences = (patch: PreferenceInput): Promise<Preference> =>
    http<Preference>('/users/me/preferences', { method: 'PATCH', body: patch });
