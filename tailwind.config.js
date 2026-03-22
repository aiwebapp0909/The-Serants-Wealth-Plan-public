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
        background: '#0B0B0F',
        surface: '#15151C',
        "surface-container": '#1F1F23',
        "surface-container-high": '#2A2A35',
        primary: '#D4AF37', // Luxury Gold
        secondary: '#5D5FEF', // Accent blue
        tertiary: '#C1C1FF', // Accent purple
        success: '#00E676',
        error: '#FF5252',
        "on-surface": '#FFFFFF',
        "outline-variant": '#333340',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      }
    },
  },
  plugins: [],
}
