import { addIconSelectors } from '@iconify/tailwind';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {},
    },
    plugins: [daisyui, addIconSelectors(['mdi', 'mdi-light'])],
    daisyui: {
        themes: ['light'],
    },
};
