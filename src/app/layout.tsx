import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appartement Rose — Tarifs",
  description:
    "Calendrier de prix pour la location de l'Appartement Rose, lieu événementiel à Paris.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Appartement Rose — Tarifs",
    description:
      "Consultez les tarifs et disponibilités pour la location de l'Appartement Rose.",
    siteName: "Appartement Rose",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
