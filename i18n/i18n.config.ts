import { catalogs, type MessageNode } from '../app/i18n';
import { ukPluralRule } from '../app/i18n/plurals';

// The existing catalog resolver handles plain strings. Register plural
// messages with vue-i18n so both translation APIs use the same locale rule.
const plurals = (node: Record<string, MessageNode>): Record<string, MessageNode> => {
    const out: Record<string, MessageNode> = {};
    for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && value.includes(' | ')) {
            out[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            out[key] = plurals(value);
        }
    }
    return out;
};

export default defineI18nConfig(() => ({
    legacy: false,
    pluralRules: { uk: ukPluralRule },
    messages: { en: plurals(catalogs.en), uk: plurals(catalogs.uk) },
}));
