import { copyFile, mkdir } from 'node:fs/promises';

import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const mswDirectory = new URL('./tests/mocks/', import.meta.url);
await mkdir(mswDirectory, { recursive: true });
await copyFile(new URL(import.meta.resolve('msw/mockServiceWorker.js')), new URL('mockServiceWorker.js', mswDirectory));

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'node',
                    exclude: [...configDefaults.exclude, './tests/**', 'src/**/*.browser.{test,spec}.tsx'],
                    setupFiles: 'vitest.setup.ts',
                },
            },
            {
                publicDir: './tests/mocks',
                optimizeDeps: {
                    include: ['yaml'],
                },
                test: {
                    name: 'browser',
                    include: ['src/**/*.browser.{test,spec}.tsx'],
                    browser: {
                        provider: playwright(),
                        enabled: true,
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
});
