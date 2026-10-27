/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { devAi } from './vite.dev-ai.ts';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    devAi(loadEnv(mode, process.cwd(), '')),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Karma',
        short_name: 'Karma',
        description: 'See your karma. Grow every day.',
        theme_color: '#1E1B4B',
        background_color: '#FBF5E6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/functions/, /^\/auth/] },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/recharts|d3-|victory-vendor/.test(id)) return 'charts';
          if (/framer-motion|motion-dom|motion-utils/.test(id)) return 'motion';
          if (/react-dom|react-router|\/react\/|scheduler/.test(id)) return 'react';
          if (/astronomy-engine/.test(id)) return 'astronomy';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    // tests are hermetic: never talk to a real Supabase project from .env.local
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    globals: true,
    testTimeout: 20_000, // full-app render tests can be slow on busy machines
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
