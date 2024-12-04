import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import parser from '@typescript-eslint/parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import astroParser from 'astro-eslint-parser';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

const importRules = {
    'import/no-cycle': 'error',
    'import/no-deprecated': 'error',
    'import/no-extraneous-dependencies': 'off',
    'import/no-internal-modules': 'off',
    'import/order': [
        'error',
        {
            'groups': ['builtin', 'external', 'internal'],
            'newlines-between': 'always',
            'alphabetize': { order: 'asc' },
        },
    ],
};

export default tseslint.config(
    { ignores: ['dist'], files: ['**/*.ts', '**/*.tsx'] },
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parser: parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react,
            'import': importPlugin,
            'react-hooks': reactHooks,
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            ...importRules,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files: ['**/*.astro'],
        extends: [
            eslint.configs.recommended,
            ...eslintPluginAstro.configs.recommended,
            ...tseslint.configs.strict,
            ...tseslint.configs.stylistic,
        ],
        languageOptions: {
            parser: astroParser,
        },
    },
);
