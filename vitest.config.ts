import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', fileParallelism: false, exclude: ['node_modules', 'dist'] }
});
