import { publicGet } from '@/utils/publicHttp';
import type { Taxonomy } from '@/types/taxonomy';

// Public and SSR-safe: the Discover pages need it in the server render pass.
export const getTaxonomy = (): Promise<Taxonomy> => publicGet<Taxonomy>('/public/taxonomy');
