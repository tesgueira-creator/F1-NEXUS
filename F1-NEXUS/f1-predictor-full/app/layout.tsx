import "styles/globals.css";
import Navbar from "components/Navbar";
import ErrorBoundary from "components/ErrorBoundary";
import { Inter, Rajdhani } from "next/font/google";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400","500","700"], variable: "--font-display" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={`${inter.variable} ${rajdhani.variable} bg-asphalt text-white min-h-screen font-sans`}>
        <ErrorBoundary>
          <Navbar />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
