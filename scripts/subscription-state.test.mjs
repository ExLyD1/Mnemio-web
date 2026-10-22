import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const exports = {};
runInNewContext(
    ts.transpileModule(readFileSync('app/utils/subscriptionState.ts', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports },
);
const { subscriptionState, cancelled, pausedScheduled, trialEndingSoon, daysUntil, declineKey } =
    exports;
const now = Date.parse('2026-10-22T12:00:00Z');
const base = {
    id: 'sub_1',
    status: 'active',
    plan: 'monthly',
    currentPeriodStart: '2026-10-09T12:00:00Z',
    currentPeriodEnd: '2026-11-09T12:00:00Z',
    cancelAtPeriodEnd: false,
    trialEnd: null,
    scheduledChange: null,
    price: null,
    paymentMethod: null,
    pastDue: null,
    scheduledPlanChange: null,
};
for (const [name, input, expected] of [
    ['free', null, 'free'],
    ['active', base, 'active'],
    ['trialing', { ...base, status: 'trialing', trialEnd: '2026-10-29T12:00:00Z' }, 'trialing'],
    [
        'trial ending at 2 days',
        { ...base, status: 'trialing', trialEnd: '2026-10-24T12:00:00Z' },
        'trial_ending',
    ],
    [
        'trial past end awaiting webhook',
        { ...base, status: 'trialing', trialEnd: '2026-10-21T12:00:00Z' },
        'trial_ending',
    ],
    ['trial missing end', { ...base, status: 'trialing' }, 'trialing'],
    [
        'past due with null retry',
        { ...base, status: 'past_due', pastDue: { nextRetryAt: null } },
        'past_due',
    ],
    ['scheduled cancellation flag', { ...base, cancelAtPeriodEnd: true }, 'cancelled'],
    [
        'scheduled cancellation action',
        { ...base, scheduledChange: { action: 'cancel' } },
        'cancelled',
    ],
    [
        'trial scheduled cancel',
        { ...base, status: 'trialing', cancelAtPeriodEnd: true },
        'cancelled',
    ],
    ['scheduled pause', { ...base, scheduledChange: { action: 'pause' } }, 'pause_scheduled'],
    ['paused', { ...base, status: 'paused' }, 'paused'],
    ['canceled', { ...base, status: 'canceled', cancelAtPeriodEnd: true }, 'free'],
    ['expired', { ...base, status: 'expired' }, 'free'],
    [
        'scheduled resume is still paused',
        { ...base, status: 'paused', scheduledChange: { action: 'resume' } },
        'paused',
    ],
    [
        'past due takes precedence',
        { ...base, status: 'past_due', cancelAtPeriodEnd: true },
        'past_due',
    ],
])
    test(name, () => assert.equal(subscriptionState(input, now), expected));
test('state predicates tolerate absent fields', () => {
    assert.equal(cancelled(null), false);
    assert.equal(pausedScheduled(null), false);
    assert.equal(trialEndingSoon(null, now), false);
    assert.equal(daysUntil(undefined, now), 0);
    assert.equal(daysUntil('invalid', now), 0);
    assert.equal(daysUntil('2026-10-24T12:00:00Z', now), 2);
});
test('friendly declines include aliases and unknown fallback', () => {
    for (const code of ['card_expired', 'expired_card']) assert.equal(declineKey(code), 'expired');
    assert.equal(declineKey('insufficient_funds'), 'funds');
    assert.equal(declineKey('authentication_failed'), 'authentication');
    assert.equal(declineKey('blocked_card'), 'blocked');
    assert.equal(declineKey('declined'), 'generic');
    assert.equal(declineKey('future_provider_code'), 'generic');
});
