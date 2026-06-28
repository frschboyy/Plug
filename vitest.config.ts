import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Fail the build if coverage drops below these thresholds
      thresholds: {
        functions: 75,
        branches:  70,
        lines:     75,
        statements:75,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/app/**',              // pages are integration-tested, not unit-tested
        'src/**/*.d.ts',
        'src/lib/supabase/**',     // thin wrappers; tested via integration
        'src/lib/database.types.ts',                   // generated file
        'src/middleware.ts',                           // Edge runtime, not unit-testable
        'src/components/auth/**',                      // mocked in all tests
        'src/components/layout/**',                    // layout-only, E2E territory
        'src/components/ui/Toast.tsx',                 // mocked in all tests
        'src/components/ui/ErrorBoundary.tsx',         // class-based error boundary
        'src/components/ui/OfflineBanner.tsx',         // browser event-driven
        'src/components/ui/ShareButton.tsx',           // navigator.share, not mockable simply
        'src/components/listings/CategoryFilter.tsx',  // async Server Component
        'src/components/listings/ImageCarousel.tsx',   // complex media interaction
        'src/components/listings/SearchBar.tsx',       // URL/router hooks
        'src/components/listings/ShareButton.tsx',     // navigator.share
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
