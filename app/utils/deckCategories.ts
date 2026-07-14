export const DECK_CATEGORIES = [
    'languages',
    'vocabulary',
    'medicine',
    'nursing',
    'anatomy',
    'pharmacology',
    'biology',
    'chemistry',
    'physics',
    'math',
    'computer-science',
    'programming',
    'engineering',
    'history',
    'geography',
    'law',
    'business',
    'finance',
    'psychology',
    'philosophy',
    'literature',
    'art',
    'music',
    'social-science',
    'test-prep',
    'religion',
    'culinary',
    'sports',
    'trivia',
    'other',
] as const;

export type DeckCategory = (typeof DECK_CATEGORIES)[number];

const SLUG_SET = new Set<string>(DECK_CATEGORIES);

export const normCategory = (subject: string | null | undefined): DeckCategory => {
    if (!subject) {
        return 'other';
    }
    const s = subject.toLowerCase().trim();

    if (SLUG_SET.has(s)) {
        return s as DeckCategory;
    }

    // Legacy alias
    if (s === 'tech') {
        return 'computer-science';
    }

    // Keyword heuristics for old free-text subjects
    if (
        s.includes('lang') ||
        s.includes('мова') ||
        s.includes('english') ||
        s.includes('ukrainian') ||
        s.includes('spanish') ||
        s.includes('french') ||
        s.includes('german') ||
        s.includes('italian') ||
        s.includes('japanese') ||
        s.includes('chinese') ||
        s.includes('korean') ||
        s.includes('portuguese')
    ) {
        return 'languages';
    }
    if (s.includes('vocab') || s.includes('word') || s.includes('term')) {
        return 'vocabulary';
    }
    if (s.includes('medic') || s.includes('health') || s.includes('clinic')) {
        return 'medicine';
    }
    if (s.includes('nurs')) {
        return 'nursing';
    }
    if (s.includes('anatom') || s.includes('physiol')) {
        return 'anatomy';
    }
    if (s.includes('pharma') || s.includes('drug')) {
        return 'pharmacology';
    }
    if (s.includes('bio')) {
        return 'biology';
    }
    if (s.includes('chem')) {
        return 'chemistry';
    }
    if (s.includes('physics') || s.includes('physic')) {
        return 'physics';
    }
    if (s.includes('math') || s.includes('calcul') || s.includes('algebra')) {
        return 'math';
    }
    if (s.includes('computer') || s.includes('cs ') || s === 'cs') {
        return 'computer-science';
    }
    if (
        s.includes('program') ||
        s.includes('code') ||
        s.includes('coding') ||
        s.includes('software') ||
        s.includes('developer')
    ) {
        return 'programming';
    }
    if (s.includes('engineer')) {
        return 'engineering';
    }
    if (s.includes('histor')) {
        return 'history';
    }
    if (s.includes('geograph') || s.includes('country') || s.includes('capital')) {
        return 'geography';
    }
    if (s.includes('law') || s.includes('legal') || s.includes('juris')) {
        return 'law';
    }
    if (s.includes('business') || s.includes('econom') || s.includes('market')) {
        return 'business';
    }
    if (s.includes('financ') || s.includes('account') || s.includes('invest')) {
        return 'finance';
    }
    if (s.includes('psych')) {
        return 'psychology';
    }
    if (s.includes('philos')) {
        return 'philosophy';
    }
    if (s.includes('liter') || s.includes('book') || s.includes('grammar')) {
        return 'literature';
    }
    if (s.includes('art') || s.includes('design') || s.includes('draw')) {
        return 'art';
    }
    if (s.includes('music') || s.includes('piano') || s.includes('guitar')) {
        return 'music';
    }
    if (s.includes('social') || s.includes('sociol') || s.includes('anthrop')) {
        return 'social-science';
    }
    if (
        s.includes('test') ||
        s.includes('exam') ||
        s.includes('prep') ||
        s.includes('sat') ||
        s.includes('gre')
    ) {
        return 'test-prep';
    }
    if (
        s.includes('religio') ||
        s.includes('theol') ||
        s.includes('bible') ||
        s.includes('quran')
    ) {
        return 'religion';
    }
    if (s.includes('culin') || s.includes('cook') || s.includes('food') || s.includes('recipe')) {
        return 'culinary';
    }
    if (s.includes('sport') || s.includes('fitness') || s.includes('gym')) {
        return 'sports';
    }
    if (s.includes('trivia') || s.includes('general') || s.includes('quiz')) {
        return 'trivia';
    }

    return 'other';
};
