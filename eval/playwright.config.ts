import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.KIDS_CHESS_EVAL_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['line'],
    ['html', { outputFolder: 'results/html', open: 'never' }],
    ['json', { outputFile: 'results/results.json' }],
  ],
  outputDir: 'results/artifacts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.KIDS_CHESS_EVAL_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'pnpm --dir .. build && python3 -m http.server 3000 --directory ../dist/client',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
