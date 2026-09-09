import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./app/**/*.{html,ts,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito Sans', 'sans-serif'],
                display: ['Fraunces', 'Georgia', 'serif'],
            },
            fontSize: {
                h1: ['32px', { lineHeight: '40px', fontWeight: '700' }],
                h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
                h3: ['18px', { lineHeight: '24px', fontWeight: '600' }],
                body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
                small: ['12px', { lineHeight: '16px', fontWeight: '400' }],
                display: [
                    'clamp(2.5rem, 6vw, 5rem)',
                    { lineHeight: '0.96', letterSpacing: '-0.03em', fontWeight: '400' },
                ],
                'display-sm': [
                    'clamp(1.75rem, 4vw, 3rem)',
                    { lineHeight: '1.04', letterSpacing: '-0.025em', fontWeight: '400' },
                ],
                eyebrow: [
                    '12px',
                    { lineHeight: '16px', letterSpacing: '0.18em', fontWeight: '600' },
                ],
            },
            colors: {
                // EVERY color here is backed by a CSS variable from
                // assets/css/main.css (:root/.dark + .light) — see the theme
                // handoff specs. Token NAMES here (purple/plum/pink/lavender) are
                // held over from the original Lavender palette and now carry the
                // Green Accent values; read them by role, not by hue — `purple` is
                // the accent, `plum*` the deep fill ramp, `pink` the soft tint.
                // There are no literal hexes left in this map on
                // purpose: a literal survives the theme switch and turns into
                // invisible text or a dark slab in the opposite theme.
                //
                // Solid colors use `rgb(var(--x) / <alpha-value>)` so `/50`
                // modifiers keep working. Tokens with an *intrinsic* per-theme
                // opacity (wells, tracks, hairlines, dim/faint ink) read their
                // alpha from a `--c-a-*` var instead, and therefore cannot take
                // an additional `/nn` modifier.
                bg: {
                    landing: 'rgb(var(--c-bg-base) / <alpha-value>)',
                    'landing-2': 'rgb(var(--c-bg-base-2) / <alpha-value>)',
                    base: 'rgb(var(--c-bg-base) / <alpha-value>)',
                    'base-2': 'rgb(var(--c-bg-base-2) / <alpha-value>)',
                    deep: 'rgb(var(--c-bg-deep) / <alpha-value>)',
                    surface: 'rgb(var(--c-bg-surface) / <alpha-value>)',
                    'surface-2': 'rgb(var(--c-bg-surface-2) / <alpha-value>)',
                    // translucent so the page glow shows through
                    well: 'rgb(var(--c-well) / var(--c-a-well))',
                    // progress / heatmap / keycap tracks
                    muted: 'rgb(var(--c-track) / var(--c-a-track))',
                    rail: 'var(--c-rail-bg)',
                    top: 'var(--c-top-bg)',
                    panel: 'var(--c-panel-solid)',
                },
                // `brand` is the deep-fill (plum) ramp. NOTE: brand-muted / brand-pale are
                // *secondary and tertiary ink*, so per the specs' decision table
                // they resolve to the cream ladder, not to a plum tint.
                brand: {
                    dark: 'rgb(var(--c-plum-deep) / <alpha-value>)',
                    DEFAULT: 'rgb(var(--c-plum) / <alpha-value>)',
                    bright: 'rgb(var(--c-purple) / <alpha-value>)',
                    muted: 'rgb(var(--c-cream) / var(--c-a-dim))',
                    pale: 'rgb(var(--c-cream) / var(--c-a-faint))',
                    light: 'rgb(var(--c-cream) / <alpha-value>)',
                },
                // Ink for page + card surfaces. LIGHT in dark mode, DARK in light mode.
                cream: {
                    DEFAULT: 'rgb(var(--c-cream) / <alpha-value>)',
                    dim: 'rgb(var(--c-cream) / var(--c-a-dim))',
                    faint: 'rgb(var(--c-cream) / var(--c-a-faint))',
                },
                // Ink for plum / gradient fills. The exact opposite of `cream`:
                // DARK-mode light, LIGHT-mode white. Never use on a card surface.
                'on-plum': {
                    DEFAULT: 'rgb(var(--c-on-plum) / <alpha-value>)',
                    dim: 'rgb(var(--c-on-plum) / var(--c-a-on-plum-dim))',
                    faint: 'rgb(var(--c-on-plum) / var(--c-a-on-plum-faint))',
                },
                // Ink for a solid `purple` accent fill.
                'on-accent': 'rgb(var(--c-on-accent) / <alpha-value>)',
                // Legacy alias for on-plum — text that stays light on colored fills.
                'on-color': 'rgb(var(--c-on-color) / <alpha-value>)',
                // The UI accent.
                purple: {
                    DEFAULT: 'rgb(var(--c-purple) / <alpha-value>)',
                    soft: 'rgb(var(--c-purple) / var(--c-a-purple-soft))',
                },
                lavender: {
                    DEFAULT: 'rgb(var(--c-purple) / <alpha-value>)',
                    soft: 'rgb(var(--c-purple) / var(--c-a-purple-soft))',
                    glow: 'rgb(var(--c-purple) / 0.5)',
                },
                pink: {
                    DEFAULT: 'rgb(var(--c-pink) / <alpha-value>)',
                    soft: 'rgb(var(--c-pink) / <alpha-value>)',
                },
                plum: {
                    DEFAULT: 'rgb(var(--c-plum) / <alpha-value>)',
                    deep: 'rgb(var(--c-plum-deep) / <alpha-value>)',
                    '2': 'rgb(var(--c-plum-2) / <alpha-value>)',
                },
                // Statistics tile numerals — order: blue, neutral, green, pink.
                stat: {
                    1: 'rgb(var(--c-stat-1) / <alpha-value>)',
                    2: 'rgb(var(--c-stat-2) / <alpha-value>)',
                    3: 'rgb(var(--c-stat-3) / <alpha-value>)',
                    4: 'rgb(var(--c-stat-4) / <alpha-value>)',
                },
                // `accent` was a fixed blue; it now tracks the blue stat numeral
                // so it darkens on white instead of staying pale.
                accent: {
                    DEFAULT: 'rgb(var(--c-stat-1) / <alpha-value>)',
                    light: 'rgb(var(--c-stat-1) / <alpha-value>)',
                    pale: 'rgb(var(--c-stat-1) / var(--c-a-dim))',
                },
                neutral: {
                    400: 'rgb(var(--c-cream) / var(--c-a-faint))',
                    0: 'rgb(var(--c-on-plum) / <alpha-value>)',
                },
                success: {
                    DEFAULT: 'rgb(var(--c-ok) / <alpha-value>)',
                    bright: 'rgb(var(--c-ok) / <alpha-value>)',
                },
                warn: 'var(--c-warn)',
                vib: {
                    violet: 'oklch(0.62 0.19 300)',
                    blue: 'oklch(0.62 0.15 252)',
                    teal: 'oklch(0.68 0.13 175)',
                    pink: 'oklch(0.66 0.21 350)',
                    amber: 'var(--c-warn)',
                    coral: 'oklch(0.65 0.19 25)',
                },
                error: 'rgb(var(--c-error) / <alpha-value>)',
                'error-soft': {
                    DEFAULT: 'rgb(var(--c-bad) / <alpha-value>)',
                },
                wash: 'var(--c-wash)',
                scrim: 'var(--c-scrim)',
                // Neutral dark veil for controls that sit ON deck cover art. Cover
                // gradients are always vibrant, so this stays dark in both themes
                // (same rationale as the `on-cover` button variant).
                veil: 'rgb(var(--c-shadow) / <alpha-value>)',
                line: {
                    DEFAULT: 'rgb(var(--c-line) / var(--c-a-line))',
                    strong: 'rgb(var(--c-line) / var(--c-a-line-strong))',
                    faint: 'rgb(var(--c-line) / var(--c-a-line-faint))',
                },
            },
            boxShadow: {
                // The inset gloss reads as a specular highlight on a colored fill,
                // so it uses on-plum ink (light in BOTH themes), not a literal white.
                // Drop shadows are neutral black via --c-shadow; the three heavy ones
                // are softened for light mode by `.light .shadow-*` in main.css.
                'lavender-cta':
                    '0 10px 30px -10px rgb(var(--c-purple) / 0.5), inset 0 1px 0 rgb(var(--c-on-plum) / 0.25)',
                'flash-card': '0 40px 80px rgb(var(--c-shadow) / 0.4)',
                'soft-elevation':
                    '0 30px 80px -30px rgb(var(--c-shadow) / 0.6), 0 4px 14px -6px rgb(var(--c-shadow) / 0.4)',
                'card-preview':
                    '0 30px 60px -28px rgb(var(--c-shadow) / 0.8), inset 0 1px 0 rgb(var(--c-on-plum) / 0.04)',
                // Named so components never inline a shadow color.
                rail: '8px 0 40px -8px rgb(var(--c-shadow) / 0.6)',
                'deck-hover': '0 4px 24px -4px rgb(var(--c-shadow) / 0.5)',
                float: '0 30px 60px rgb(var(--c-shadow) / 0.35)',
                gloss: 'inset 0 1px 0 rgb(var(--c-on-plum) / 0.12)',
                'focus-ring': '0 0 0 3px rgb(var(--c-purple) / 0.18)',
                'radio-ring': 'inset 0 0 0 1px rgb(var(--c-purple) / 0.5)',
                'ok-glow': '0 0 8px 2px rgb(var(--c-ok) / 0.45)',
            },
            dropShadow: {
                mimi: '0 18px 24px rgb(var(--c-shadow) / 0.45)',
                loader: '0 12px 18px rgb(var(--c-shadow) / 0.4)',
                'rail-glyph': '0 4px 8px rgb(var(--c-purple) / 0.4)',
            },
            backgroundImage: {
                // All theme-aware, backed by main.css (:root/.dark + .light).
                'page-glow': 'var(--c-glow)',
                'plum-card': 'var(--c-fc-front)',
                'plum-card-back': 'var(--c-fc-back)',
                'card-dark': 'var(--c-card-dark)',
                'card-plum': 'var(--c-card-plum)',
                'panel-wash': 'var(--c-panel-wash)',
                hero: 'var(--c-hero)',
                'progress-cream-lavender': 'var(--c-progress)',
                'mimi-ambient': 'var(--c-mimi-ambient)',
            },
            keyframes: {
                'typing-dot': {
                    '0%, 80%, 100%': { opacity: '0.3' },
                    '40%': { opacity: '1' },
                },
                'subtle-pulse': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
            },
            animation: {
                'typing-dot': 'typing-dot 1.2s infinite',
                'subtle-pulse': 'subtle-pulse 1s infinite',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
};

export default config;
