import Navbar from "components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark text-white min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
