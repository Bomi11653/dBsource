/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { gold: "#ffffff", muted: "#141414" },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: ["Georgia", "Songti SC", "SimSun", "serif"],
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
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
