import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:4321',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    projects: [
        // API integration tests (browser-independent)
        {
            name: 'api',
            testMatch: /.*\/api\/.*\.spec\.ts/,
            // No browser device - runs in Node.js context
        },

        // Browser-based UI tests
        {
            name: 'chromium',
            testIgnore: /.*\/api\/.*/,
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            testIgnore: /.*\/api\/.*/,
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            testIgnore: /.*\/api\/.*/,
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
