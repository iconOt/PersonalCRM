/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amber: {
          500: '#ecad0a',
        },
        brand: {
          blue: '#209dd7',
          purple: '#753991',
          amber: '#ecad0a',
        },
      },
    },
  },
  plugins: [],
}
