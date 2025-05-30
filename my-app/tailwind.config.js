/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // or "class" if you want to toggle dark mode manually
  theme: {
    extend: {
      colors: {
        primary: "#1E90FF",   // Custom blue
        secondary: "#FF6347", // Custom red
        neutral: "#F3F4F6",   // Light gray
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
      spacing: {
        18: "4.5rem", // Custom spacing
      },
      boxShadow: {
        soft: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Custom soft shadow
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
};
