import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './components/**/**/*.{ts,tsx}',
    './styles/**/*.css'
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        canvas: {
          surface: 'var(--canvas-surface)',
          surfaceAlt: 'var(--canvas-surface-alt)',
          elevated: 'var(--canvas-surface-elevated)',
          toolbar: 'var(--canvas-toolbar-bg)',
          accent: 'var(--canvas-accent-indigo)',
          accentIris: 'var(--canvas-accent-iris)',
          accentMint: 'var(--canvas-accent-mint)',
          text: 'var(--canvas-text-primary)',
          textMuted: 'var(--canvas-text-secondary)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'canvas-sm': 'var(--canvas-radius-sm)',
        'canvas-md': 'var(--canvas-radius-md)',
        'canvas-lg': 'var(--canvas-radius-lg)',
        'canvas-pill': 'var(--canvas-radius-pill)'
      },
      boxShadow: {
        'canvas-xs': 'var(--canvas-shadow-xs)',
        'canvas-sm': 'var(--canvas-shadow-sm)',
        'canvas-md': 'var(--canvas-shadow-md)',
        'canvas-lg': 'var(--canvas-shadow-lg)'
      }
    },
  },
  plugins: []
} satisfies Config;