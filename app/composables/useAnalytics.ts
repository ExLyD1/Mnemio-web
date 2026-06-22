/**
 * useAnalytics — the ONLY analytics surface components/stores/composables touch.
 * Typed against app/analytics/events.ts so event names and props can't drift.
 *
 * Every method is a hard no-op unless analytics is enabled (runtime config),
 * a token is present, AND the user granted consent. All SDK calls are wrapped
 * so analytics can never throw into product code.
 */
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
    // at runtime when the user clicks Accept, so read it on every call.
    const ready = () => analyticsState.enabled && consent.isGranted && !!analyticsState.mp;

    const safe = (fn: () => void) => {
        if (!ready()) return;
        try {
            fn();
        } catch {
            // Analytics must never break product code.
        }
    };

    const track = <N extends EventName>(name: N, props: PropsFor<N>) => {
        safe(() => analyticsState.mp!.track(name, props as Record<string, unknown>));
        // Mirror the small conversion set to GA4 (acquisition only).
        if (analyticsState.gtag && GA4_CONVERSION_EVENTS.has(name)) {
            try {
                analyticsState.gtag('event', name, props as Record<string, unknown>);
            } catch {
                /* noop */
            }
        }
    };

    const identify = (userId: string) => {
        safe(() => analyticsState.mp!.identify(userId));
    };

    const setUserProps = (p: Partial<UserProps>) => {
        if (import.meta.dev) {
            for (const key of Object.keys(p)) {
                if (!USER_PROP_KEYS.includes(key as keyof UserProps)) {
                    // eslint-disable-next-line no-console
                    console.warn(`[analytics] unknown user prop "${key}" — not in allowlist`);
                }
            }
        }
        safe(() => analyticsState.mp!.people.set(p));
    };

    const registerSuper = (p: Record<string, unknown>) => {
        safe(() => analyticsState.mp!.register(p));
    };

    const reset = () => {
        safe(() => analyticsState.mp!.reset());
    };

    const flush = () => {
        // mixpanel-browser flushes its batch queue via the (undocumented but
        // stable) internal request batchers; guard defensively.
        safe(() => {
            const mp = analyticsState.mp as unknown as { _flush?: () => void };
            mp._flush?.();
        });
    };

    return { track, identify, setUserProps, registerSuper, reset, flush };
};
