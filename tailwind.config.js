/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { gold: "#2eb896", muted: "#141414" },
      },
      fontFamily: {
        sans: ["var(--font-main)"],
        serif: ["var(--font-accent)"],
      },
      letterSpacing: {
        body: "0.02em",
        heading: "0.04em",
      },
      lineHeight: {
        body: "1.7",
        heading: "1.6",
        relaxed: "1.75",
      },
    },
  },
  plugins: [],
};
