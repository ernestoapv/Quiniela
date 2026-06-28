import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0b6b3a",
        pitchDark: "#075028",
      },
    },
  },
  plugins: [],
};

export default config;
