import { useAsync } from '@/composables/useAsync';
import { useImportsStore } from '@/stores/imports';

export const useApkgImport = () => {
    const store = useImportsStore();
    return { store, upload: useAsync(store.importFile) };
};
