import { addIconSelectors } from '@iconify/tailwind';
import daisyui from 'daisyui';

const colors = {
    indigo: 'rgba(51, 34, 136, 0.9)',
    green: 'rgba(17, 119, 51, 1.0)',
    cyan: 'rgba(53, 166, 222, 1.0)',
    teal: 'rgba(68, 170, 153, 1.0)',
    olive: 'rgba(153, 153, 51, 1.0)',
    sand: 'rgba(187, 170, 85, 1.0)',
    rose: 'rgba(204, 102, 119, 1.0)',
    wine: 'rgba(136, 34, 85, 1.0)',
    purple: 'rgba(170, 68, 153, 1.0)',
};

const colorsWithAlpha = {
    indigoMuted: 'rgba(51, 34, 136, 0.3)',
    greenMuted: 'rgba(17, 119, 51, 0.3)',
    cyanMuted: 'rgba(53, 166, 222, 0.3)',
    tealMuted: 'rgba(68, 170, 153, 0.3)',
    oliveMuted: 'rgba(153, 153, 51, 0.3)',
    sandMuted: 'rgba(187, 170, 85, 0.3)',
    roseMuted: 'rgba(204, 102, 119, 0.3)',
    wineMuted: 'rgba(136, 34, 85, 0.3)',
    purpleMuted: 'rgba(170, 68, 153, 0.3)',
};

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                ...colors,
                ...colorsWithAlpha,
            },
        },
    },
    plugins: [daisyui, addIconSelectors(['mdi', 'mdi-light'])],
    daisyui: {
        themes: ['light'],
    },
};
