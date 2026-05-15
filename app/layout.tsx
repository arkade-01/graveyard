import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GRAVEYARD — Where Solana tokens go to die",
  description:
    "A museum of dead Solana tokens. Tombstones, causes of death, and full autopsies.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0a] text-[#e8e8e8] antialiased">
        {children}
        <div className="mist-overlay" />
      </body>
    </html>
  );
}
