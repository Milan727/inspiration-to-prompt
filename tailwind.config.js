/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Darkroom palette: near-black grounds, one warm "safelight" accent.
        ink: {
          950: '#0E0E0F',
          900: '#151517',
          850: '#1C1C20',
          800: '#222226',
          700: '#26262A',
          600: '#34343A',
          500: '#4A4A52',
          300: '#9A9AA2',
          100: '#EDEDEF',
        },
        safelight: {
          DEFAULT: '#FFB547',
          dim: '#E89F35',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
