import type { Money, Subscription } from '@/types/billing';

const CARD_BRANDS: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    american_express: 'American Express',
    amex: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    maestro: 'Maestro',
    union_pay: 'UnionPay',
    diners_club: 'Diners Club',
};

/** "Visa •••• 4242", or '' when no card is on file. Paddle sends lowercase brand keys. */
export const formatCard = (method: Subscription['paymentMethod'] | undefined): string => {
    if (!method) {
        return '';
    }
    const key = method.brand.toLowerCase();
    const name = CARD_BRANDS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
    return `${name} •••• ${method.last4}`;
};

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
