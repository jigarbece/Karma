import { defineConfig, devices } from '@playwright/test';

// E2E runs the built app in demo mode (no Supabase env), so it needs no backend.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', ...devices['Pixel 7'] },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
