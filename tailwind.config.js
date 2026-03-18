/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'background-dark': '#0f1115',
        'surface-dark': '#161920',
        'surface-dark-2': '#1a1d24',
        'border-dark': '#1e293b',
        'c-base': 'var(--c-base)',
        'c-surface': 'var(--c-surface)',
        'c-surface2': 'var(--c-surface2)',
        'c-border': 'var(--c-border)',
      },
      fontFamily: {
        display: ['"Noto Sans JP"', 'sans-serif'],
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
