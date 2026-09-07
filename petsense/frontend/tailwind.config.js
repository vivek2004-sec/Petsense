/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0E1217', 50: '#1A2030', 100: '#181D24', 200: '#12161C' },
        teal:   { DEFAULT: '#52B788', 400: '#6BC99E', 600: '#3D9A6F', 800: '#2D7454' },
        amber:  { DEFAULT: '#E5A84B', 400: '#F0BC6A', 600: '#C48A32' },
        rose:   { DEFAULT: '#E07A7A', 400: '#EC9898', 600: '#C45E5E' },
        purple: { DEFAULT: '#8B9FD4', 400: '#A8B8E0', 600: '#6B7FB8' },
        fg:     { DEFAULT: '#EDF0F4' },
        muted:  { DEFAULT: '#8B95A8' },
        subtle: { DEFAULT: '#5C677D' },
        accent: { DEFAULT: '#52B788' },
        surface:{ DEFAULT: '#181D24', raised: '#1E2430', border: '#2A3140' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #0E1217 0%, #121820 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'teal-gradient': 'linear-gradient(135deg, #00D4B4 0%, #00B89C 100%)',
        'pain-gradient': 'linear-gradient(135deg, #FF6B8A 0%, #E5547A 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 212, 180, 0.1)',
        glow:  '0 0 30px rgba(0, 212, 180, 0.3)',
        'pain-glow': '0 0 30px rgba(255, 107, 138, 0.3)',
        card:  '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'scan-line':   'scanLine 2s linear infinite',
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'shimmer':     'shimmer 2.5s ease-in-out infinite',
        'glow-pulse':  'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        scanLine: {
          '0%':   { top: '0%', opacity: '1' },
          '100%': { top: '100%', opacity: '0.3' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%':      { opacity: '0.55', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
