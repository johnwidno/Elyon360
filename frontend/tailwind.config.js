/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        stripe: {
          blue: '#635bff',
          dark: '#0a2540',
          slate: '#425466',
          light: '#697386',
          purple: '#7a73ff',
          pink: '#f06292',
          cyan: '#00d4ff',
        },
        premium: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1E293B',
          subtext: '#64748B',
        },
        lovable: {
          navy: '#0f133d',
          deep: '#12162b',
          orange: '#ea762a',
          purple: '#2b2060',
          accent: '#191e57',
          light: '#f9f9fb',
        }
      },
      boxShadow: {
        'premium': '0 2px 5px -1px rgba(50, 50, 93, 0.25), 0 1px 3px -1px rgba(0, 0, 0, 0.3)',
        'premium-hover': '0 13px 27px -5px rgba(50, 50, 93, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.3)',
        'stripe': 'rgba(0, 0, 0, 0.04) 0px 3px 5px',
      },
      borderRadius: {
        'premium': '0.75rem',
        'super': '1.25rem',
      }
    },
  },
  plugins: [],
}
