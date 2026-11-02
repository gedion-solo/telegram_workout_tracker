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
        white: '#DAF1DE', // Default white to Swatch 6 (Bright Mint Cream) for complete theme harmony
        slate: {
          950: '#051F20', // Swatch 1: Canvas / page background
          900: '#0B2B26', // Swatch 2: Cards, modals, containers
          850: '#10322B', // Intermediate dark surface
          800: '#163832', // Swatch 3: Borders & elevated wells
          750: '#1D453E', // Hover borders
          700: '#235347', // Swatch 4: Structure, dark pill accents & borders
          600: '#3A6B5F', // Muted details
          500: '#5C8E81', // Muted labels
          400: '#8EB69B', // Swatch 5: Soft sage (secondary text, labels, icons)
          300: '#A8CCA8', // Light sage
          200: '#C7E4C7', // Very light mint text
          100: '#DAF1DE', // Swatch 6: Bright mint cream
          50:  '#EEF9EE',
        },
        emerald: {
          300: '#A8CCA8',
          400: '#8EB69B', // Swatch 5: Soft sage text/icons
          500: '#DAF1DE', // Swatch 6: Bright mint CTA buttons
          600: '#8EB69B',
        },
        pine: {
          950: '#051F20',
          900: '#0B2B26',
          800: '#163832',
          700: '#235347',
          400: '#8EB69B',
          100: '#DAF1DE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

