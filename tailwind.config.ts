import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5EF",
        ink: "#1C2B39",
        moss: "#2F6F62",
        mossDark: "#234F45",
        ochre: "#C08A2E",
        ochreLight: "#E9C77E",
        clay: "#B5544A",
        mist: "#D9DFD8",
        line: "#CBCABF",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
