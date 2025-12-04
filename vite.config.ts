import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React (loaded on every page)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Database & API (loaded on most pages)
          supabase: ['@supabase/supabase-js'],
          'tanstack-query': ['@tanstack/react-query'],

          // Heavy libraries - split separately for better caching
          'agora-rtc': ['agora-rtc-sdk-ng'],
          'agora-rtm': ['agora-rtm-sdk'],
          xlsx: ['xlsx'],
          recharts: ['recharts'],
          'framer-motion': ['framer-motion'],

          // Radix UI - split by usage pattern
          'radix-dialogs': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
          'radix-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-select',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
          ],
          'radix-navigation': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-menubar',
            '@radix-ui/react-tabs',
          ],
          'radix-feedback': [
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-collapsible',
          ],

          // Form libraries
          'form-libs': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    // Increase chunk size warning limit for split chunks
    chunkSizeWarningLimit: 1000,
  },
}));
