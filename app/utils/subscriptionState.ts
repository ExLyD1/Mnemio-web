import type { Subscription } from '../types/billing';

export const cancelled = (sub: Subscription | null): boolean =>
    !!sub && (sub.cancelAtPeriodEnd || sub.scheduledChange?.action === 'cancel');
export const pausedScheduled = (sub: Subscription | null): boolean =>
    sub?.scheduledChange?.action === 'pause';
export const ended = (sub: Subscription | null): boolean =>
    sub?.status === 'canceled' || sub?.status === 'expired';
export const trialEndingSoon = (sub: Subscription | null, now = Date.now()): boolean =>
    sub?.status === 'trialing' && !!sub.trialEnd && Date.parse(sub.trialEnd) - now <= 2 * 86400000;
export const subscriptionState = (sub: Subscription | null, now = Date.now()) => {
    if (!sub || ended(sub)) {
        return 'free';
    }
    if (sub.status === 'past_due') {
        return 'past_due';
    }
    if (sub.status === 'paused') {
        return 'paused';
    }
    if (cancelled(sub)) {
        return 'cancelled';
    }
    if (pausedScheduled(sub)) {
        return 'pause_scheduled';
    }
    if (trialEndingSoon(sub, now)) {
        return 'trial_ending';
    }
    return sub.status;
};
export const daysUntil = (date: string | null | undefined, now = Date.now()): number =>
    date && Number.isFinite(Date.parse(date))
        ? Math.max(0, Math.ceil((Date.parse(date) - now) / 86400000))
        : 0;

export const declineKey = (code: string | null | undefined): string => {
    if (['expired_card', 'card_expired'].includes(code ?? '')) {
        return 'expired';
    }
    if (['insufficient_funds', 'not_enough_balance'].includes(code ?? '')) {
        return 'funds';
    }
    if (
        ['authentication_failed', 'authentication_required', '3ds_authentication_failed'].includes(
            code ?? '',
        )
    ) {
        return 'authentication';
    }
    if (
        ['blocked_card', 'card_not_supported', 'restricted_card', 'permission_denied'].includes(
            code ?? '',
        )
    ) {
        return 'blocked';
    }
    return 'generic';
};
