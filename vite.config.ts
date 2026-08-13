import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // The hooks render, so they need a document to render into.
    environment: 'jsdom',
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx only mounts the app; the .d.ts has no runtime at all.
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.test.*'],
      reporter: ['text'],
      // Where the suite stands today, rounded down. The floor, not the goal:
      // raise it as the suite grows, never lower it to make a red build green.
      // What is still open: the canvas, whose drop and ward wiring want a
      // rendered board, and the app shell, which is four lines of composition.
      thresholds: { lines: 75, statements: 75, functions: 70, branches: 75 },
    },
  },
})
