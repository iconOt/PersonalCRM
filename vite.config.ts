import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The API tests run against the hosted InsForge backend, so each test
    // makes several real network round-trips.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
