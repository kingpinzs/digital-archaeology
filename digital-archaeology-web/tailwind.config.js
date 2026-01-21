/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'da-bg-primary': 'var(--da-bg-primary)',
        'da-bg-secondary': 'var(--da-bg-secondary)',
        'da-bg-tertiary': 'var(--da-bg-tertiary)',
        'da-text-primary': 'var(--da-text-primary)',
        'da-text-secondary': 'var(--da-text-secondary)',
        'da-accent': 'var(--da-accent)',
        'da-accent-hover': 'var(--da-accent-hover)',
        'da-signal-high': 'var(--da-signal-high)',
        'da-signal-low': 'var(--da-signal-low)',
        'da-gate-and': 'var(--da-gate-and)',
        'da-gate-or': 'var(--da-gate-or)',
        'da-gate-xor': 'var(--da-gate-xor)',
        'da-gate-not': 'var(--da-gate-not)',
        'da-error': 'var(--da-error)',
        'da-warning': 'var(--da-warning)',
        'da-success': 'var(--da-success)',
      },
    },
  },
  plugins: [],
}

