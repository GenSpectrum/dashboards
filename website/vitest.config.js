import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        exclude: [...configDefaults.exclude, './tests/**'],
        setupFiles: 'vitest.setup.ts',
    },
});
