/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#EEEEEE',
        brandYellow: '#FAE251',
        brandOrange: '#D75656',
        brandMagenta: '#BD114A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Centive', 'cursive'],
      },
    },
  },
  plugins: [],
}

