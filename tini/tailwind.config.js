// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          yellow: '#CC7722',
          blue: '#1e40af',
        }
      }
    },
  },
  plugins: [],
}