import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransmuteAI | Enterprise Multi-Modal GenAI Platform",
  description: "Automated Content Transformation with Cryptographic Provenance Ledger and Multi-Format Synthesis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
