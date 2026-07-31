import 'server-only';

import type { Locale } from './config';

type Dictionary = typeof import('./locales/en.json');

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./locales/en.json').then((module) => module.default),
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
