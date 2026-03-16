/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#44ed26',
          hover: '#3ad420', // Approximated hover state
        },
        background: {
          dark: '#181b20',
          surface: '#20242a',
          input: '#121417',
        },
        surface: {
          dark: '#20242a',
          border: '#323842',
        },
        text: {
          main: '#E6E8ED',
          muted: '#9ca3af',
        },
      },
      boxShadow: {
        glow: '0 0 15px rgba(68, 237, 38, 0.3)',
        'card-hover': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Manrope', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        display: ['Manrope', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
}
