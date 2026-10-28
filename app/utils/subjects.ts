// The fixed deck subjects and supported languages (spec 002). The backend owns
// both lists and serves them from GET /public/taxonomy (see useTaxonomy); the
// copies here are the fallback when that fetch fails and the source of the
// `Subject` type. Labels live in i18n: `subject.<slug>`, `languages.<code>`.
// The server normalizes every subject, so there's no client-side guessing.

// Display order — mirrors mnemio-backend src/shared/subjects.ts.
export const SUBJECTS = [
    'languages',
    'medicine',
    'science',
    'math',
    'technology',
    'humanities',
    'social',
    'business',
    'law',
    'arts',
    'test-prep',
    'other',
] as const;

export type Subject = (typeof SUBJECTS)[number];

// The 28 ISO 639-1 codes a deck may use — mirrors SUPPORTED_LANG_LIST.
export const SUPPORTED_LANGS = [
    'en',
    'uk',
    'es',
    'fr',
    'de',
    'pt',
    'it',
    'ru',
    'pl',
    'ja',
    'ko',
    'zh',
    'ar',
    'nl',
    'tr',
    'vi',
    'hi',
    'sv',
    'no',
    'da',
    'fi',
    'el',
    'cs',
    'ro',
    'hu',
    'he',
    'th',
    'id',
] as const;

const SUBJECT_SET: ReadonlySet<string> = new Set(SUBJECTS);

export const isSubject = (v: unknown): v is Subject => typeof v === 'string' && SUBJECT_SET.has(v);

type Translate = (key: string, fallback?: string) => string;

// A language code as shown in caps. Ukrainian reads "UA" (the internal code
// stays `uk` everywhere else).
export const displayLangCode = (code: string | null | undefined): string => {
    const c = (code ?? '').toLowerCase();
    return c === 'uk' ? 'UA' : c.toUpperCase();
};

export const subjectLabel = (t: Translate, slug: string): string =>
    t(`subject.${slug}`, t('subject.other'));

export const langLabel = (t: Translate, code: string | null | undefined): string => {
    const c = (code ?? '').toLowerCase();
    return c ? t(`languages.${c}`, displayLangCode(c)) : '';
};

// The create page's suggestion before the user picks: a deck whose words and
// definitions are in different languages is a language deck.
export const suggestSubject = (sourceLanguage: string, targetLanguage: string): Subject =>
    sourceLanguage && targetLanguage && sourceLanguage !== targetLanguage ? 'languages' : 'other';
