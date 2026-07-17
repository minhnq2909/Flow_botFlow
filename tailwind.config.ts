import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
      },
      boxShadow: {
        panel: '0 16px 36px rgba(23, 32, 51, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
