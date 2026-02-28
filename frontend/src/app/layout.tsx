import "./globals.css";
import BottomNav from "./components/BottomNav";

export const metadata = {
  title: 'Rencipe',
  description: 'A recipe sharing platform',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        {children}
        
        {/* BOTTOM NAV - MOVED TO ROOT LAYOUT WHERE IT RENDERS */}
        <BottomNav />
      </body>
    </html>
  );
}