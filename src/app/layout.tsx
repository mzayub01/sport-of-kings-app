import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#C5A456',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Sport of Kings - Seerat Un Nabi | BJJ & Martial Arts Manchester",
  description: "Professional martial arts instruction in Manchester UK. Join us for Brazilian Jiu-Jitsu classes. Reviving the Sunnah through sports excellence.",
  keywords: ["BJJ", "Brazilian Jiu-Jitsu", "martial arts", "Manchester", "Islamic", "Sunnah", "fitness"],
  authors: [{ name: "Sport of Kings" }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sport of Kings',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Sport of Kings - Seerat Un Nabi",
    description: "Professional martial arts instruction in Manchester. Brazilian Jiu-Jitsu and more.",
    type: "website",
    locale: "en_GB",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  );
}
