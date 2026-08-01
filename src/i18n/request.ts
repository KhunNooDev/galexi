import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from './config';
import messages from './locales/en.json';

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages,
}));
