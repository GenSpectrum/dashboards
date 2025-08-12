import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [react(), auth({ configFile: './src/auth.config' })],
    output: 'server',
    adapter: vercel({
        edgeMiddleware: true,
    }),
    vite: { plugins: [tailwindcss()] },
});
