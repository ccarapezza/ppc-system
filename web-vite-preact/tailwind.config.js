/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#155799",
        secondary: "#159957"
      },
      animation: {
        'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-3': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 3',
      },
      keyframes: {
        'shake': {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)'
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)'
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)'
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)'
          }
        },
        'pulse-3': {
          '0%, 100%': {
            transform: 'scale(1)'
          },
          '50%': {
            transform: 'scale(1.05)'
          }
        }
      }
    },
  },
  plugins: [],
}

