import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'De Aquí y De Allá',
    short_name: 'DeAquíDeAllá',
    description: 'Panel de cocina — gestión de pedidos en tiempo real',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf7f2',
    theme_color: '#8B0000',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['food', 'productivity'],
    lang: 'es',
    dir: 'ltr',
    prefer_related_applications: false,
  };
}
