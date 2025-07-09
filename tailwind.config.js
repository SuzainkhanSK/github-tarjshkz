/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      spacing: {
        '18': '4.5rem',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
    },
  },
  plugins: [],
};