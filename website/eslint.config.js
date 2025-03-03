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
    'import/no-extraneous-dependencies': 'error',
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

const importRulesAstro = {
    ...importRules,
    'import/no-deprecated': 'off',
};

const enableFromEslint = {
    'no-console': 'error',
};

const disableFromTypescriptEsLint = {
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
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

const disableFromReact = {
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    'react/react-in-jsx-scope': 'off',
};

export default tseslint.config(
    {
        ignores: ['**/.astro/content.d.ts'],
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
            import: importPlugin,
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...importRules,
            ...namingConvention,
            ...restrictTemplateExpressions,
            ...disableFromTypescriptEsLint,
            ...disableFromReact,
            ...enableFromEslint,
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
            ...disableFromTypescriptEsLint,
            ...enableFromEslint,
            ...importRulesAstro,
        },
        languageOptions: {
            parser: astroParser,
        },
        plugins: {
            import: importPlugin,
        },
    },
    { ...reactHooks.configs['recommended-latest'], ignores: ['**/*.fixture.ts'] },
);
