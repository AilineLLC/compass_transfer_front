import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin(); // Заголовки безопасности, которые будут применяться ко всем маршрутам

function normalizeApiOrigin(raw?: string) {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Some deployments historically set NEXT_PUBLIC_API_URL like "http://host/api".
  // Internally we want the origin (no trailing "/api") for proxying "/api/:path*".
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
};

module.exports = withNextIntl(nextConfig);
