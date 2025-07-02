import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 1000 * 35,                       //35 seconds
    maxConcurrency: 2,                            // Limit to 2 concurrent tests
    globalSetup: './tests/setup/setup.global.ts',
    exclude: ['node_modules', 'dist'],
    sequence: {
      // run test files one after another
      concurrent: false,
    },
  },
});