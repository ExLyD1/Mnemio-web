import { z } from 'zod';

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const birthdayRegex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const parseBirthday = (s: string): Date | null => {
    const m = birthdayRegex.exec(s);
    if (!m) {
        return null;
    }
    const [, , mm, dd] = m;
    const yyyy = s.slice(0, 4);
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (
        d.getFullYear() !== Number(yyyy) ||
        d.getMonth() !== Number(mm) - 1 ||
        d.getDate() !== Number(dd)
    ) {
        return null;
    }
    return d;
};

const yearsBetween = (from: Date, to: Date): number => {
    let years = to.getFullYear() - from.getFullYear();
    const m = to.getMonth() - from.getMonth();
    if (m < 0 || (m === 0 && to.getDate() < from.getDate())) {
        years--;
    }
    return years;
};

export const loginSchema = z.object({
    email: z.string().email('auth.errors.email_invalid'),
    password: z.string().min(8, 'auth.errors.password_too_short'),
});

export const registerSchema = loginSchema;

export const otpSchema = z.object({
    code: z.string().regex(/^\d{6}$/, 'auth.errors.code_invalid'),
});

export const accountDetailsSchema = z.object({
    fullName: z.string().trim().min(1, 'auth.errors.fullName_required'),
    username: z.string().regex(usernameRegex, 'auth.errors.username_invalid'),
    birthday: z
        .string()
        .refine((s) => parseBirthday(s) !== null, 'auth.errors.birthday_invalid')
        .refine((s) => {
            const d = parseBirthday(s);
            return d ? yearsBetween(d, new Date()) >= 13 : false;
        }, 'auth.errors.birthday_too_young'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type AccountDetailsInput = z.infer<typeof accountDetailsSchema>;
