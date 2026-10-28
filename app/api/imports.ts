import { http } from '@/utils/http';
import type { Achievement } from '@/types/achievement';
import type { Subject } from '@/utils/subjects';

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
    // Omitted → the server classifies each imported deck.
    subject?: Subject,
): Promise<ApkgImportResult> => {
    const form = new FormData();
    form.append('file', file);
    form.append('sourceLanguage', sourceLanguage);
    form.append('targetLanguage', targetLanguage);
    if (subject) {
        form.append('subject', subject);
    }
    return http<ApkgImportResult>('/imports/apkg', { method: 'POST', body: form });
};
