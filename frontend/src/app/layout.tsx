import type { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import './globals.css';

export const metadata = {
  title: 'Rencipe',
  description: '食谱分享平台',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        <ThemeProvider>
          <TopBar />
          {children}
        </ThemeProvider>
        <BottomNav />
      </body>
    </html>
  );
}
