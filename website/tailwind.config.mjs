import { addIconSelectors } from '@iconify/tailwind';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                primary: '#ffa500',
                primaryFocus: '#ff8700',
                secondary: '#6b7280',
                secondaryFocus: '#4b5563',
            },
        },
    },
    plugins: [daisyui, addIconSelectors(['mdi', 'mdi-light'])],
    daisyui: {
        themes: ['light'],
        themes: [
            {
                mytheme: {
                    primary: '#ffa500', // Matches orange-300
                    primaryFocus: '#ff8700', // Matches orange-400
                    secondary: '#6b7280', // Matches slate-500
                    secondaryFocus: '#4b5563', // Matches slate-600
                },
            },
        ],
    },
};
