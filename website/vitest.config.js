import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    environment: 'jsdom',
                    exclude: [
                        ...configDefaults.exclude,
                        './tests/**',
                        'src/**/*.browser.{test,spec}.ts'
                    ],
                    setupFiles: 'vitest.node.setup.ts',
                }
            },
            {
                test: {
                    name: 'browser',
                    include: ['src/**/*.browser.{test,spec}.tsx'],
                    browser: {
                        enabled: true,
                        instances: [
                            { browser: 'chromium' },
                        ],
                    },
                    // setupFiles: ['vitest.browser.setup.ts']
                }
            }
        ]
    },
});
