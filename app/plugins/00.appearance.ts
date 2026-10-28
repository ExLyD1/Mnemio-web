import { useAppearanceStore } from '@/stores/appearance';

export default defineNuxtPlugin(() => {
    const appearance = useAppearanceStore();
    useHead(() => ({
        htmlAttrs: {
            class: {
                'pal-violet': appearance.palette === 'violet',
                'pal-pink': appearance.palette === 'pink',
            },
        },
        // Same key as the static favicon in nuxt.config.ts, so this one replaces it.
        link: [
            {
                key: 'favicon-svg',
                rel: 'icon',
                type: 'image/svg+xml',
                href: `/images/brand/mnemio-icon-${appearance.palette}-dark.svg`,
                sizes: 'any',
            },
        ],
    }));
});
