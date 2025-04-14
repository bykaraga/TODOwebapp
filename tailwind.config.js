/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#1C1C1E',
          secondary: '#2C2C2E',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
} 