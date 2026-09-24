/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        iz: {
          primary: '#0ea5e9',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          danger: '#ef4444',
          success: '#22c55e',
          warning: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
