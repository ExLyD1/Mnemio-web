import en from './en.json';
import uk from './uk.json';

export type LocaleCode = 'en' | 'uk';

export type MessageNode = string | string[] | { [key: string]: MessageNode };
export type Catalog = Record<string, MessageNode>;

export const catalogs: Record<LocaleCode, Catalog> = { en, uk };

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const isLocale = (value: string): value is LocaleCode => value in catalogs;
