/**
 * useAnalytics — the ONLY analytics surface components/stores/composables touch.
 * Typed against app/analytics/events.ts so event names and props can't drift.
 *
 * Every method is a hard no-op unless analytics is enabled (runtime config),
 * a token is present, AND the user granted consent. All SDK calls are wrapped
 * so analytics can never throw into product code.
 */
import type { OverridedMixpanel } from 'mixpanel-browser';
import { useConsentStore } from '@/stores/consent';
import { analyticsState } from '@/analytics/client';
import {
    GA4_CONVERSION_EVENTS,
    USER_PROP_KEYS,
    type EventName,
    type PropsFor,
    type UserProps,
} from '@/analytics/events';

export const useAnalytics = () => {
    const consent = useConsentStore();

    // Live gate: config/token resolved once at plugin init; consent can flip
    // at runtime when the user clicks Accept, so read it on every call. Returns
    // the SDK instance (narrowed non-null) only when everything is ready.
    const instance = (): OverridedMixpanel | null => {
        if (!analyticsState.enabled || !consent.isGranted) {
            return null;
        }
        return analyticsState.mp;
    };

    // Run fn with the live SDK instance; swallow everything so analytics can
    // never break product code.
    const withMp = (fn: (mp: OverridedMixpanel) => void) => {
        const mp = instance();
        if (!mp) {
            return;
        }
        try {
            fn(mp);
        } catch {
            /* analytics is best-effort */
        }
    };

    const track = <N extends EventName>(name: N, props: PropsFor<N>) => {
        withMp((mp) => mp.track(name, props));
        // Mirror the small conversion set to GA4 (acquisition only).
        if (analyticsState.gtag && GA4_CONVERSION_EVENTS.has(name)) {
            try {
                analyticsState.gtag('event', name, props);
            } catch {
                /* GA4 is best-effort */
            }
        }
    };

    const identify = (userId: string) => {
        withMp((mp) => {
            mp.identify(userId);
        });
    };

    const setUserProps = (p: Partial<UserProps>) => {
        if (import.meta.dev) {
            for (const key of Object.keys(p)) {
                if (!USER_PROP_KEYS.includes(key as keyof UserProps)) {
                    console.warn(`[analytics] unknown user prop "${key}" — not in allowlist`);
                }
            }
        }
        withMp((mp) => {
            mp.people.set(p);
        });
    };

    const registerSuper = (p: Record<string, unknown>) => {
        withMp((mp) => mp.register(p));
    };

    const reset = () => {
        withMp((mp) => mp.reset());
    };

    const flush = () => {
        // mixpanel-browser has no public flush in batch mode; nudge the internal
        // batcher if present, otherwise this is a no-op.
        withMp((mp) => {
            const batcher = (mp as { _flush?: () => void })._flush;
            if (typeof batcher === 'function') {
                batcher.call(mp);
            }
        });
    };

    return { track, identify, setUserProps, registerSuper, reset, flush };
};
