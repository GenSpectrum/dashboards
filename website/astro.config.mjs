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
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                // gridjs-react ships both CJS and ESM builds; Vite's package scanner picks up
                // the CJS entry and then fails to find named exports. Pointing directly at the
                // ESM dist file bypasses that detection entirely.
                'gridjs-react': 'gridjs-react/dist/gridjs.production.es.min.js',
            },
        },
    },
});
