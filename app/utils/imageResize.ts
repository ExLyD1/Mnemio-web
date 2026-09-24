/**
 * Downscale + re-encode a user-picked photo to a small JPEG before upload.
 *
 * The avatar picker accepts `image/*`, but the backend only takes
 * png/jpeg/webp up to 2 MB. A normal phone photo (3–8 MB, or HEIC on iOS)
 * was therefore rejected and the user only saw "Couldn't upload photo"
 * (QA (3) #4). Avatars render at ≤96 px, so 512 px is plenty.
 */
export class ImageDecodeError extends Error {}

const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new ImageDecodeError('decode'));
        img.src = url;
    });

export const downscaleToJpeg = async (file: Blob, maxSide = 512, quality = 0.88): Promise<File> => {
    const url = URL.createObjectURL(file);
    try {
        const img = await loadImage(url);
        const { naturalWidth: w0, naturalHeight: h0 } = img;
        if (!w0 || !h0) {
            throw new ImageDecodeError('empty');
        }
        const scale = Math.min(1, maxSide / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * scale));
        const h = Math.max(1, Math.round(h0 * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new ImageDecodeError('canvas');
        }
        // JPEG has no alpha — paint transparent PNG areas white, not black.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new ImageDecodeError('encode'))),
                'image/jpeg',
                quality,
            ),
        );
        return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    } finally {
        URL.revokeObjectURL(url);
    }
};
