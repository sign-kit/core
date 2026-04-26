import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the @sign-kit/core demo app.
 *
 * Before running E2E tests for the first time:
 *   1. Build the WC bundle so /webcomponent route loads:
 *        npm --workspace=@sign-kit/core run build:wc
 *   2. Install browser binaries (one-time per machine):
 *        npx playwright install --with-deps chromium
 *   3. Run tests:
 *        npm run test:e2e
 *
 * The webServer block starts the Vite dev server automatically.
 * Set DEMO_URL env var to skip that and hit an already-running server.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  /** Run all specs sequentially – avoids port/PDF-worker contention. */
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never', outputFolder: 'tests/e2e/report' }], ['dot']],
  use: {
    baseURL: process.env.DEMO_URL || 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    /** Accept downloads but don't fail the test when one is triggered. */
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /** Start Vite dev server unless an external DEMO_URL is supplied. */
  webServer: process.env.DEMO_URL
    ? undefined
    : {
        command: 'npm --workspace=demo run dev -- --port 5180 --host',
        url: 'http://localhost:5180',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
