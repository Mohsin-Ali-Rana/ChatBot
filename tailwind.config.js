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
        obsidian: {
          DEFAULT: '#0b0f19',
          50: '#151c2e',
          100: '#111726',
          200: '#0e1320',
          300: '#0b0f19',
          400: '#080b12',
          500: '#05070b',
        },
        brand: {
          indigo: '#6366f1',
          purple: '#8b5cf6',
          violet: '#7c3aed',
          cyan: '#06b6d4',
          pink: '#ec4899',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glow-lg': '0 0 35px -5px rgba(139, 92, 246, 0.25), 0 0 15px -5px rgba(99, 102, 241, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'subtle-float': 'subtleFloat 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        subtleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
