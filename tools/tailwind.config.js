/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../site/index.html',
    '../site/offline.html',
    '../site/js/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', 'sans-serif'],
        serif: ['"Noto Serif TC"', '"Songti TC"', 'serif']
      },
      colors: {
        gold: {
          50:  '#fcf8eb',
          100: '#f8efcd',
          200: '#f2dea3',
          300: '#eac56a',
          400: '#e3a939',
          500: '#d98f22',
          600: '#be701a',
          700: '#9a5a15',
          800: '#6d3f12',
          900: '#462711'
        },
        dark: {
          700: '#242424',
          800: '#1a1a1a',
          900: '#101010',
          950: '#0a0a0a'
        }
      }
    }
  },
  plugins: []
};
