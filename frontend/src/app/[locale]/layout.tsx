import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import LocaleSync from '../components/LocaleSync';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../globals.css';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

async function loadMessages(locale: string) {
  if (!locale) {
    console.error('[Layout] ERROR: locale is undefined or empty!');
    locale = 'en';
  }
  console.log('[Layout] Loading messages for locale:', locale);
  return (await import(`../../../messages/${locale}.json`)).default;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // IMPORTANT: params is a Promise in Next.js 15+, must await it
  const { locale } = await params;
  console.log('[Layout] Unwrapped locale:', locale);
  const messages = await loadMessages(locale);

  return (
    <>
      <LocaleSync locale={locale} />
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}
