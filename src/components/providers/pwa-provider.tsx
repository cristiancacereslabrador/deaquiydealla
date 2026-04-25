'use client';

import { useEffect } from 'react';

/**
 * Proveedor para registrar el Service Worker de la PWA.
 * 
 * @returns {null} Este componente no renderiza nada.
 */
export function PWAProvider() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado con éxito:', registration.scope);
        })
        .catch((error) => {
          console.error('Fallo al registrar el SW:', error);
        });
    }
  }, []);

  return null;
}
