/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#115E59', // Clinical Forest Teal
          900: '#134E4A',
          950: '#042F2E',
        },
        sage: {
          50: '#f4f7f5',
          100: '#e5ede8',
          200: '#cbdcd2',
          300: '#a5c2b3',
          400: '#7ca491',
          500: '#5c8772',
          600: '#476c5b',
          700: '#3a574a',
          800: '#30463c',
          900: '#293a33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
