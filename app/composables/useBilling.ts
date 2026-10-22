import { useAsync } from '@/composables/useAsync';
import { useAnalytics } from '@/composables/useAnalytics';
import { usePaddle } from '@/composables/usePaddle';
import { useBillingStore } from '@/stores/billing';
import { useAuthStore } from '@/stores/auth';
import { PLANS } from '@/data/plans';
import { sanitizeNext } from '@/utils/returnTo';
import type { BillingPlan, CancelInput, ChangeInput } from '@/types/billing';
import type { PaddleEventData, CheckoutEventsData } from '@paddle/paddle-js';

export const premiumPriceId = (plan: BillingPlan): string | undefined =>
    PLANS.find((p) => p.id === 'premium')?.priceId?.[plan === 'annual' ? 'year' : 'month'];

export const useBilling = () => {
    const billingStore = useBillingStore();
    const analytics = useAnalytics();
    const auth = useAuthStore();
    const colorMode = useColorMode();
    const route = useRoute();
    const { load: loadPaddle, failed: paddleFailed, subscribe, paddle } = usePaddle();
    const checkoutData = shallowRef<CheckoutEventsData | null>(null);
    const paymentError = ref<string | null>(null);
    const checkoutReady = ref(false);
    const paymentProcessing = ref(false);
    let checkoutOwned = false;
    let checkoutAttached = false;
    let checkoutGeneration = 0;
    let disposed = false;
    let checkoutId: string | null = null;
    let completion: (() => void | Promise<void>) | null = null;
    const unsubscribe = subscribe((event: PaddleEventData) => {
        if (!checkoutOwned) {
            return;
        }
        if (checkoutId && event.data?.id && event.data.id !== checkoutId) {
            return;
        }
        if (event.name === 'checkout.loaded' || event.name === 'checkout.updated') {
            checkoutId = event.data?.id ?? checkoutId;
            checkoutData.value = event.data ?? null;
            checkoutReady.value = true;
        }
        if (
            [
                'checkout.payment.failed',
                'checkout.payment.error',
                'checkout.error',
                'checkout.failed',
            ].includes(event.name ?? '')
        ) {
            paymentError.value = event.code ?? 'declined';
            paymentProcessing.value = false;
            checkoutReady.value = true;
            analytics.track('checkout_payment_failed', { code: paymentError.value });
        }
        if (event.name === 'checkout.payment.initiated') {
            paymentError.value = null;
            paymentProcessing.value = true;
        }
        if (event.name === 'checkout.completed') {
            checkoutOwned = false;
            paymentProcessing.value = false;
            void completion?.();
        }
    });
    const closeCheckout = () => {
        checkoutGeneration++;
        if (checkoutAttached) {
            paddle.value?.Checkout.close();
        }
        checkoutAttached = false;
        checkoutId = null;
        checkoutOwned = false;
        checkoutReady.value = false;
        paymentProcessing.value = false;
        checkoutData.value = null;
    };
    onScopeDispose(() => {
        disposed = true;
        closeCheckout();
        unsubscribe();
    });

    // All acquisition entry points share a validated origin and the protected page.
    const checkout = useAsync(async (plan: BillingPlan) => {
        if (auth.isAuthenticated) {
            await billingStore.load();
            if (
                billingStore.subscription &&
                !['canceled', 'expired'].includes(billingStore.subscription.status)
            ) {
                await navigateTo('/settings/billing');
                return;
            }
        }
        const from = sanitizeNext(route.query.from) || sanitizeNext(route.fullPath) || '/dashboard';
        await navigateTo({ path: '/checkout', query: { plan, from } });
    });
    const inlineCheckout = useAsync(
        async (options: {
            plan?: BillingPlan;
            transactionId?: string;
            frameTarget: string;
            onComplete: () => void | Promise<void>;
        }) => {
            const generation = ++checkoutGeneration;
            const instance = await loadPaddle();
            if (disposed || generation !== checkoutGeneration) {
                return;
            }
            if (!instance) {
                throw new Error('BILLING_PADDLE_UNAVAILABLE');
            }
            const priceId = options.plan ? premiumPriceId(options.plan) : undefined;
            if (!options.transactionId && !priceId) {
                throw new Error('BILLING_PRICE_NOT_CONFIGURED');
            }
            const source = options.transactionId
                ? { transactionId: options.transactionId }
                : priceId
                  ? { items: [{ priceId, quantity: 1 }] }
                  : null;
            if (!source) {
                throw new Error('BILLING_PRICE_NOT_CONFIGURED');
            }
            closeCheckout();
            paymentError.value = null;
            completion = options.onComplete;
            checkoutOwned = true;
            checkoutAttached = true;
            instance.Checkout.open({
                ...source,
                ...(auth.user?.email ? { customer: { email: auth.user.email } } : {}),
                ...(auth.user?.id ? { customData: { userId: auth.user.id } } : {}),
                settings: {
                    displayMode: 'inline',
                    frameTarget: options.frameTarget,
                    frameInitialHeight: 450,
                    frameStyle: 'width:100%;background:transparent;border:none',
                    theme: colorMode.value === 'light' ? 'light' : 'dark',
                    variant: 'one-page',
                    allowLogout: !auth.user?.email,
                },
            });
            if (options.plan) {
                analytics.track('checkout_started', { billing_plan: options.plan });
            }
        },
    );
    const updateItems = useAsync(async (plan: BillingPlan) => {
        const priceId = premiumPriceId(plan);
        if (!paddle.value || !priceId || !checkoutReady.value) {
            throw new Error('BILLING_PADDLE_UNAVAILABLE');
        }
        checkoutReady.value = false;
        checkoutData.value = null;
        paddle.value.Checkout.updateItems([{ priceId, quantity: 1 }]);
    });
    const portal = useAsync(async () => {
        const res = await billingStore.portal();
        analytics.track('billing_portal_opened', {});
        window.location.assign(res.url);
    });
    const load = useAsync(billingStore.load);
    const invoices = useAsync(billingStore.loadInvoices);
    const usage = useAsync(billingStore.loadUsage);
    const cancel = useAsync(async (input: CancelInput) => {
        const result = await billingStore.cancel(input);
        await auth.hydrate();
        return result;
    });
    const pause = useAsync((months: 1 | 2 | 3) => billingStore.pause(months));
    const resume = useAsync(async () => {
        const result = await billingStore.resume();
        await auth.hydrate();
        return result;
    });
    const previewChange = useAsync((input: ChangeInput) => billingStore.previewChange(input));
    const changePlan = useAsync((input: ChangeInput) => billingStore.changePlan(input));
    const paymentMethodTxn = useAsync(billingStore.paymentMethodTxn);
    const download = useAsync(async (id: string) => {
        // Reserve the tab during the gesture, before awaiting the signed URL.
        const tab = window.open('about:blank', '_blank');
        if (tab) {
            tab.opener = null;
        }
        try {
            const { url } = await billingStore.invoicePdf(id);
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:') {
                throw new Error('Invalid invoice URL');
            }
            if (tab) {
                tab.location.replace(parsed.href);
            } else {
                window.location.assign(parsed.href);
            }
            analytics.track('invoice_downloaded', {});
        } catch (e) {
            tab?.close();
            throw e;
        }
    });
    return {
        checkout,
        inlineCheckout,
        updateItems,
        checkoutData,
        paymentError,
        checkoutReady,
        paymentProcessing,
        closeCheckout,
        portal,
        billingStore,
        paddleFailed,
        load,
        invoices,
        usage,
        cancel,
        pause,
        resume,
        previewChange,
        changePlan,
        paymentMethodTxn,
        download,
    };
};
