/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // mesma pilha do original
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // paleta puxada da logo neon: roxo -> magenta -> laranja -> amarelo
        neon: {
          roxo: '#8b5cf6',
          violeta: '#7c3bed',
          magenta: '#d946ef',
          rosa: '#ec4899',
          laranja: '#f97316',
          amarelo: '#fbbf24',
        },
        card: '#0c1011',
        borda: '#1f1f2e',
      },
      boxShadow: {
        card: '0 24px 60px -12px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.03) inset',
        neon: '0 0 30px -4px rgba(139,92,246,.55), 0 0 70px -10px rgba(236,72,153,.35)',
        'neon-forte':
          '0 0 40px -2px rgba(139,92,246,.7), 0 0 90px -8px rgba(236,72,153,.5), 0 0 130px -20px rgba(249,115,22,.35)',
      },
      keyframes: {
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-top': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        flutuar: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        aura: {
          '0%,100%': { opacity: '.45', transform: 'scale(1)' },
          '50%': { opacity: '.8', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'scale-in': 'scale-in .2s ease-out both',
        'slide-in-top': 'slide-in-top .3s ease-out both',
        flutuar: 'flutuar 4s ease-in-out infinite',
        aura: 'aura 4.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
