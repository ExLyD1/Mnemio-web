import type { AiUsage, AiUsageKind } from '@/api/chat';

type Counter = AiUsage['kinds'][AiUsageKind];

/**
 * A counter is only worth showing when the user is about to run out: the last
 * 20% of the allowance, and always at least the last one. Premium (unlimited)
 * never shows one — a permanent counter makes people feel rationed.
 */
export const isRunningLow = (k: Counter): boolean =>
    !k.unlimited && k.remaining <= Math.max(1, Math.floor(k.cap * 0.2));
