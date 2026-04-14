import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          muted: '#1E3A8A',
          subtle: '#1E40AF1A',
        },
        // Surface / Background (dark theme)
        bg: {
          base: '#0A0A0B',
          surface: '#111113',
          elevated: '#18181B',
          overlay: '#1F1F23',
          border: '#27272A',
          'border-strong': '#3F3F46',
        },
        // Text
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          muted: '#71717A',
          disabled: '#52525B',
        },
        // Status badges
        status: {
          saved:      { DEFAULT: '#3F3F46', text: '#A1A1AA' },
          applied:    { DEFAULT: '#1E3A8A', text: '#60A5FA' },
          interview:  { DEFAULT: '#78350F', text: '#FCD34D' },
          rejected:   { DEFAULT: '#7F1D1D', text: '#FCA5A5' },
        },
        // Semantic
        success: { DEFAULT: '#16A34A', muted: '#14532D' },
        warning: { DEFAULT: '#F59E0B', muted: '#78350F' },
        danger:  { DEFAULT: '#EF4444', muted: '#7F1D1D' },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'monospace'],
        sans: ['DM Sans', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
