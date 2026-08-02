import { defaultLocale } from '@/i18n/config';
import messages from '@/i18n/locales/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: typeof defaultLocale;
    Messages: typeof messages;
  }
}
