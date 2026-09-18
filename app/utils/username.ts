/**
 * Client mirror of the backend's username rules (mnemio-backend
 * src/schemas/users.schema.ts `usernameSchema`) — keep the two in sync.
 *
 * Checked up front so a bad handle is caught on the step where it was typed.
 * Before, onboarding only checked length on step 1 and the backend rejected
 * e.g. a Cyrillic handle after the interests step, with a raw English toast
 * ("Username may only contain letters, numbers and underscores"), which read
 * as "the name must be in English" / "can't sign up with a new email"
 * (QA (3) #8, (2) #4).
 */
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const RESERVED_USERNAMES = new Set([
    'admin',
    'administrator',
    'root',
    'system',
    'support',
    'help',
    'mnemio',
    'api',
    'me',
    'user',
    'login',
    'register',
    'auth',
]);

export type UsernameIssue = 'too_short' | 'too_long' | 'invalid_chars' | 'reserved';

export const usernameIssue = (raw: string): UsernameIssue | null => {
    const v = raw.trim();
    if (v.length < USERNAME_MIN) {
        return 'too_short';
    }
    if (v.length > USERNAME_MAX) {
        return 'too_long';
    }
    if (!USERNAME_RE.test(v)) {
        return 'invalid_chars';
    }
    if (RESERVED_USERNAMES.has(v.toLowerCase())) {
        return 'reserved';
    }
    return null;
};

/** i18n key (under `username.`) for an issue or a backend error code. */
export const usernameErrorKey = (issue: UsernameIssue | 'taken'): string =>
    ({
        too_short: 'username.errTooShort',
        too_long: 'username.errTooLong',
        invalid_chars: 'username.errInvalidChars',
        reserved: 'username.errReserved',
        taken: 'username.errTaken',
    })[issue];
