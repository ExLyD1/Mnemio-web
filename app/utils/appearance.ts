import type { Mascot, MimiMood, MimiPose, Palette } from '../types/mimi';

export const MASCOTS: readonly Mascot[] = ['panda', 'red', 'pink', 'axolotl'];
export const PALETTES: readonly Palette[] = ['green', 'violet', 'pink'];
export const isMascot = (value: unknown): value is Mascot => MASCOTS.includes(value as Mascot);
export const isPalette = (value: unknown): value is Palette => PALETTES.includes(value as Palette);

export const MOOD_POSE: Record<MimiMood, MimiPose> = {
    idle: 'neutral',
    good: 'wave',
    easy: 'cheer',
    streak: 'cheer',
    done: 'cheer',
    hard: 'point',
    forgot: 'sleepy',
};

export const mimiSource = (mascot: Mascot, pose: MimiPose): string =>
    `/images/mimi/${mascot}/${pose === 'surprised' && mascot !== 'axolotl' ? 'point' : pose}.svg`;

// Also runs on the SSR-disabled app routes, before styles or hydration paint.
// Cookies win; storage is a fallback for browsers that have lost the cookie.
export const APPEARANCE_INIT_SCRIPT = `(()=>{try{let p;const c=document.cookie.match(/(?:^|;\\s*)mnemio-palette=([^;]*)/);if(c){p=decodeURIComponent(c[1])}else{try{p=JSON.parse(localStorage.getItem('mnemio-appearance')||'{}').palette}catch{}}const h=document.documentElement;h.classList.remove('pal-violet','pal-pink');if(p==='violet'||p==='pink')h.classList.add('pal-'+p)}catch{}})();`;
