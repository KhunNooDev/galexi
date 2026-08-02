import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { ThemeProvider } from '@/components/theme-provider';
import { defaultLocale } from '@/i18n/config';
import { cn } from '@/lib/utils';

import '@/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      suppressHydrationWarning
      className={cn(geistSans.variable, 'h-full antialiased')}
    >
      <body className='flex min-h-full flex-col overflow-x-clip'>
        <NextIntlClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
