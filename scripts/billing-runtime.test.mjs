import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as vue from 'vue';
const require = createRequire(import.meta.url);
function load(path, imports = {}, globals = {}) {
    const exports = {};
    runInNewContext(
        ts.transpileModule(readFileSync(path, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        { exports, URL, require: (name) => imports[name] ?? require(name), ...globals },
    );
    return exports;
}
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
};
const base = {
    id: 'sub_fixture',
    status: 'active',
    plan: 'monthly',
    currentPeriodStart: '2026-10-01',
    currentPeriodEnd: '2026-11-01',
    cancelAtPeriodEnd: false,
    trialEnd: null,
    price: { amount: 18, currency: 'EUR' },
    paymentMethod: null,
    scheduledChange: null,
    scheduledPlanChange: null,
    pastDue: null,
};
function setupStore(overrides = {}) {
    let reads = 0;
    const api = {
        getSubscription: async () => {
            reads++;
            return base;
        },
        getInvoices: async () => ({ items: [] }),
        ...overrides,
    };
    const { useBillingStore } = load('app/stores/billing.ts', {
        '#imports': { ...vue, defineStore: (_name, factory) => () => vue.reactive(factory()) },
        '@/api/billing': api,
        '@/api/chat': {
            getAiUsage: async () => ({
                kinds: { chat: { used: 7, cap: 23, remaining: 16 } },
                freeCaps: { chat: 23 },
            }),
        },
    });
    return { store: useBillingStore(), reads: () => reads };
}
test('billing load shares pending requests and caches successful reads', async () => {
    const result = deferred();
    let calls = 0;
    const { store } = setupStore({
        getSubscription: () => {
            calls++;
            return result.promise;
        },
    });
    const first = store.load();
    const second = store.load();
    assert.equal(first, second);
    result.resolve(base);
    await Promise.all([first, second]);
    await store.load();
    assert.equal(calls, 1);
    assert.equal(store.subscription.id, base.id);
});
test('all successful mutations use their returned DTO without an extra subscription read', async () => {
    const next = { ...base, cancelAtPeriodEnd: true };
    const { store, reads } = setupStore({
        cancelSubscription: async () => next,
        pauseSubscription: async () => ({ ...base, status: 'paused' }),
        resumeSubscription: async () => base,
        changeSubscriptionPlan: async () => ({ ...base, plan: 'annual' }),
    });
    await store.load();
    await store.cancel({ reason: 'other', feedback: 'fixture' });
    assert.equal(store.subscription.cancelAtPeriodEnd, true);
    await store.pause(2);
    assert.equal(store.subscription.status, 'paused');
    await store.resume();
    assert.equal(store.subscription.status, 'active');
    await store.changePlan({ plan: 'annual', when: 'renewal' });
    assert.equal(store.subscription.plan, 'annual');
    assert.equal(reads(), 1);
});
test('failed actions leave the subscription intact and permit retry', async () => {
    let fail = true;
    const { store } = setupStore({
        cancelSubscription: async () => {
            if (fail) throw { code: 'BILLING_PROVIDER_ERROR', message: 'fixture' };
            return { ...base, cancelAtPeriodEnd: true };
        },
    });
    await store.load();
    await assert.rejects(store.cancel({ reason: 'other' }));
    assert.equal(store.subscription.cancelAtPeriodEnd, false);
    fail = false;
    await store.cancel({ reason: 'other' });
    assert.equal(store.subscription.cancelAtPeriodEnd, true);
});
test('a late load cannot overwrite a newer mutation', async () => {
    const pending = deferred();
    const { store } = setupStore({
        getSubscription: () => pending.promise,
        resumeSubscription: async () => ({ ...base, plan: 'annual' }),
    });
    const read = store.load();
    await store.resume();
    pending.resolve(base);
    await read;
    assert.equal(store.subscription.plan, 'annual');
});
test('account reset discards an old account load and mutation', async () => {
    const pending = deferred();
    const mutation = deferred();
    const { store } = setupStore({
        getSubscription: () => pending.promise,
        cancelSubscription: () => mutation.promise,
    });
    const read = store.load();
    const action = store.cancel({ reason: 'other' });
    store.resetCache();
    pending.resolve(base);
    mutation.resolve(base);
    await Promise.all([read, action]);
    assert.equal(store.subscription, null);
    assert.equal(store.loaded, false);
    assert.equal(store.loading, false);
});
test('not configured hides billing; free legacy 404 and empty invoices are normal', async () => {
    const notConfigured = setupStore({
        getSubscription: async () => {
            throw { code: 'BILLING_NOT_CONFIGURED' };
        },
    }).store;
    await notConfigured.load();
    assert.equal(notConfigured.notConfigured, true);
    const free = setupStore({
        getSubscription: async () => {
            throw { code: 'BILLING_NO_SUBSCRIPTION' };
        },
        getInvoices: async () => {
            throw { code: 'BILLING_NO_SUBSCRIPTION' };
        },
    }).store;
    await free.load();
    await free.loadInvoices();
    assert.equal(free.subscription, null);
    assert.equal(free.invoices.length, 0);
    assert.equal(free.loaded, true);
});
test('usage meters keep the server cap and freeCaps', async () => {
    const { store } = setupStore();
    await store.loadUsage();
    assert.equal(store.usage.kinds.chat.cap, 23);
    assert.equal(store.usage.freeCaps.chat, 23);
});
function setupCheckout({ available = true, pending = null, from = '/ai?deckId=fixture' } = {}) {
    const opened = [],
        changed = [],
        navigations = [],
        analytics = [],
        scopes = [],
        listeners = new Set();
    let closes = 0;
    const instance = {
        Checkout: {
            open: (options) => opened.push(options),
            updateItems: (items) => changed.push(items),
            close: () => {
                closes++;
            },
        },
    };
    const asyncModule = load('app/composables/useAsync.ts');
    const store = setupStore().store;
    const { useBilling } = load(
        'app/composables/useBilling.ts',
        {
            '@/composables/useAsync': asyncModule,
            '@/composables/useAnalytics': {
                useAnalytics: () => ({ track: (...args) => analytics.push(args) }),
            },
            '@/composables/usePaddle': {
                usePaddle: () => ({
                    paddle: vue.shallowRef(instance),
                    failed: vue.ref(!available),
                    load: () => pending ?? Promise.resolve(available ? instance : undefined),
                    subscribe: (fn) => {
                        listeners.add(fn);
                        return () => listeners.delete(fn);
                    },
                }),
            },
            '@/stores/billing': { useBillingStore: () => store },
            '@/stores/auth': {
                useAuthStore: () => ({ user: { id: 'fixture', email: 'fixture@example.invalid' } }),
            },
            '@/data/plans': {
                PLANS: [{ id: 'premium', priceId: { month: 'pri_month', year: 'pri_year' } }],
            },
            '@/utils/returnTo': load('app/utils/returnTo.ts'),
        },
        {
            ref: vue.ref,
            shallowRef: vue.shallowRef,
            useColorMode: () => ({ value: 'light' }),
            useRoute: () => ({ fullPath: '/pricing', query: { from } }),
            onScopeDispose: (fn) => scopes.push(fn),
            navigateTo: async (to) => {
                navigations.push(to);
            },
        },
    );
    return {
        billing: useBilling(),
        opened,
        changed,
        navigations,
        analytics,
        dispose: () => scopes.forEach((fn) => fn()),
        event: (event) => listeners.forEach((fn) => fn(event)),
        closes: () => closes,
    };
}
const payload = {
    id: 'che_fixture',
    currency_code: 'EUR',
    totals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
    recurring_totals: { subtotal: 90, tax: 18, discount: 0, total: 108 },
    items: [{ price_id: 'pri_year', trial_period: { frequency: 7, interval: 'day' } }],
};
test('inline checkout binds theme, iframe options and signed-in customer; events drive totals', async () => {
    const { billing, opened, event, changed, analytics } = setupCheckout();
    let completed = 0;
    await billing.inlineCheckout.execute({
        plan: 'annual',
        frameTarget: 'paddle-frame',
        onComplete: () => {
            completed++;
        },
    });
    assert.equal(opened[0].settings.displayMode, 'inline');
    assert.equal(opened[0].settings.theme, 'light');
    assert.equal(opened[0].settings.frameInitialHeight, 450);
    assert.equal(opened[0].settings.variant, 'one-page');
    assert.equal(opened[0].customData.userId, 'fixture');
    assert.equal(opened[0].customer.email, 'fixture@example.invalid');
    event({ name: 'checkout.loaded', data: payload });
    assert.equal(billing.checkoutData.value.recurring_totals.total, 108);
    await billing.updateItems.execute('monthly');
    assert.equal(changed[0][0].priceId, 'pri_month');
    assert.equal(billing.checkoutData.value, null);
    event({
        name: 'checkout.updated',
        data: { ...payload, totals: { ...payload.totals, tax: 3, total: 21 } },
    });
    assert.equal(billing.checkoutData.value.totals.total, 21);
    event({ name: 'checkout.payment.failed', code: 'insufficient_funds' });
    assert.equal(billing.paymentError.value, 'insufficient_funds');
    assert.equal(completed, 0);
    assert.equal(analytics.at(-1)[0], 'checkout_payment_failed');
    event({ name: 'checkout.completed', data: payload });
    event({ name: 'checkout.completed', data: payload });
    assert.equal(completed, 1);
});
test('card update uses the returned transaction id and closes its iframe on disposal', async () => {
    const { billing, opened, event, dispose, closes } = setupCheckout();
    await billing.inlineCheckout.execute({
        transactionId: 'txn_fixture',
        frameTarget: 'card-frame',
        onComplete: () => {},
    });
    assert.equal(opened[0].transactionId, 'txn_fixture');
    assert.equal(opened[0].items, undefined);
    event({ name: 'checkout.payment.initiated' });
    assert.equal(billing.paymentProcessing.value, true);
    event({ name: 'checkout.payment.failed' });
    assert.equal(billing.paymentProcessing.value, false);
    dispose();
    assert.equal(closes(), 1);
});
test('missing Paddle stays in a recoverable error; disposed pending loads never open checkout', async () => {
    const missing = setupCheckout({ available: false });
    await missing.billing.inlineCheckout.execute({
        plan: 'annual',
        frameTarget: 'frame',
        onComplete: () => {},
    });
    assert.equal(missing.opened.length, 0);
    assert.ok(missing.billing.inlineCheckout.error.value);
    const pending = deferred();
    const stale = setupCheckout({ pending: pending.promise });
    const operation = stale.billing.inlineCheckout.execute({
        plan: 'annual',
        frameTarget: 'frame',
        onComplete: () => {},
    });
    stale.dispose();
    pending.resolve({ Checkout: { open: () => assert.fail('stale open') } });
    await operation;
});
test('acquisition entry points retain internal origin and reject unsafe return paths', async () => {
    const safe = setupCheckout();
    await safe.billing.checkout.execute('annual');
    assert.equal(safe.navigations[0].query.from, '/ai?deckId=fixture');
    for (const from of [
        '//evil.invalid',
        '/\\evil.invalid',
        'https://evil.invalid',
        '/\n/evil.invalid',
    ]) {
        const unsafe = setupCheckout({ from });
        await unsafe.billing.checkout.execute('monthly');
        assert.equal(unsafe.navigations[0].query.from, '/pricing');
    }
});
test('Paddle initializes once and dispatches to subscribers with unsubscribe support', async () => {
    let calls = 0,
        callback;
    const instance = {};
    const { usePaddle } = load('app/composables/usePaddle.ts', {
        '@paddle/paddle-js': {
            initializePaddle: async (options) => {
                calls++;
                callback = options.eventCallback;
                return instance;
            },
        },
        '#imports': {
            ...vue,
            useRuntimeConfig: () => ({
                public: { paddleClientToken: 'test_fixture', paddleEnv: 'sandbox' },
            }),
        },
    });
    const a = usePaddle(),
        b = usePaddle();
    let first = 0,
        second = 0;
    const off = a.subscribe(() => first++);
    b.subscribe(() => second++);
    await Promise.all([a.load(), b.load()]);
    assert.equal(calls, 1);
    callback({ name: 'checkout.loaded' });
    off();
    callback({ name: 'checkout.updated' });
    assert.equal(first, 1);
    assert.equal(second, 2);
});
test('backend and checkout money use major units; PricePreview handles zero-decimal currency', () => {
    const { formatMoney, formatDate, fromMinorUnits } = load('app/utils/format.ts');
    assert.equal(formatMoney({ amount: 10, currency: 'USD' }, 'en'), '$10.00');
    assert.equal(fromMinorUnits('1000', 'USD'), 10);
    assert.equal(fromMinorUnits('1000', 'JPY'), 1000);
    assert.equal(formatDate(null, 'uk'), '—');
});
