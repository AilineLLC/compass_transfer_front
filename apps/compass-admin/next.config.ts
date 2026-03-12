import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

function normalizeApiOrigin(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/api$/i, '');
}

function toCspHost(raw?: string) {
  const origin = normalizeApiOrigin(raw);
  if (!origin) return undefined;
  try {
    const u = new URL(origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
}

const API_ORIGIN =
  normalizeApiOrigin(process.env.API_ORIGIN) ??
  normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
const API_CSP_ORIGIN = toCspHost(API_ORIGIN);

// Заголовки безопасности, которые будут применяться ко всем маршрутам
const getSecurityHeaders = (isDev: boolean) => {
  const baseHeaders = [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(self)',
    },
  ];

  // В режиме разработки используем более мягкий CSP для Яндекс Карт
  const cspHeader = {
    key: 'Content-Security-Policy',
    value: isDev
      ? `default-src 'self'; connect-src 'self' http://api.compass.local:3030 http://api.compass.local:3032 ws://api.compass.local:3030 ws://api.compass.local:3032 ${API_CSP_ORIGIN ?? ''} https://api.open-meteo.com https://api.exchangerate-api.com https://api-maps.yandex.ru https://geocode-maps.yandex.ru https://router.project-osrm.org wss://api.compasstransfer.kg; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-maps.yandex.ru https://yastatic.net https://*.yandex.ru; style-src 'self' 'unsafe-inline' https://unpkg.com https://yastatic.net https://*.yandex.ru; img-src 'self' data: https: https://core-renderer-tiles.maps.yandex.net https://yastatic.net https://*.maps.yandex.net https://*.yandex.ru; media-src 'self' https://www.youtube.com https://youtube.com; frame-src https://www.youtube.com https://youtube.com;`
      : `default-src 'self'; connect-src 'self' http://api.compass.local:3030 http://api.compass.local:3032 ws://api.compass.local:3030 ws://api.compass.local:3032 ${API_CSP_ORIGIN ?? ''} https://api.open-meteo.com https://api.exchangerate-api.com https://api-maps.yandex.ru https://geocode-maps.yandex.ru https://yastatic.net https://*.maps.yandex.net https://*.yandex.ru https://router.project-osrm.org https://api.compasstransfer.kg wss://api.compasstransfer.kg; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-maps.yandex.ru https://yastatic.net https://*.yandex.ru; style-src 'self' 'unsafe-inline' https://unpkg.com https://yastatic.net https://*.yandex.ru; img-src 'self' data: https: https://core-renderer-tiles.maps.yandex.net https://yastatic.net https://*.maps.yandex.net https://*.yandex.ru; media-src 'self' https://www.youtube.com https://youtube.com; frame-src https://www.youtube.com https://youtube.com;`,
  };

  return [...baseHeaders, cspHeader];
};
const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'funny.klev.club',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        port: '',
        pathname: '/get/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'compass.local',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'compass.local',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Добавляем настройку заголовков
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const securityHeaders = getSecurityHeaders(isDev);

    return [
      {
        // Применяем ко всем маршрутам
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Отдельно настраиваем Content-Security-Policy для API
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'none'; style-src 'self'",
          },
        ],
      },
      {
        // Добавляем заголовки CORS для запросов к внешнему API
        source: '/Auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },

  async rewrites() {
    if (!API_ORIGIN) return [];
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/:path*` }];
  },

  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
};

module.exports = withNextIntl(nextConfig);
