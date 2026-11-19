import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culinomics — 3D Profit Intelligence Cockpit",
  description: "3D Restaurant Profit Intelligence & Financial Analytics Cockpit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-forest-black text-neutral-100">
        {children}
      </body>
    </html>
  );
}
