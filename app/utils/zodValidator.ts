import type { ZodType } from 'zod';

export const toFormValidator = <T>(schema: ZodType<T>) => {
    return (values: unknown) => {
        const result = schema.safeParse(values);
        if (result.success) {
            return {};
        }
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join('.');
            if (!(key in errors)) {
                errors[key] = issue.message;
            }
        }
        return errors;
    };
};
