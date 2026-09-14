import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090f',
          900: '#0b0e17',
          850: '#10141f',
          800: '#161b29',
          700: '#222a3d',
          600: '#333d55',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          300: '#7db4ff',
          400: '#4f92ff',
          500: '#2f74f5',
          600: '#1f5ad6',
          700: '#1846a8',
        },
        accent: '#5ce2b4',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -12px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
    },
  },
  plugins: [],
};

export default config;
