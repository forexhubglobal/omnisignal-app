/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'omni-dark': '#0c0a12',
        'omni-card': '#1a1625',
        'omni-gold': '#d4af37',
        'omni-neon': '#00f3ff',
      }
    },
  },
  plugins: [],
}
