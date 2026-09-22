import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  test: {
    globals: true,
    root: './',

    include: ['**/*.spec.ts'],

    exclude: ['**/*.integration.spec.ts', '**/*.e2e-spec.ts', '**/node_modules/**', '**/dist/**'],
  },
});
