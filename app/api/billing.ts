import { http } from '@/utils/http';
import type { Subscription, BillingPlan } from '@/types/billing';

export const postCheckout = (plan: BillingPlan): Promise<{ url: string }> =>
    http('/billing/checkout', { method: 'POST', body: { plan } });

// null = the user has never subscribed (free plan). That is the normal case,
// so the endpoint answers 200 with a null body rather than 404-ing on every
// page load; the store still tolerates the old 404 for safety.
export const getSubscription = (): Promise<Subscription | null> => http('/billing/subscription');

export const postPortal = (): Promise<{ url: string }> =>
    http('/billing/portal', { method: 'POST' });
