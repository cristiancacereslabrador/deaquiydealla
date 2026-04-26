import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'De Aquí y De Allá',
    short_name: 'De Aquí y De Allá',
    description: 'Restaurante de comida china en Granada. Pide online o consulta nuestra carta.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Negro para que el splash screen de Android muestre el logo sobre fondo negro
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        // Icono principal con fondo negro para splash screen
        src: '/images/splash-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Icono maskable (adaptativo) con fondo negro
        src: '/images/splash-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        // Icono estándar adicional para compatibilidad
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/images/splash-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'De Aquí y De Allá - Restaurante',
      },
    ],
    shortcuts: [
      {
        name: 'Ver Carta',
        short_name: 'Carta',
        description: 'Explora nuestra carta de comida china',
        url: '/menu',
        icons: [{ src: '/images/splash-icon.png', sizes: '1024x1024' }],
      },
      {
        name: 'Mi Carrito',
        short_name: 'Carrito',
        description: 'Finaliza tu pedido',
        url: '/cart',
        icons: [{ src: '/images/splash-icon.png', sizes: '1024x1024' }],
      },
    ],
    categories: ['food', 'lifestyle'],
    lang: 'es',
    dir: 'ltr',
    prefer_related_applications: false,
  };
}
