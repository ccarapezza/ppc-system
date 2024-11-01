/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  safelist: [
        {
            pattern: /(bg|text|border)-(green|red|blue|yellow|gray|orange|purple)-(300|500|700|800|900)/,
            variants: ['dark', 'hover', 'focus'],
        }
    ],
  theme: {
    extend: {},
  },
  plugins: [],
}