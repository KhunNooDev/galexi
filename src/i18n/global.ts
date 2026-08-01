import { defaultLocale } from './config';
import messages from './locales/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: typeof defaultLocale;
    Messages: typeof messages;
  }
}
