import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // 10 seconds for real API calls
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Focus coverage on business logic only (Services, Utils, Hooks)
      // UI components are tested via E2E testing for visual regression
      include: [
        'src/services/**/*.ts',
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
        'src/hooks/**/*.tsx',
        'src/utils/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/components/**',
        'src/pages/**',
        'src/types/**',
        'src/assets/**',
        'src/styles/**',
        'src/integrations/**',
        'src/context/**',
        'src/store/**',
        'src/routes/**',
        'src/layouts/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

