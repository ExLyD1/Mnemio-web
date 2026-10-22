import type { Money } from '@/types/billing';

export const formatMoney = (money: Money | null | undefined, locale: string): string => {
    if (!money || !Number.isFinite(money.amount) || !money.currency) {
        return '—';
    }
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: money.currency,
        }).format(money.amount);
    } catch {
        return '—';
    }
};
export const formatDate = (date: string | null | undefined, locale: string): string => {
    if (!date || !Number.isFinite(Date.parse(date))) {
        return '—';
    }
    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
};
/** PricePreview uses minor units; checkout events and our backend use major units. */
export const fromMinorUnits = (amount: string, currency: string): number =>
    Number(amount) /
    10 **
        (new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
            .maximumFractionDigits ?? 2);
