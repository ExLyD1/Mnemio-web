/**
 * useAnalytics — the ONLY analytics surface components/stores/composables touch.
 * Typed against app/analytics/events.ts so event names and props can't drift.
 *
 * Every method is a hard no-op unless analytics is enabled (runtime config) and
 * a token is present. All SDK calls are wrapped so analytics can never throw into
 * product code.
 */
import type { OverridedMixpanel, Response as MixpanelResponse } from 'mixpanel-browser';
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

    // Logging is enabled on the dev server, or on a deployed build with
    // NUXT_PUBLIC_ANALYTICS_DEBUG=true.
    const logging = import.meta.dev || analyticsState.debug;

    const log = (message: string, payload?: unknown) => {
        if (logging) {
            console.info(`[Mixpanel] ${message}`, payload ?? '');
        }
    };

    // Did Mixpanel actually ingest the event? Truthy = sent + acknowledged by the
    // server; 0 / {status:0} = dropped (opt-out, ad-blocker, network). In debug we
    // disable batching so this callback fires per request, making the log honest.
    const wasSent = (response: MixpanelResponse): boolean =>
        response === 1 || (typeof response === 'object' && response.status === 1);

    // Builds the send callback that logs the *real* outcome (only when logging).
    const onResult =
        (label: string, payload?: unknown) =>
        (response: MixpanelResponse): void => {
            if (wasSent(response)) {
                log(`Tracked ${label}`, payload);
            } else {
                log(`NOT tracked (dropped — opt-out / blocker / network): ${label}`, payload);
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
            // Attach the send callback only when logging so production keeps its
            // normal batched delivery untouched.
            if (logging) {
                mp.track(name, props, onResult(name, props));
            } else {
                mp.track(name, props);
            }
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

    // Pageview as Mixpanel's own web-pageview event, tracked through track() so we
    // get the same send-callback confirmation (the SDK's track_pageview has no
    // callback). Fired on initial load + every SPA route change.
    const trackPageview = (path?: string) => {
        withMp((mp) => {
            const props = {
                current_url_path: window.location.pathname,
                current_url_search: window.location.search,
                current_page_title: document.title,
                ...(path ? { path } : {}),
            };
            if (logging) {
                mp.track(
                    '$mp_web_page_view',
                    props,
                    onResult('PageView', path ?? props.current_url_path),
                );
            } else {
                mp.track('$mp_web_page_view', props);
            }
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
