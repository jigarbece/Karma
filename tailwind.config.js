/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        saffron: v('saffron'),
        'saffron-text': v('saffron-text'),
        gold: v('gold'),
        indigo: v('indigo'),
        'indigo-soft': v('indigo-soft'),
        punya: v('gold'),
        paap: v('indigo'),
      },
      fontFamily: {
        sans: ['"Hind Vadodara"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        deva: ['"Noto Sans Devanagari"', '"Hind Vadodara"', 'sans-serif'],
        serif: ['"Tiro Gujarati"', '"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        soft: '0 6px 24px -8px rgb(var(--shadow) / 0.25)',
        glow: '0 0 0 6px rgb(var(--saffron) / 0.18), 0 10px 30px -6px rgb(var(--saffron) / 0.6)',
      },
    },
  },
  plugins: [],
};
