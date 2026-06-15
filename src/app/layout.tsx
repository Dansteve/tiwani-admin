import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/state/Providers";
import { themeInitScript } from "@/features/theme/theme";

// Inter via next/font, exposed as --font-inter, which styles/theme.css maps onto --font-sans (parity
// with the family app + website, which source the identical Inter family). Docs/Brand.md.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TIWANI Admin",
  description:
    "Internal staff admin for TIWANI. Pre-production, mock data only (Decisions.md D16).",
  // Staff tooling must never be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Warm background matching --background (light); the inline theme script + ThemeProvider re-point this
  // to the dark surface (#15201C) when dark is active, so the mobile chrome reads as one surface.
  themeColor: "#F1EFE8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the inline script below sets the .dark class on <html> before hydration
    // (so the first paint is the right theme, no FOUC). That makes the server-rendered class attribute
    // and the hydrated one legitimately differ on <html>; this flag tells React that is expected here.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* FOUC guard: runs synchronously before first paint. The theme preference is a client choice the
            server cannot know, so this reads the stored preference / prefers-color-scheme and sets the
            .dark class before React hydrates. Source of truth: features/theme/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
