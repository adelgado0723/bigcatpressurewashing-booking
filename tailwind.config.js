/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c8ff',
          300: '#66acff',
          400: '#3391ff',
          500: '#0075ff',
          600: '#005ecc',
          700: '#004799',
          800: '#002f66',
          900: '#001833',
        },
      },
    },
  },
  plugins: [],
} 