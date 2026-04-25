import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ac: {
          red: "#D82A20",
          ink: "#101218",
          paper: "#F7F5F2",
          muted: "#6B6F76",
          line: "#E5E2DC",
          mint: "#1F8C6A",
          amber: "#C77A1A",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
