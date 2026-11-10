import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['unitarias/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'UTC' },
  },
});
