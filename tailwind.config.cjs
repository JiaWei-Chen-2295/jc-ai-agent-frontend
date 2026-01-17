/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#44ed26',
        'background-light': '#f8faf9',
        'background-accent': '#ecf3f0',
        'glass-light': 'rgba(255, 255, 255, 0.7)',
        'glass-border-light': 'rgba(255, 255, 255, 0.5)',
      },
      fontFamily: {
        sans: ['Manrope', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        display: ['Manrope', 'PingFang SC', 'sans-serif'],
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
