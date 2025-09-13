module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        oswald: ["Oswald", "sans-serif"],
        "playfair-display": ["Playfair Display", "serif"],
          sans: ['Lato', 'sans-serif'],
        lato: ["Lato", "sans-serif"],
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.3s ease-out forwards',
        slideDown: 'slideDown 0.3s ease-in forwards',
      },
    },
  },
  plugins: [],
};
