import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
    integrations: [tailwind(), react(), auth({ configFile: './src/auth.config' })],
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    vite: {
        build: {
            minify: 'esbuild',
        },
    },
});
