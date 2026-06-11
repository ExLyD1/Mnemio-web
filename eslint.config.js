import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const tsconfigRootDir = import.meta.dirname;

export default [
    // ── 1. Global ignores ────────────────────────────────────────────────────
    {
        ignores: [
            'dist/**',
            'coverage/**',
            'node_modules/**',
            'eslint.config.js',
            '.nuxt/**',
            '.output/**',
            'public/**',
        ],
    },

    // ── 2. TypeScript — .ts files ────────────────────────────────────────────
    ...tsPlugin.configs['flat/recommended'].map((config) => ({
        ...config,
        files: ['**/*.ts'],
    })),
    {
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                // tailwind.config.ts isn't part of any tsconfig project (nuxt.config.ts
                // is, via .nuxt/tsconfig.node.json); let it fall back to the default
                // inferred project so it still parses for type-aware linting.
                projectService: {
                    allowDefaultProject: ['tailwind.config.ts'],
                },
                tsconfigRootDir,
            },
        },
    },

    // ── 3. All files — Prettier + project rules ───────────────────────────────
    {
        files: ['**/*.{js,ts}'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...prettierConfig.rules,
            'prettier/prettier': 'error',
            'arrow-body-style': 'off',
            'prefer-arrow-callback': 'off',

            // ── General ──────────────────────────────────────────────────────
            'no-console': 'off',
            'no-debugger': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-duplicate-imports': 'error',
            'no-useless-return': 'error',
            'no-return-await': 'error',
            'no-throw-literal': 'error',
            'prefer-template': 'error',
            'object-shorthand': ['error', 'always'],
            'no-unused-vars': 'off',
            'no-shadow': 'off',
            'no-use-before-define': 'off',
            'no-redeclare': 'off',
            'no-undef': 'off',
        },
    },

    // ── 4. TypeScript — type-aware rules ─────────────────────────────────────
    {
        files: ['**/*.ts'],
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        languageOptions: {
            parser: tsParser,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-use-before-define': 'error',
            '@typescript-eslint/no-redeclare': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/restrict-template-expressions': 'error',
            '@typescript-eslint/only-throw-error': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },

    // ── 5. Root config files — relax type-aware "unsafe" rules ────────────────
    // nuxt.config.ts / tailwind.config.ts reference build-time globals (process.env)
    // that aren't typed in the default project (no @types/node), which would otherwise
    // trip no-unsafe-* on every `process.env.X`. They're infra, not app code.
    {
        files: ['*.config.ts'],
        rules: {
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
        },
    },
];
