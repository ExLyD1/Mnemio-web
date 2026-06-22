/**
 * Internal analytics client state — the SDK boundary. Nothing outside the
 * analytics module (useAnalytics + plugins/03.analytics.client.ts) should import
 * this. Components and stores use useAnalytics().
 *
 * Holds the lazily-loaded mixpanel-browser singleton plus the resolved runtime
 * gate, so useAnalytics() can be called from anywhere on the client (including
 * outside a component setup) without re-reading Nuxt context each call.
 */
import type { OverridedMixpanel } from 'mixpanel-browser';

interface AnalyticsState {
    /** mixpanel-browser singleton once init() has run; null until then. */
    mp: OverridedMixpanel | null;
    /** runtimeConfig.public.analyticsEnabled && a token is present. */
    enabled: boolean;
    /** 0..1 sampling rate for the high-volume per-card event. */
    cardSampling: number;
    /** GA4 event forwarder (set by the plugin from useGtag), if available. */
    gtag: ((command: string, ...args: unknown[]) => void) | null;
}

const state: AnalyticsState = {
    mp: null,
    enabled: false,
    cardSampling: 0,
    gtag: null,
};

export const analyticsState = state;

/**
 * Lazily load + init the mixpanel-browser singleton. Idempotent. Kept as a
 * dynamic import so the SDK stays out of the bundle when analytics is disabled.
 */
export const loadMixpanel = async (token: string, debug: boolean): Promise<void> => {
    if (state.mp) {
        return;
    }
    const { default: mixpanel } = await import('mixpanel-browser');
    mixpanel.init(token, {
        debug,
        batch_requests: true,
        persistence: 'localStorage',
        // Opted out until the user grants consent; the plugin opts in on accept.
        opt_out_tracking_by_default: true,
        // We send attribution as super-props; let Mixpanel keep its own too.
        ignore_dnt: false,
    });
    state.mp = mixpanel;
};
