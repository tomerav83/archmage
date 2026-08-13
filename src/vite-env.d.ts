/// <reference types="vite/client" />

export {}

// Lets components pass CSS custom properties: style={{ '--accent': accent }}
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
