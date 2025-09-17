import "styles/globals.css";
import Navbar from "components/Navbar";
import ErrorBoundary from "components/ErrorBoundary";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-asphalt text-white min-h-screen font-sans">
        <ErrorBoundary>
          <Navbar />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
