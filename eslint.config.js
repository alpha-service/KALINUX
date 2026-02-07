// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      // React specific rules from eslint-plugin-react
      'react/jsx-uses-react': 'error', // Ensure React is imported when JSX is used
      'react/jsx-uses-vars': 'error', // Ensure vars used in JSX are defined

      // React Hooks rules from eslint-plugin-react-hooks
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
    },
  },
  // Test files - Jest globals
  {
    files: ["**/__tests__/**/*.js", "**/__tests__/**/*.jsx", "**/*.test.js", "**/*.test.jsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      }
    },
  },
];
