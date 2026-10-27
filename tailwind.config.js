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
        good: v('good'),
        sand: v('sand'),
        night: v('night'),
        'night-2': v('night-2'),
        cream: v('cream'),
        'gold-light': v('gold-light'),
        lavender: v('lavender'),
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Tiro Gujarati"', '"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
        sans: ['"Hind Vadodara"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        deva: ['"Noto Sans Devanagari"', '"Hind Vadodara"', 'sans-serif'],
        serif: ['"Tiro Gujarati"', '"Tiro Devanagari Hindi"', 'Georgia', 'serif'],
      },
      borderRadius: { '2xl': '1.25rem', '3xl': '1.75rem', '4xl': '2.25rem' },
      boxShadow: {
        soft: '0 6px 24px -8px rgb(var(--shadow) / 0.25)',
        lift: '0 18px 44px -18px rgb(var(--shadow) / 0.45)',
        glow: '0 0 0 6px rgb(var(--saffron) / 0.18), 0 10px 30px -6px rgb(var(--saffron) / 0.6)',
      },
    },
  },
  plugins: [],
};
