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
    /** Console-log every tracked event (dev server, or NUXT_PUBLIC_ANALYTICS_DEBUG). */
    debug: boolean;
    /** GA4 event forwarder (set by the plugin → global gtag), if available. */
    gtag: ((command: string, ...args: unknown[]) => void) | null;
}

const state: AnalyticsState = {
    mp: null,
    enabled: false,
    cardSampling: 0,
    debug: false,
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
        persistence: 'localStorage',
        // Batch in production for fewer requests; in debug send each event
        // immediately so the per-event send callback (and our console log) fires
        // right away and reflects the real, server-acknowledged result.
        batch_requests: !debug,
        batch_size: 50,
        batch_flush_interval_ms: 30000,
        // The Mnemio projects are EU data residency (eu.mixpanel.com) — they only
        // ingest at api-eu.mixpanel.com; the US host silently drops every event.
        api_host: 'https://api-eu.mixpanel.com',
        // Track from the first pageview — no consent gate.
        opt_out_tracking_by_default: false,
        // We send attribution as super-props; let Mixpanel keep its own too.
        ignore_dnt: false,
        // Pageviews are tracked manually via the router in 03.analytics.client.ts
        // (so SPA navigations are consent-gated and logged) — disable auto-track
        // here to avoid double-counting.
        track_pageview: false,
    });
    state.mp = mixpanel;
};
