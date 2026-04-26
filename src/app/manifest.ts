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
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/images/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        form_factor: 'wide',
        label: 'De Aquí y De Allá - Restaurante',
      },
      {
        src: '/images/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        label: 'De Aquí y De Allá - Pedidos',
      },
    ],
    shortcuts: [
      {
        name: 'Ver Menú',
        short_name: 'Menú',
        description: 'Explora nuestra carta de comida china y latina',
        url: '/menu',
        icons: [{ src: '/images/logo.png', sizes: '1024x1024' }],
      },
      {
        name: 'Mi Carrito',
        short_name: 'Carrito',
        description: 'Finaliza tu pedido',
        url: '/cart',
        icons: [{ src: '/images/logo.png', sizes: '1024x1024' }],
      },
    ],
    categories: ['food', 'productivity'],
    lang: 'es',
    dir: 'ltr',
    prefer_related_applications: false,
  };
}
