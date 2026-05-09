import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALQR — Active Location QR",
  description: "Scan og du vil finde — QR-kode der finder din nærmeste afdeling automatisk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
