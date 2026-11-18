import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culinomics - Stage 0",
  description: "Stage 0 Verification & Architecture Scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
