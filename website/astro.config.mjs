import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import auth from 'auth-astro';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [react(), auth({ configFile: './src/auth.config' })],
    output: 'server',
    adapter: node({
        mode: 'standalone',
    }),
    vite: { plugins: [tailwindcss()] },
});
