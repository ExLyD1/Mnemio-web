import { http } from '@/utils/http';
import type {
    Subscription,
    CancelInput,
    ChangeInput,
    ChangePreview,
    Invoice,
} from '@/types/billing';

// null = the user has never subscribed (free plan). That is the normal case,
// so the endpoint answers 200 with a null body rather than 404-ing on every
// page load; the store still tolerates the old 404 for safety.
export const getSubscription = (): Promise<Subscription | null> => http('/billing/subscription');

export const postPortal = (): Promise<{ url: string }> =>
    http('/billing/portal', { method: 'POST' });

export const cancelSubscription = (body: CancelInput): Promise<Subscription> =>
    http('/billing/cancel', { method: 'POST', body });
export const pauseSubscription = (months: 1 | 2 | 3): Promise<Subscription> =>
    http('/billing/pause', { method: 'POST', body: { months } });
export const resumeSubscription = (): Promise<Subscription> =>
    http('/billing/resume', { method: 'POST' });
export const previewPlanChange = (body: ChangeInput): Promise<ChangePreview> =>
    http('/billing/change-plan/preview', { method: 'POST', body });
export const changeSubscriptionPlan = (body: ChangeInput): Promise<Subscription> =>
    http('/billing/change-plan', { method: 'POST', body });
export const getPaymentMethodTransaction = (): Promise<{ transactionId: string }> =>
    http('/billing/payment-method-transaction');
export const getInvoices = (): Promise<{ items: Invoice[] }> => http('/billing/invoices');
export const getInvoicePdf = (id: string): Promise<{ url: string }> =>
    http(`/billing/invoices/${encodeURIComponent(id)}/pdf`);
