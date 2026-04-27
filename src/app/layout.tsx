import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { PWASplashScreen } from "@/components/pwa/pwa-splash-screen";
import { RESTAURANT_BRAND_NAME } from "@/lib/brand";
import { OfflineIndicator } from "@/components/layout/offline-indicator";
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Caveat } from "next/font/google";
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

const caveat = Caveat({
  variable: "--font-caveat",
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "De Aquí y De Allá",
    // No usamos startupImage porque iOS requiere ~10 tamaños exactos.
    // En su lugar usamos un splash CSS en el layout que desaparece al cargar.
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/images/splash-icon.png",
    apple: "/images/splash-icon.png",
  },
};

export const viewport = {
  // Negro para que el splash screen coincida con el fondo del icono
  themeColor: "#000000",
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
      className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} h-full`}
    >
      <body 
        className="min-h-full bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AppThemeProvider>
          <PWASplashScreen />
          <PWAProvider />
          <OfflineIndicator />
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
