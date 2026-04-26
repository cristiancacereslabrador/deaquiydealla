"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Splash screen CSS que aparece cuando la app se abre como PWA instalada.
 * Detecta si el modo es standalone (instalada) y muestra el logo sobre
 * fondo negro durante ~1.5s, luego desaparece con fade-out.
 * Compatible con iOS y Android sin necesitar imágenes de tamaños específicos.
 */
export function PWASplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Solo mostrar splash si la app está instalada como PWA (modo standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as any).standalone === true;

    if (!isStandalone) return;

    // Mostrar el splash
    setVisible(true);

    // Iniciar fade-out después de 1.4 segundos
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    // Ocultar completamente después de la animación (1.4s + 0.6s de fade)
    const hideTimer = setTimeout(() => setVisible(false), 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.6s ease-out",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div style={{ width: "70vmin", height: "70vmin", position: "relative" }}>
        <Image
          src="/images/splash-icon.png"
          alt="De Aquí y De Allá"
          fill
          sizes="70vmin"
          style={{ objectFit: "contain" }}
          priority
        />
      </div>
    </div>
  );
}
