import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sport of Kings - Seerat Un Nabi | BJJ & Martial Arts Manchester",
  description: "Professional, free martial arts instruction in Manchester UK. Join us for Brazilian Jiu-Jitsu, Kendo, and Strength & Conditioning. Reviving the Sunnah through sports excellence.",
  keywords: ["BJJ", "Brazilian Jiu-Jitsu", "martial arts", "Manchester", "Kendo", "strength conditioning", "Islamic", "Sunnah"],
  authors: [{ name: "Sport of Kings" }],
  openGraph: {
    title: "Sport of Kings - Seerat Un Nabi",
    description: "Professional martial arts instruction in Manchester. Brazilian Jiu-Jitsu, Kendo, and more.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  );
}
