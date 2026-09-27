import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', '.wrangler/**', 'node_modules/**', 'public/media/**', 'package-lock.json'] },
  {
    ...js.configs.recommended,
    files: ['public/*.js', 'functions/**/*.js', 'worker/**/*.js', 'astro.config.mjs', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-control-regex': 'off' }
  }
];
