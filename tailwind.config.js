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
        cream: '#FBF5E9',
        'cream-2': '#F4EBD6',
        'cream-3': '#EFE3C8',
        navy: '#16213E',
        'navy-2': '#1E2A4A',
        'navy-3': '#3A4664',
        'navy-dark': '#0F172A',
        'navy-card': '#1B2640',
        coral: '#FF6A5B',
        'coral-dark': '#E54A3B',
        lime: '#C6E84C',
        'lime-dark': '#A8CF2E',
        pink: '#FFD4C9',
        teal: '#7BCFB8',
        amber: '#FFB547',
        plum: '#9B7BC7',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(22, 33, 62, 0.08), 0 4px 24px -4px rgba(22, 33, 62, 0.06)',
        lifted: '0 12px 32px -8px rgba(22, 33, 62, 0.18), 0 4px 12px -4px rgba(22, 33, 62, 0.08)',
        coral: '0 10px 28px -8px rgba(255, 106, 91, 0.45)',
        lime: '0 10px 28px -8px rgba(168, 207, 46, 0.45)',
      }
    },
  },
  plugins: [],
}
