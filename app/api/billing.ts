import { http } from '@/utils/http';
import type { Subscription, BillingPlan } from '@/types/billing';

export const postCheckout = (plan: BillingPlan): Promise<{ url: string }> =>
    http('/billing/checkout', { method: 'POST', body: { plan } });

export const getSubscription = (): Promise<Subscription> => http('/billing/subscription');

export const postPortal = (): Promise<{ url: string }> =>
    http('/billing/portal', { method: 'POST' });
