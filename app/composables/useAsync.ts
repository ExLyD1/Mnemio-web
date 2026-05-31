import { ref, shallowRef } from 'vue';

export interface ApiError {
    code: string;
    message: string;
}

export const useAsync = <TArgs extends unknown[], TData>(
    fn: (...args: TArgs) => Promise<TData>,
) => {
    const data = shallowRef<TData | null>(null);
    const error = ref<ApiError | null>(null);
    const loading = ref(false);

    const execute = async (...args: TArgs): Promise<TData | null> => {
        loading.value = true;
        error.value = null;
        try {
            const result = await fn(...args);
            data.value = result;
            return result;
        } catch (e) {
            error.value =
                e && typeof e === 'object' && 'code' in e && 'message' in e
                    ? (e as ApiError)
                    : { code: 'UNKNOWN', message: (e as Error)?.message ?? 'Unknown error' };
            return null;
        } finally {
            loading.value = false;
        }
    };

    return { data, error, loading, execute };
};
