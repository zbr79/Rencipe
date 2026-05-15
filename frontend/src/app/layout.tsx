import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreateFormProvider } from './contexts/CreateFormContext';
import { SavedProvider } from './contexts/SavedContext';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import CreateFormModal from './components/CreateFormModal';
import AuthGate from './components/AuthGate';
import ConfirmDialogProvider from './components/ConfirmDialogProvider';
import ToastProvider from './components/toast/ToastProvider';
import './globals.css';

export const metadata = {
  title: 'Rencipe',
  description: 'Recipe sharing and meal building platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0..1,0" />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider />
          <SavedProvider>
            <ConfirmDialogProvider>
              <CreateFormProvider>
                <AuthGate>
                  <TopBar />
                  {children}
                  <BottomNav />
                  <CreateFormModal />
                </AuthGate>
              </CreateFormProvider>
            </ConfirmDialogProvider>
          </SavedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
