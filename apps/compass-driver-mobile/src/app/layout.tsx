import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import '@shared/styles/globals.css';
import '../styles/mobile-fixes.css';
import 'react-toastify/dist/ReactToastify.css';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* PWA manifest — нужен для Web Push на iOS (16.4+) в режиме "На экран домой" */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Compass Driver" />
        <meta name="theme-color" content="#1d4ed8" />
      </head>
      <body className="overscroll-none touch-manipulation">
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
      </body>
    </html>
  );
}
