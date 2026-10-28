import type { Subject } from '@/utils/subjects';

/** GET /public/taxonomy — the fixed subject and language lists (spec 002). */
export interface Taxonomy {
    /** Display order. */
    subjects: Subject[];
    /** The supported ISO 639-1 codes. */
    languages: string[];
    /** Pre-002 category slug → its subject, for /discover/<old> 301s. */
    legacySubjects: Record<string, Subject>;
}
