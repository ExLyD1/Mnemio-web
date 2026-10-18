import { http } from '@/utils/http';
import type { Achievement } from '@/types/achievement';

export interface ApkgImportResult {
    decks: { id: string; title: string; cardCount: number }[];
    cardsImported: number;
    cardsSkipped: number;
    mediaImported: number;
    warnings: string[];
    newAchievements: Achievement[];
}

export const importApkg = (
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
): Promise<ApkgImportResult> => {
    const form = new FormData();
    form.append('file', file);
    form.append('sourceLanguage', sourceLanguage);
    form.append('targetLanguage', targetLanguage);
    return http<ApkgImportResult>('/imports/apkg', { method: 'POST', body: form });
};
