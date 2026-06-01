/** Deck cover colours, extracted from the new_design mockups. */
export const COVER_SWATCHES = [
    '#572F54',
    '#6E4A6B',
    '#482B41',
    '#7C4576',
    '#8E5A88',
    '#553A66',
] as const;

export type CoverSwatch = (typeof COVER_SWATCHES)[number];

/** Deterministically pick a cover swatch from a stable key (e.g. a deck id). */
export const swatchFor = (key: string): string => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % COVER_SWATCHES.length;
    return COVER_SWATCHES[idx] ?? COVER_SWATCHES[0];
};

/** Radial sheen used on deck covers, tinted by the deck's swatch. */
export const coverGradient = (swatch: string): string =>
    `radial-gradient(120% 90% at 22% 8%, ${swatch}, transparent 62%)`;
