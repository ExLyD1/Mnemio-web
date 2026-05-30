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
                h1: ['32px', { lineHeight: '64px', fontWeight: '700' }],
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
                bg: {
                    landing: '#0E0B10',
                    'landing-2': '#15111A',
                    base: '#111111',
                    deep: '#202020',
                    surface: '#1A1520',
                    'surface-2': '#221C2A',
                    muted: '#454545',
                },
                brand: {
                    dark: '#482A41',
                    DEFAULT: '#572E54',
                    muted: '#8E7692',
                    pale: '#CEB2BD',
                    light: '#E2D2C8',
                },
                cream: {
                    DEFAULT: '#E3D2C8',
                    dim: 'rgba(227, 210, 200, 0.62)',
                    faint: 'rgba(227, 210, 200, 0.42)',
                },
                accent: {
                    DEFAULT: '#1C73BB',
                    light: '#75B8E2',
                    pale: '#A9D3E7',
                },
                lavender: {
                    DEFAULT: '#A98EE3',
                    soft: 'rgba(169, 142, 227, 0.18)',
                    glow: 'rgba(169, 142, 227, 0.5)',
                },
                pink: {
                    soft: '#F2BCFF',
                },
                plum: {
                    DEFAULT: '#572F54',
                    deep: '#2C1A2A',
                    '2': '#482B5C',
                },
                neutral: {
                    400: '#9D9D9D',
                    0: '#FFFFFF',
                },
                success: {
                    DEFAULT: '#A6C261',
                },
                error: '#EB3D3D',
                'error-soft': {
                    DEFAULT: '#E37D88',
                },
                line: {
                    DEFAULT: 'rgba(227, 210, 200, 0.10)',
                    strong: 'rgba(227, 210, 200, 0.18)',
                },
            },
            boxShadow: {
                'lavender-cta':
                    '0 10px 30px -10px rgba(169,142,227,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                'flash-card': '0 40px 80px rgba(0,0,0,0.4)',
                'soft-elevation':
                    '0 30px 80px -30px rgba(0,0,0,.6), 0 4px 14px -6px rgba(0,0,0,.4)',
            },
            backgroundImage: {
                'page-glow':
                    'radial-gradient(1100px 600px at 80% -10%, rgba(169,142,227,0.12), transparent 60%), radial-gradient(900px 500px at -10% 20%, rgba(87,47,84,0.30), transparent 65%)',
                'plum-card': 'linear-gradient(160deg, #2C1A2A 0%, #1A1020 100%)',
                'plum-card-back': 'linear-gradient(160deg, #572F54 0%, #482B5C 100%)',
                'progress-cream-lavender': 'linear-gradient(90deg, #E2D2C8, #A98EE3)',
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
