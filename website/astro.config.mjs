import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import auth from 'auth-astro';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [react(), auth({ configFile: './src/auth.config' })],
    output: 'server',
    adapter: process.env.VERCEL
        ? (await import('@astrojs/vercel/serverless')).default()
        : (await import('@astrojs/node')).default({ mode: 'standalone' }),
    vite: { plugins: [tailwindcss()] },
});
