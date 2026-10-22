import { defineStore, ref, shallowRef } from '#imports';
import * as api from '@/api/billing';
import { getAiUsage, type AiUsage } from '@/api/chat';
import type { Subscription, Invoice, CancelInput, ChangeInput } from '@/types/billing';

export const useBillingStore = defineStore('billing', () => {
    const subscription = shallowRef<Subscription | null>(null);
    const loaded = ref(false);
    const loading = ref(false);
    const notConfigured = ref(false);
    const invoices = shallowRef<Invoice[]>([]);
    const usage = shallowRef<AiUsage | null>(null);
    let inflight: Promise<void> | null = null;
    let usageInflight: Promise<AiUsage> | null = null;
    let generation = 0;
    const providerError = (error: unknown) => {
        if ((error as { code?: string }).code === 'BILLING_NOT_CONFIGURED') {
            notConfigured.value = true;
        }
        throw error;
    };
    const load = (): Promise<void> => {
        if (inflight) {
            return inflight;
        }
        if (loaded.value) {
            return Promise.resolve();
        }
        loading.value = true;
        const ticket = generation;
        inflight = (async () => {
            try {
                const result = await api.getSubscription();
                if (ticket !== generation) {
                    return;
                }
                subscription.value = result;
                notConfigured.value = false;
                loaded.value = true;
            } catch (error) {
                if (ticket !== generation) {
                    return;
                }
                const code = (error as { code?: string }).code;
                if (code === 'BILLING_NO_SUBSCRIPTION') {
                    subscription.value = null;
                    loaded.value = true;
                } else if (code === 'BILLING_NOT_CONFIGURED') {
                    notConfigured.value = true;
                    loaded.value = true;
                } else {
                    throw error;
                }
            } finally {
                if (ticket === generation) {
                    loading.value = false;
                    inflight = null;
                }
            }
        })();
        return inflight;
    };
    const invalidate = () => {
        generation++;
        loaded.value = false;
        loading.value = false;
        inflight = null;
        usageInflight = null;
    };
    const resetCache = () => {
        invalidate();
        subscription.value = null;
        notConfigured.value = false;
        invoices.value = [];
        usage.value = null;
        usageInflight = null;
    };
    const replace = async (action: Promise<Subscription>) => {
        const ticket = generation;
        try {
            const result = await action;
            if (ticket === generation) {
                invalidate();
                subscription.value = result;
                loaded.value = true;
            }
            return result;
        } catch (error) {
            if (ticket === generation) {
                providerError(error);
            }
            throw error;
        }
    };
    const loadInvoices = async () => {
        if (loaded.value && !subscription.value) {
            invoices.value = [];
            return [];
        }
        const ticket = generation;
        try {
            const result = (await api.getInvoices()).items;
            if (ticket === generation) {
                invoices.value = result;
            }
            return result;
        } catch (error) {
            if ((error as { code?: string }).code === 'BILLING_NO_SUBSCRIPTION') {
                if (ticket === generation) {
                    invoices.value = [];
                }
                return [];
            }
            if (ticket === generation) {
                providerError(error);
            }
            throw error;
        }
    };
    const loadUsage = (): Promise<AiUsage> => {
        if (usageInflight) {
            return usageInflight;
        }
        const ticket = generation;
        usageInflight = getAiUsage()
            .then((result) => {
                if (ticket === generation) {
                    usage.value = result;
                }
                return result;
            })
            .finally(() => {
                if (ticket === generation) {
                    usageInflight = null;
                }
            });
        return usageInflight;
    };
    const cancel = (input: CancelInput) => replace(api.cancelSubscription(input));
    const pause = (months: 1 | 2 | 3) => replace(api.pauseSubscription(months));
    const resume = () => replace(api.resumeSubscription());
    const previewChange = (input: ChangeInput) => api.previewPlanChange(input).catch(providerError);
    const changePlan = (input: ChangeInput) => replace(api.changeSubscriptionPlan(input));
    const paymentMethodTxn = () => api.getPaymentMethodTransaction().catch(providerError);
    const invoicePdf = (id: string) => api.getInvoicePdf(id).catch(providerError);
    const portal = () => api.postPortal().catch(providerError);
    return {
        subscription,
        loaded,
        loading,
        notConfigured,
        invoices,
        usage,
        load,
        resetCache,
        invalidate,
        loadInvoices,
        loadUsage,
        cancel,
        pause,
        resume,
        previewChange,
        changePlan,
        paymentMethodTxn,
        invoicePdf,
        portal,
    };
});
