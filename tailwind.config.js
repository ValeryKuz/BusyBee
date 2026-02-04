/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          DEFAULT: '#FCFFA6',
          dark: '#E8EB7A',
          light: '#FEFFD6',
        },
        mint: {
          DEFAULT: '#C1FFD7',
          dark: '#9BE8B8',
          light: '#E0FFEB',
        },
        sky: {
          DEFAULT: '#B5DEFF',
          dark: '#8EC9F0',
          light: '#DAF0FF',
        },
        lavender: {
          DEFAULT: '#CAB8FF',
          dark: '#A890E8',
          light: '#E4DBFF',
        },
        coral: '#FF9B9B',
        cream: '#FFFEF5',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'medium': '0 6px 30px rgba(0, 0, 0, 0.1)',
        'glow-honey': '0 0 20px rgba(252, 255, 166, 0.6)',
        'glow-mint': '0 0 20px rgba(193, 255, 215, 0.6)',
        'glow-sky': '0 0 20px rgba(181, 222, 255, 0.6)',
        'glow-lavender': '0 0 20px rgba(202, 184, 255, 0.6)',
      },
      animation: {
        'bounce-custom': 'bounce-custom 0.6s ease-in-out',
        'pop-in': 'pop-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'pulse-custom': 'pulse-custom 2s ease-in-out infinite',
      },
      keyframes: {
        'bounce-custom': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-custom': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
