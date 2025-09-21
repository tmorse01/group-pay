import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  esbuild: {
    target: 'node18',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
