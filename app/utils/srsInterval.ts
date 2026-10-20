import type { IntervalPreview } from '@/types/srs';

export const formatSrsInterval = (preview: IntervalPreview, t: (key: string) => string): string => {
    // Whole units only: 10.6 months reads as "10mo".
    const number = (n: number) => String(Math.floor(n));
    if (preview.kind === 'secs') {
        if (preview.value < 60) {
            return `<1${t('practice.units.minute')}`;
        }
        if (preview.value < 3600) {
            return `${Math.round(preview.value / 60)}${t('practice.units.minute')}`;
        }
        if (preview.value < 86400) {
            return `${Math.round(preview.value / 3600)}${t('practice.units.hour')}`;
        }
    }
    const days = preview.kind === 'days' ? preview.value : preview.value / 86400;
    if (days < 30) {
        return `${number(days)}${t('practice.units.day')}`;
    }
    if (days < 365) {
        return `${number(days / 30)}${t('practice.units.month')}`;
    }
    return `${number(days / 365)}${t('practice.units.year')}`;
};
