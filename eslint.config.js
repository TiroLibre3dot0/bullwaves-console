import js from '@eslint/js'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        React: 'readonly',
        console: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        confirm: 'readonly',
        Promise: 'readonly',

        // Some legacy code still references process.* in the browser bundle.
        // Prefer import.meta.env going forward, but keep commits unblocked.
        process: 'readonly',

        // Common browser APIs used in the console
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        Event: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      // Keep the old key to avoid breaking existing rule prefixes,
      // but also register the canonical key used by eslint-plugin-react-hooks.
      react: pluginReactHooks,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // This rule is useful, but it becomes noisy with regex-heavy legacy files
      // and can block commits via lint-staged.
      'no-useless-escape': 'off',
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
