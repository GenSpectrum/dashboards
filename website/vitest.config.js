import { configDefaults, defineConfig } from 'vitest/config';

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
                test: {
                    name: 'browser',
                    include: ['src/**/*.browser.{test,spec}.tsx'],
                    browser: {
                        provider: 'playwright',
                        enabled: true,
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
});
