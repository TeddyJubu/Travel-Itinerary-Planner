/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6', // Violet
          dark: '#6D28D9',
          light: '#A78BFA',
        },
        dark: {
          DEFAULT: '#111827',
          lighter: '#1F2937',
          light: '#374151',
        }
      },
    },
  },
  plugins: [],
} 