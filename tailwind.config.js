/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#6B1E23',
          light: '#8A2E33',
          dark: '#4A1418',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E0C368',
          dark: '#9C7D1D',
        },
        teal: {
          DEFAULT: '#1F5C57',
          light: '#2D7A73',
          dark: '#123B37',
        },
        ivory: '#FBF6EE',
        sand: '#F1E7D8',
        ink: {
          DEFAULT: '#2A211D',
          soft: '#5A4E47',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      boxShadow: {
        card: '0 8px 30px -10px rgba(42, 33, 29, 0.25)',
      },
    },
  },
  plugins: [],
}
