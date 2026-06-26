/** Vibrant deck cover gradients (oklch pairs — harmonised L/C, hue varies). */
export const COVER_GRADIENTS = {
    violet: 'linear-gradient(150deg, oklch(0.64 0.20 300), oklch(0.48 0.17 285))',
    blue: 'linear-gradient(150deg, oklch(0.64 0.15 252), oklch(0.46 0.15 262))',
    teal: 'linear-gradient(150deg, oklch(0.70 0.14 175), oklch(0.54 0.13 192))',
    pink: 'linear-gradient(150deg, oklch(0.68 0.21 350), oklch(0.50 0.20 330))',
    amber: 'linear-gradient(150deg, oklch(0.76 0.15 75),  oklch(0.62 0.15 48))',
    coral: 'linear-gradient(150deg, oklch(0.67 0.19 25),  oklch(0.50 0.18 12))',
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
