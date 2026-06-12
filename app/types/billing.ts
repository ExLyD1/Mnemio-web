export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
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
}
