export type SubscriptionStatus =
    'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired';
export type BillingPlan = 'monthly' | 'annual';
export type UserPlan = 'free' | 'premium';

export interface Subscription {
    id: string;
    status: SubscriptionStatus;
    plan: BillingPlan;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
    scheduledChange: {
        action: 'cancel' | 'pause' | 'resume';
        effectiveAt: string;
        resumeAt: string | null;
    } | null;
    price: Money | null;
    paymentMethod: {
        brand: string;
        last4: string;
        expMonth: number | null;
        expYear: number | null;
        declineReason: string | null;
    } | null;
    pastDue: {
        amount: number;
        currency: string;
        failedAt: string;
        nextRetryAt: string | null;
        graceEndsAt: string;
    } | null;
    scheduledPlanChange: BillingPlan | null;
}

export interface Money {
    amount: number;
    currency: string;
}
export type CancelReason =
    'too_expensive' | 'not_using' | 'free_enough' | 'missing_feature' | 'not_working' | 'other';
export interface CancelInput {
    reason: CancelReason;
    feedback?: string;
}
export interface ChangeInput {
    plan: BillingPlan;
    when: 'now' | 'renewal';
}
export interface ChangePreview extends ChangeInput {
    newPrice: Money;
    credit: Money;
    dueToday: Money;
    nextBilledAt: string | null;
}
export interface Invoice {
    id: string;
    billedAt: string;
    plan: BillingPlan | null;
    amount: number;
    currency: string;
    status: 'paid' | 'failed' | 'refunded' | 'trial';
    hasPdf: boolean;
}
