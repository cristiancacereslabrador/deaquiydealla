import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { RESTAURANT_BRAND_NAME } from "@/lib/brand";
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * Metadatos mínimos del documento; el título descriptivo por idioma vive en `[locale]/layout`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3686"
  ),
  title: RESTAURANT_BRAND_NAME,
  description: `Restaurante ${RESTAURANT_BRAND_NAME} — cocina china y latina en Granada.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "De Aquí y De Allá",
  },
  formatDetection: { telephone: false },
  themeColor: "#8B0000",
};

type RootLayoutProps = {
  children: ReactNode;
};

/**
 * Layout raíz: fuentes, tema global (`next-themes`) y variables CSS de Tailwind.
 *
 * @param props - Contenido hijo (típicamente el segmento `[locale]`).
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${dmSans.variable} ${cormorant.variable} h-full`}
    >
      <body 
        className="min-h-full bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
