import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // The hooks render, so they need a document to render into.
    environment: 'jsdom',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx only mounts the app; the .d.ts has no runtime at all.
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.test.*'],
      reporter: ['text', 'html'],
      // Where the suite stands today, rounded down. The floor, not the goal:
      // raise it as the suite grows, never lower it to make a red build green.
      // What is still open: the canvas and the card, which need a rendered
      // React Flow, and the app shell, which is four lines of composition.
      thresholds: { lines: 70, statements: 70, functions: 65, branches: 70 },
    },
  },
})
