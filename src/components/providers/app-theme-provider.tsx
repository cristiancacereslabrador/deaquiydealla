"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type AppThemeProviderProps = {
  /** Contenido de la app que debe heredar el contexto de tema. */
  children: ReactNode;
};

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

/**
 * Proveedor de `next-themes` con `attribute="class"` para integrarse con Tailwind (`dark:`).
 *
 * @param props - Props estándar de React.
 * @returns Árbol envuelto con soporte de tema claro / oscuro / sistema.
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
