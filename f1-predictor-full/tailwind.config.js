const defaultTheme = require('tailwindcss/defaultTheme');
// Pull in Tailwind's default font stacks so we can extend them below.
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss,sass}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E10600",
          foreground: "#FFFFFF"
        },
        asphalt: {
          DEFAULT: "#1F1F1F",
          foreground: "#F5F5F5"
        }
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Rajdhani", ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        pitlane: "0 12px 50px -15px rgba(225, 6, 0, 0.5)"
      }
    }
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".text-shadow": {
          "text-shadow": "0 2px 12px rgba(0, 0, 0, 0.35)"
        },
        ".text-shadow-none": {
          "text-shadow": "none"
        }
      });
    })
  ]
};
