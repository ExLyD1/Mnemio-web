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
    }));
});
