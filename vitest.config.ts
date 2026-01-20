import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // ONLY unit/spec tests by default - smoke tests excluded (too resource-intensive)
    // Smoke tests can be run manually via: npm run test:smoke
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: [
      'node_modules',
      'dist',
      'templates',
      'docs',
      'src/smoke/**', // Explicitly exclude smoke tests
    ],
    // Prevent stack overflow during worker cleanup (avoid process forking)
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Reduced timeouts for unit tests (smoke tests need longer, but we're not running them)
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'templates/',
        'docs/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'src/smoke/**', // Exclude smoke tests from coverage
      ],
    },
  },
});
