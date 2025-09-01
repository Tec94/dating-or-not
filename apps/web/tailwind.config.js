/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#ff4d6d",
          green: "#00d084",
          dark: "#101114",
        },
      },
    },
  },
  plugins: [],
};


