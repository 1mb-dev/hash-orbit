import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.config.ts', '*.config.js'],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript-ESLint recommended rules
  ...tseslint.configs.recommended,

  // Custom configuration for all TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',

      // General code quality
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // Test file specific rules
  {
    files: ['test/**/*.ts'],
    rules: {
      'no-console': 'off', // Allow console in tests
    },
  }
);
