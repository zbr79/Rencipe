import type { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreateFormProvider } from './contexts/CreateFormContext';
import { CartProvider } from './contexts/CartContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import CreateFormModal from './components/CreateFormModal';
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
          <CartProvider>
            <CreateFormProvider>
              <TopBar />
              {children}
              <BottomNav />
              <CreateFormModal />
            </CreateFormProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
