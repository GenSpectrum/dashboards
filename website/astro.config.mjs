import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [react()],
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    security: {
        allowedDomains: [
            {
                hostname: 'genspectrum.org',
                protocol: 'https',
            },
            {
                hostname: 'staging.genspectrum.org',
                protocol: 'https',
            },
            // for the e2e tests that run the container locally
            {
                hostname: 'localhost',
                port: '4321',
                protocol: 'http',
            },
        ],
    },
    vite: { plugins: [tailwindcss()] },
});
