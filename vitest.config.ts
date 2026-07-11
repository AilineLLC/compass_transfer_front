import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'packages/shared/**/*.ts',
        'packages/features/**/*.ts',
        'packages/features/**/*.tsx',
        'packages/entities/**/*.ts',
        'packages/entities/**/*.tsx',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.*',
        '**/index.ts',
        '**/*.d.ts',
        '**/interface/**',
        '**/enums/**',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared'),
      '@features': path.resolve(__dirname, 'packages/features'),
      '@entities': path.resolve(__dirname, 'packages/entities'),
      '@app': path.resolve(__dirname, 'packages/app'),
      '@pages': path.resolve(__dirname, 'packages/pages'),
      '@widgets': path.resolve(__dirname, 'packages/widgets'),
      '@server': path.resolve(__dirname, 'packages/server'),
    },
  },
});
