/**
 * Analytics bootstrap (client-only). Runs after 01.auth.client so auth state is
 * hydrated. Resolves the runtime gate and registers the router pageview hook
 * synchronously, then loads the SDK + fires boot events via onNuxtReady so the
 * dynamic import never blocks hydration (an awaited import here breaks the first
 * client-side navigation and leaves pages blank until reload).
 *
 * No product events are fired here except `app_opened`. Everything else lives at
 * its call-site via useAnalytics(). See docs/analytics-implementation-plan.md.
 */
import { useAuthStore } from '@/stores/auth';
import { analyticsState, loadMixpanel } from '@/analytics/client';
import { useAnalytics } from '@/composables/useAnalytics';

const ATTRIBUTION_KEY = 'mnemio:attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

interface Attribution {
    referrer?: string;
    landing_path?: string;
    captured_at?: string;
    [utm: string]: string | undefined;
}

/** First-touch attribution: capture once, persist, reuse on every later visit. */
const resolveAttribution = (query: Record<string, unknown>): Attribution => {
    try {
        const existing = localStorage.getItem(ATTRIBUTION_KEY);
        if (existing) {
            return JSON.parse(existing) as Attribution;
        }
    } catch {
        /* ignore */
    }
    const attribution: Attribution = {
        landing_path: window.location.pathname,
        captured_at: new Date().toISOString(),
    };
    if (document.referrer && !document.referrer.includes(window.location.host)) {
        attribution.referrer = document.referrer;
    }
    for (const key of UTM_KEYS) {
        const value = query[key];
        if (typeof value === 'string' && value) {
            attribution[key] = value;
        }
    }
    try {
        localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    } catch {
        /* ignore */
    }
    return attribution;
};

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const {
        analyticsEnabled,
        analyticsDebug,
        mixpanelToken,
        mixpanelApiHost,
        analyticsCardSampling,
    } = config.public as {
        analyticsEnabled: boolean;
        analyticsDebug: boolean;
        mixpanelToken: string;
        mixpanelApiHost: string;
        analyticsCardSampling: number;
    };

    analyticsState.enabled = Boolean(analyticsEnabled) && Boolean(mixpanelToken);
    analyticsState.cardSampling = Number(analyticsCardSampling) || 0;
    analyticsState.debug = import.meta.dev || Boolean(analyticsDebug);

    if (!analyticsState.enabled) {
        return;
    }

    const auth = useAuthStore();
    const analytics = useAnalytics();
    const route = useRoute();

    // GA4 forwarder (acquisition only). The gtag.js tag is server-rendered in
    // <head> (nuxt.config), which defines the global `gtag`/`dataLayer`; mirror
    // the conversion events to it.
    analyticsState.gtag = (command: string, ...args: unknown[]) => {
        const w = window as unknown as { gtag?: (...a: unknown[]) => void };
        w.gtag?.(command, ...args);
    };

    // Track every SPA route change (no-op until the SDK has loaded below).
    useRouter().afterEach((to) => {
        analytics.trackPageview(to.path);
    });

    // Load the SDK and fire boot events AFTER hydration — never block the plugin
    // chain (an awaited dynamic import here delays mount and breaks the first
    // client-side navigation/redirect, leaving pages blank until a full reload).
    onNuxtReady(async () => {
        const attribution = resolveAttribution(route.query);
        const locale = (nuxtApp.$i18n as { locale?: { value?: string } } | undefined)?.locale
            ?.value;

        await loadMixpanel(mixpanelToken, analyticsState.debug, mixpanelApiHost);

        analytics.registerSuper({
            platform: 'web',
            // Tag every event so dev/local traffic can be excluded from reports
            // even if analytics is left on in development.
            environment: import.meta.dev ? 'development' : 'production',
            plan: auth.plan,
            app_locale: locale ?? 'en',
            acquisition_source: attribution.referrer ?? attribution.utm_source ?? 'direct',
            ...attribution,
        });

        if (auth.isAuthenticated && auth.currentUser) {
            analytics.identify(auth.currentUser.id);
            analytics.setUserProps({ plan: auth.plan, app_locale: locale ?? 'en' });
        }

        analytics.track('app_opened', {
            is_authenticated: auth.isAuthenticated,
            entry_path: attribution.landing_path ?? route.path,
        });

        // Initial pageview; subsequent navigations are handled by the router hook.
        analytics.trackPageview(route.path);
    });
});
