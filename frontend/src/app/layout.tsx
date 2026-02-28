import "./globals.css";
import BottomNav from "./components/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ paddingBottom: "60px" }}>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}