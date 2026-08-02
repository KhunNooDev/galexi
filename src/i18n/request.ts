import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from '@/i18n/config';
import messages from '@/i18n/locales/en.json';

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages,
}));
