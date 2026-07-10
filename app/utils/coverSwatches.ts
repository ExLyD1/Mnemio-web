/** Vibrant deck cover gradients (oklch pairs — harmonised L/C, hue varies). */
export const COVER_GRADIENTS = {
    violet: 'linear-gradient(150deg, #9B5DE5, #6A0DAD)',
    blue: 'linear-gradient(150deg, #4895EF, #1A56DB)',
    teal: 'linear-gradient(150deg, #2EC4B6, #0A7E75)',
    pink: 'linear-gradient(150deg, #F72585, #B5179E)',
    amber: 'linear-gradient(150deg, #F4A261, #E07C2A)',
    coral: 'linear-gradient(150deg, #FF6B6B, #C9184A)',
    indigo: 'linear-gradient(150deg, #7B5EA7, #4A3580)',
    mint: 'linear-gradient(150deg, #43D98E, #1A9E60)',
} as const;

export type CoverKey = keyof typeof COVER_GRADIENTS;
const KEYS = Object.keys(COVER_GRADIENTS) as CoverKey[];

/** Deterministically pick a gradient from a stable key (e.g. deck id). */
export const coverGradientFor = (key: string): string => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return COVER_GRADIENTS[KEYS[Math.abs(hash) % KEYS.length] ?? 'violet'];
};

/** @deprecated Use coverGradientFor. Kept for call-site compatibility. */
export const swatchFor = (key: string): string => coverGradientFor(key);

/** @deprecated No-op shim — gradient is now in the swatch value itself. */
export const coverGradient = (_swatch: string): string => '';
