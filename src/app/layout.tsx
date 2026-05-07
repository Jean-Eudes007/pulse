import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/AppToaster";
import { Header } from "@/components/Header";
import { VerificationBanner } from "@/components/VerificationBanner";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse — Feedback produit",
  description: "Centralisez et priorisez le feedback produit",
};

// Runs synchronously before the rest of the page renders, so the dark
// theme is applied before paint (no flash of light theme).
const themeInitScript = `
try {
  var t = localStorage.getItem('pulse-theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.dataset.theme = 'dark';
  }
} catch (_) {}
`.trim();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const showVerificationBanner = Boolean(user && !user.emailVerifiedAt);

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg-tertiary text-text-primary font-sans">
        {/* C-2 audit: skip-to-content for keyboard users — invisible
            until focused, then sits top-left on top of everything. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-action focus:text-text-info focus:px-3 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
        >
          Aller au contenu principal
        </a>
        <Header />
        <main
          id="main"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8"
        >
          {showVerificationBanner && user && (
            <VerificationBanner email={user.email} />
          )}
          {children}
        </main>
        <AppToaster />
        <Analytics />
      </body>
    </html>
  );
}
