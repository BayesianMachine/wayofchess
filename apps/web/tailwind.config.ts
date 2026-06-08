import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'board-light':   '#D4A96A',
        'board-dark':    '#3E2B1E',
        'board-border':  '#2A1A10',
        'mando-blue':    '#4A90D9',
        'mando-silver':  '#B8C5D0',
        'mando-gold':    '#C99A2E',
        'imperial-gray': '#3C3C3C',
        'imperial-red':  '#C0392B',
        'space-bg':      '#080C14',
      },
      keyframes: {
        'clock-danger': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.35' },
        },
        'check-pulse': {
          '0%':    { opacity: '0', transform: 'scale(0.85)' },
          '40%':   { opacity: '0.85' },
          '100%':  { opacity: '0.6', transform: 'scale(1)' },
        },
        'board-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-3px)' },
          '40%':      { transform: 'translateX(3px)' },
          '60%':      { transform: 'translateX(-2px)' },
          '80%':      { transform: 'translateX(2px)' },
        },
      },
      animation: {
        'clock-danger': 'clock-danger 0.9s ease-in-out infinite',
        'check-pulse':  'check-pulse 0.35s ease-out forwards',
        'board-shake':  'board-shake 0.25s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config
