import { http } from '@/utils/http';

export type MediaKind = 'avatar' | 'card_image' | 'card_audio';

export interface MediaUploadResult {
    url: string;
    kind: MediaKind;
    size: number;
    mimeType: string;
}

export const uploadMedia = (kind: MediaKind, file: File): Promise<MediaUploadResult> => {
    const form = new FormData();
    form.append('file', file);
    return http<MediaUploadResult>('/media/uploads', {
        method: 'POST',
        query: { kind },
        body: form,
    });
};
