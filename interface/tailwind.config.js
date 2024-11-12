/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      // "light",
      "cupcake",
      // "emerald",
      // "corporate",
      // "garden",
      // "fantasy",
      // "retro",
      // "dark",
      // "bumblebee",
      // "dracula",
      // "forest",
      "business",
      // "nord",
      // "pastel",
      // "sunset",
      // "coffee",
      // "dim",
      // "night",
      // "luxury",
      // "black",
    ],
  },
};
