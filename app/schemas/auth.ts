import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('auth.errors.email_invalid'),
    password: z.string().min(8, 'auth.errors.password_too_short'),
});

export const registerSchema = loginSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
