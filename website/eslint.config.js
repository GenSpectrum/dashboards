import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import parser from '@typescript-eslint/parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import astroParser from 'astro-eslint-parser';
import importPlugin from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';

const importRules = {
    'import-x/no-cycle': 'error',
    'import-x/no-deprecated': 'error',
    'import-x/no-extraneous-dependencies': 'error',
    'import-x/no-internal-modules': 'off',
    'import-x/order': [
        'error',
        {
            'groups': ['builtin', 'external', ['internal', 'unknown', 'parent', 'sibling', 'index']],
            'newlines-between': 'always',
            'alphabetize': { order: 'ignore' },
            'distinctGroup': false,
        },
    ],
};

const importRulesAstro = {
    ...importRules,
    'import-x/no-deprecated': 'off',
};

const enableFromEslint = {
    'no-console': 'error',
};

const typescriptEsLintOverwrites = {
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
        },
    ],
};

const namingConvention = {
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: 'default',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
        },
        {
            selector: 'function',
            format: ['camelCase', 'PascalCase'],
        },
        {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
        },
        {
            selector: 'enumMember',
            format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
            selector: 'import',
            format: null,
        },
        {
            selector: 'typeLike',
            format: ['PascalCase'],
        },
    ],
};

const restrictTemplateExpressions = {
    '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
            allowNumber: true,
            allow: [{ name: ['unknown', 'Error', 'URLSearchParams', 'URL'], from: 'lib' }],
        },
    ],
};

export default tseslint.config(
    {
        ignores: ['**/.astro/content.d.ts', 'dist/**', 'node_modules/**', '.vitest/**', 'tests/mocks/mockServiceWorker.js'],
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            eslintReact.configs['recommended-typescript'],
            eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'],
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
            'import-x': importPlugin,
        },
        rules: {
            ...importRules,
            ...namingConvention,
            ...restrictTemplateExpressions,
            ...typescriptEsLintOverwrites,
            ...enableFromEslint,
            '@eslint-react/rules-of-hooks': 'off',
            '@eslint-react/refs': 'off',
            '@eslint-react/set-state-in-effect': 'off',
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
        rules: {
            ...namingConvention,
            ...typescriptEsLintOverwrites,
            ...enableFromEslint,
            ...importRulesAstro,
        },
        languageOptions: {
            parser: astroParser,
        },
        plugins: {
            'import-x': importPlugin,
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        ignores: ['**/*.fixture.ts', 'test-extend.ts'],
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
);
