/**
 * useAnalytics — the ONLY analytics surface components/stores/composables touch.
 * Typed against app/analytics/events.ts so event names and props can't drift.
 *
 * Every method is a hard no-op unless analytics is enabled (runtime config),
 * a token is present, AND the user granted consent. All SDK calls are wrapped
 * so analytics can never throw into product code.
 */
import type { OverridedMixpanel } from 'mixpanel-browser';
import { analyticsState } from '@/analytics/client';
import {
    GA4_CONVERSION_EVENTS,
    USER_PROP_KEYS,
    type EventName,
    type PropsFor,
    type UserProps,
} from '@/analytics/events';

export const useAnalytics = () => {
    // Returns the SDK instance (narrowed non-null) only when analytics is enabled
    // and the SDK has been initialised by the bootstrap plugin.
    const instance = (): OverridedMixpanel | null => {
        if (!analyticsState.enabled) {
            return null;
        }
        return analyticsState.mp;
    };

    // Dev-visible breadcrumb whenever something is actually sent (no-op calls
    // stay silent so the log reflects reality). Mirrors the "[Meta Pixel] …" style.
    const log = (message: string, payload?: unknown) => {
        if (import.meta.dev) {
            console.info(`[Mixpanel] ${message}`, payload ?? '');
        }
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
        withMp((mp) => {
            mp.track(name, props);
            log(`Tracked ${name}`, props);
        });
        // Mirror the small conversion set to GA4 (acquisition only).
        if (analyticsState.gtag && GA4_CONVERSION_EVENTS.has(name)) {
            try {
                analyticsState.gtag('event', name, props);
            } catch {
                /* GA4 is best-effort */
            }
        }
    };

    // Pageview, routed through our pipeline so it's consent-gated and logged
    // (replaces mixpanel's auto track_pageview so SPA navigations also log).
    const trackPageview = (path?: string) => {
        withMp((mp) => {
            mp.track_pageview(path ? { path } : undefined);
            log('Tracked PageView', path ?? '');
        });
    };

    const identify = (userId: string) => {
        withMp((mp) => {
            mp.identify(userId);
            log(`Identified ${userId}`);
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

    return { track, trackPageview, identify, setUserProps, registerSuper, reset, flush };
};
