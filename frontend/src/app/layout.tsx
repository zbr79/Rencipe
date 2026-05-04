import type { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreateFormProvider } from './contexts/CreateFormContext';
import { SavedProvider } from './contexts/SavedContext';
import TopBar from './components/TopBar';
import GlobalSearchBar from './components/GlobalSearchBar';
import BottomNav from './components/BottomNav';
import CreateFormModal from './components/CreateFormModal';
import AuthGate from './components/AuthGate';
import ToastProvider from './components/toast/ToastProvider';
import './globals.css';

export const metadata = {
  title: 'Rencipe',
  description: 'Recipe sharing and meal planning platform',
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
            <CreateFormProvider>
              <AuthGate>
                <TopBar />
                <GlobalSearchBar />
                {children}
                <BottomNav />
                <CreateFormModal />
              </AuthGate>
            </CreateFormProvider>
          </SavedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
