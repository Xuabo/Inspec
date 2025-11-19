/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-midnight': '#111827', // Dark blue/gray bg
        'brand-slate': '#374151',    // Mid gray for cards/borders
        'brand-teal': '#14B8A6',     // Vibrant accent (was cyan)
        'brand-purple': '#8B5CF6',  // Secondary accent
        'brand-light': '#F3F4F6',    // Light text/bg
        'brand-muted': '#9CA3AF',   // Muted text
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}