import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import BottomNav from '../components/BottomNav';
import '../globals.css';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

export const metadata = {
  title: 'Rencipe',
  description: 'A recipe sharing platform',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
};

async function loadMessages(locale: string) {
  if (!locale) {
    console.error('[Layout] ERROR: locale is undefined or empty!');
    locale = 'en';
  }
  console.log('[Layout] Loading messages for locale:', locale);
  return (await import(`../../../messages/${locale}.json`)).default;
}

export default async function RootLayout({
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
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
