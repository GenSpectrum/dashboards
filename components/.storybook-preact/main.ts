import type { StorybookConfig } from '@storybook/preact-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(jsx|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        'storybook-addon-fetch-mock',
    ],
    framework: {
        name: '@storybook/preact-vite',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
};
export default config;
