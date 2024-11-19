import { addIconSelectors } from '@iconify/tailwind';
import daisyui from 'daisyui';

const colors = {
    indigo: '#473894', // rgba(51, 34, 136, 0.9)
    green: '#117733',
    cyan: '#35a6de', // I modified '#88CCEE' manually to make it darker
    teal: '#44AA99',
    olive: '#999933',
    sand: '#DDCC77',
    rose: '#CC6677',
    wine: '#882255',
    purple: '#AA4499',
};

const colorsWithAlpha = {
    indigoMuted: '#C2BDDB', // rgba(51, 34, 136, 0.3)
    greenMuted: '#B8D6C2', // rgba(17, 119, 51, 0.3)
    cyanMuted: '#DBF0FA', // rgba(136, 204, 238, 0.3)
    tealMuted: '#C7E6E1', // rgba(68, 170, 153, 0.3)
    oliveMuted: '#D5D28A', // rgba(153, 153, 51, 0.3)
    sandMuted: '#E0E8C3', // rgba(221, 204, 119, 0.3)
    roseMuted: '#E0A2B4', // rgba(204, 102, 119, 0.3)
    wineMuted: '#D35B8C', // rgba(136, 34, 85, 0.3)
    purpleMuted: '#D68CB7', // rgba(170, 68, 153, 0.3)
};

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    safelist: [/^hover:(text|bg|decoration)-/],
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
