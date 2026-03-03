/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#080a0f',
          800: '#0d0f14',
          700: '#12151c',
          600: '#181c26',
          500: '#1e2330',
          400: '#252c3d',
          300: '#2e3850',
        },
        accent: {
          cyan:   '#00e5ff',
          blue:   '#3d8bff',
          green:  '#00ff88',
          amber:  '#ffb347',
          red:    '#ff4757',
          purple: '#a78bfa',
        },
        light: {
          900: '#ffffff',
          800: '#f8fafc',
          700: '#f1f5f9',
          600: '#e2e8f0',
          500: '#cbd5e1',
          400: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body:    ['"DM Sans"',   'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(0, 229, 255, 0.3)',
        'glow-blue':  '0 0 20px rgba(61, 139, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn':     'fadeIn 0.3s ease-out',
        'slideUp':    'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                               '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' },'100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
