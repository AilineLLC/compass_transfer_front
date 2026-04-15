import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin(); // Заголовки безопасности, которые будут применяться ко всем маршрутам

function normalizeApiOrigin(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/api$/i, '');
}

const API_ORIGIN =
  normalizeApiOrigin(process.env.API_ORIGIN) ??
  normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL);
const securityHeaders = [
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
    value: 'DENY',
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
const nextConfig: NextConfig = {
  reactStrictMode: false,
  basePath: '/terminal',
  assetPrefix: '/terminal',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    dangerouslyAllowSVG: false,
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
    return [
      {
        // Применяем ко всем маршрутам
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Кэширование статических изображений
        source: '/regions/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Кэш на год
          },
        ],
      },
      {
        // Кэширование флагов и других статических ресурсов
        source: '/(flag|logo|fonts|taxi-tariffs)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // Кэш на год
          },
        ],
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

  // Оптимизация Webpack для уменьшения предупреждений о больших строках
  webpack: (config, { dev, isServer }) => {
    // Оптимизация кэша для больших строк
    if (!dev && !isServer) {
      config.cache = {
        ...config.cache,
        compression: 'gzip', // Сжатие кэша
        maxMemoryGenerations: 1, // Ограничение памяти
      };
    }

    // Оптимизация для SVG и больших строк
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = withNextIntl(nextConfig);
