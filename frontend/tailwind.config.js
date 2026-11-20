/** @type {import('tailwindcss').Config} */

// Brand blue for actions, links, focus and selection.
const accent = {
  50: '#eff4ff', 100: '#dce7fe', 200: '#bcd1fc', 300: '#8eb1f8', 400: '#5a88f0',
  500: '#3a6ae6', 600: '#2557d6', 700: '#1d45ad', 800: '#1d3b8a', 900: '#1d346e', 950: '#142146',
};

// Cool slate greys, the usual text palette for job portals.
const neutral = {
  50: '#f9fafb', 100: '#f2f4f7', 200: '#e4e7ec', 300: '#d0d5dd', 400: '#98a2b3',
  500: '#667085', 600: '#475467', 700: '#344054', 800: '#1d2939', 900: '#101828', 950: '#0c111d',
};

module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        accent,
        gray: neutral,
        // Older markup used purple/violet/pink as the brand colour; map them to the accent.
        purple: accent, violet: accent, pink: accent, fuchsia: accent, indigo: accent,
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'slide-up': 'slideUp 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
