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
      fontSize: {
        'app-micro': 'var(--font-size-micro)',
        'app-meta': 'var(--font-size-meta)',
        'app-body': 'var(--font-size-body)',
        'app-title': 'var(--font-size-title)',
      },
      colors: {
        // ─── BRAND DESIGN SYSTEM (référence: public homepage) ───────────────
        brand: {
          primary: '#1a1f4d',   // Navy principal — texte, sidebar, boutons
          dark:    '#0f133d',   // Dark mode fond principal
          deep:    '#12162b',   // Fond très sombre
          purple:  '#2b2060',   // Gradient secondaire
          accent:  '#191e57',   // Accent sombre
          orange:  '#ea762a',   // Orange — CTA, highlights, actif
          light:   '#f9f9fb',   // Fond clair
          card:    '#111C44',   // Dark mode cards/sidebar
        },
        // ─── Legacy aliases (ne pas supprimer pour rétrocompatibilité) ───────
        stripe: {
          blue: '#1a1f4d',      // Réaligné sur brand-primary
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
