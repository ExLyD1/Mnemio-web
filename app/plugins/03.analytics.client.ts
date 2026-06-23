/**
 * Analytics bootstrap (client-only). Runs after 01.auth.client so auth state is
 * hydrated. Resolves the runtime gate, captures first-touch attribution, wires
 * consent → opt-in, and identifies an already-authed user on boot.
 *
 * No product events are fired here except `app_opened`. Everything else lives at
 * its call-site via useAnalytics(). See docs/analytics-implementation-plan.md.
 */
import { useGtag } from '#imports';
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

export default defineNuxtPlugin(async (nuxtApp) => {
    const config = useRuntimeConfig();
    const { analyticsEnabled, mixpanelToken, analyticsCardSampling } = config.public as {
        analyticsEnabled: boolean;
        mixpanelToken: string;
        analyticsCardSampling: number;
    };

    analyticsState.enabled = Boolean(analyticsEnabled) && Boolean(mixpanelToken);
    analyticsState.cardSampling = Number(analyticsCardSampling) || 0;

    if (!analyticsState.enabled) {
        return;
    }

    const auth = useAuthStore();
    const analytics = useAnalytics();
    const route = useRoute();

    // GA4 forwarder (acquisition only). The tag loads on every page via nuxt-gtag
    // (enabled in nuxt.config); we just keep a reference for the conversion mirror.
    // nuxt-gtag's composable types aren't resolved by the linter (auto-import),
    // so pin the shape we use.
    const useGtagTyped = useGtag as () => {
        gtag: (command: string, ...args: unknown[]) => void;
    };
    const { gtag } = useGtagTyped();
    analyticsState.gtag = gtag;

    const attribution = resolveAttribution(route.query);
    const locale = (nuxtApp.$i18n as { locale?: { value?: string } } | undefined)?.locale?.value;

    // No consent gate — initialise immediately and track from the first pageview.
    await loadMixpanel(mixpanelToken, import.meta.dev);

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

    // Initial pageview, then every SPA route change.
    analytics.trackPageview(route.path);
    useRouter().afterEach((to) => {
        analytics.trackPageview(to.path);
    });
});
