/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        earth: {
          50:  '#faf6f1',
          100: '#f0e8d9',
          200: '#e9e0d4',
          300: '#d4c4a8',
          400: '#b8a07e',
          500: '#8b9d77',
          600: '#75a191',
          700: '#5c4033',
          800: '#3d2a1f',
          900: '#2c2416',
          950: '#1f1a10',
        },
        sage: {
          50:  '#f4f7f2',
          100: '#e6ede1',
          200: '#cddcc4',
          300: '#a8c59b',
          400: '#8b9d77',
          500: '#6d825a',
          600: '#556844',
          700: '#425237',
          800: '#37422e',
          900: '#2f3827',
        },
        warm: {
          50:  '#fdf8f3',
          100: '#f9eddf',
          200: '#f2d9be',
          300: '#e8be94',
          400: '#d4a373',
          500: '#c4894f',
          600: '#b67544',
          700: '#985e3a',
          800: '#7b4c34',
          900: '#65402d',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        'blob': '60% 40% 55% 45% / 45% 55% 40% 60%',
        'blob-sm': '55% 45% 50% 50% / 50% 50% 45% 55%',
        'organic': '2rem',
          'organic-lg': '3rem',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'grow': 'grow 0.5s ease-in-out',
        'leaf-in': 'leaf-in 0.5s ease-out',
        'morph': 'morph 8s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        grow: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'leaf-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 55% 45% / 45% 55% 40% 60%' },
          '25%': { borderRadius: '40% 60% 45% 55% / 55% 45% 60% 40%' },
          '50%': { borderRadius: '55% 45% 40% 60% / 40% 60% 55% 45%' },
          '75%': { borderRadius: '45% 55% 60% 40% / 60% 40% 45% 55%' },
        },
      },
    },
  },
  plugins: [],
};