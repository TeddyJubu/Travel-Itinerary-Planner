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
        },
        cyan: {
          400: '#22D3EE',
        },
        purple: {
          400: '#A855F7',
        },
        pink: {
          500: '#EC4899',
        },
        amber: {
          400: '#FBBF24',
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-x': 'float-x 8s ease-in-out infinite',
        'float-y': 'float-y 5s ease-in-out infinite',
        bounce: 'bounce 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-20px) translateX(10px)' },
        },
        'float-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(20px)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
      boxShadow: {
        glow: '0 0 15px rgba(34, 211, 238, 0.3)',
        'glow-lg': '0 0 30px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
}