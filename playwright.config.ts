import { defineConfig } from '@playwright/test';

const port = 4173;
const desktop = { width: 1280, height: 720 };

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  globalSetup: './tests/global-setup.ts',
  snapshotPathTemplate:
    '{testDir}/__snapshots__/{testFileName}/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: `http://localhost:${port}`,
    browserName: 'chromium',
  },
  webServer: {
    command: `node tests/serve.mjs`,
    url: `http://localhost:${port}/health`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'html', testMatch: /(html|cli)\.spec\.ts/ },
    {
      name: 'light',
      testMatch: 'visual.spec.ts',
      use: { viewport: desktop, colorScheme: 'light' },
    },
    {
      name: 'dark',
      testMatch: 'visual.spec.ts',
      use: { viewport: desktop, colorScheme: 'dark' },
    },
    {
      name: 'mobile',
      testMatch: 'visual.spec.ts',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        colorScheme: 'light',
      },
    },
    {
      name: 'print',
      testMatch: 'visual.spec.ts',
      metadata: { media: 'print' },
      use: { viewport: desktop, colorScheme: 'light' },
    },
  ],
});
