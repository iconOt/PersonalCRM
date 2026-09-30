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
    // The API tests run against the hosted InsForge backend, so each test makes
    // several real network round-trips. A single stage test issues ten of them, and
    // the hosted nano instance slows right down when the whole suite runs at once —
    // 30s was not enough and produced flaky timeouts. A genuine failure raises an
    // assertion error rather than hanging, so a generous ceiling does not hide bugs.
    testTimeout: 120000,
    hookTimeout: 120000,
  },
})
